#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CHART_DIR="${REPO_ROOT}/charts/odh-dashboard"

# shellcheck source=lib/helm-utils.sh
source "${SCRIPT_DIR}/lib/helm-utils.sh"

NAMESPACE="${NAMESPACE:-odh-dashboard}"
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-odh-dashboard}"
SKIP_BUILD="${SKIP_BUILD:-false}"
FORCE_BUILD="${FORCE_BUILD:-false}"
BUILD_PLUGINS="${BUILD_PLUGINS:-false}"
CLEAN="${CLEAN:-false}"
HELM_RELEASE="${HELM_RELEASE:-odh-dashboard}"

# Registry mode: when REGISTRY is set, images are pulled from the registry
# instead of being built locally and loaded into Kind.
REGISTRY="${REGISTRY:-}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-$(command -v docker &>/dev/null && echo docker || echo podman)}"

if [ -n "${REGISTRY}" ]; then
  IMAGE="${REGISTRY}/odh-dashboard:${IMAGE_TAG}"
  MR_UI_IMAGE="${REGISTRY}/model-registry-ui:${IMAGE_TAG}"
  MAAS_UI_IMAGE="${REGISTRY}/maas-ui:${IMAGE_TAG}"
  SKIP_BUILD=true
else
  IMAGE="${IMAGE:-odh-dashboard:latest}"
  MR_UI_IMAGE="model-registry-ui:latest"
  MAAS_UI_IMAGE="maas-ui:latest"
fi

echo "=== ODH Dashboard Kind Deployment (Helm) ==="
echo "  Namespace:       ${NAMESPACE}"
echo "  Image:           ${IMAGE}"
echo "  Kind cluster:    ${KIND_CLUSTER_NAME}"
echo "  Helm release:    ${HELM_RELEASE}"
echo "  Build plugins:   ${BUILD_PLUGINS}"
echo "  Container engine: ${CONTAINER_ENGINE}"
[ -n "${REGISTRY}" ] && echo "  Registry:        ${REGISTRY}" || echo "  Registry:        (local build)"
echo ""

# --- 1. Create Kind cluster + NGINX Ingress ---
"${SCRIPT_DIR}/create-kind-cluster.sh"

# --- 3. Build and load images ---
IMAGE_REBUILT=false
PLUGINS_REBUILT=false

load_image_to_kind() {
  local img="$1"
  if [ -n "${REGISTRY}" ]; then
    echo ">>> Pulling ${img} and loading into Kind..."
    ${CONTAINER_ENGINE} pull "${img}"
  fi
  kind load docker-image "${img}" --name "${KIND_CLUSTER_NAME}"
}

if [ "${SKIP_BUILD}" = "true" ]; then
  if [ -z "${REGISTRY}" ]; then
    echo "ERROR: SKIP_BUILD=true requires REGISTRY to be set (images must come from somewhere)."
    exit 1
  fi
  echo ">>> Skipping image build (SKIP_BUILD=true)."
  echo ">>> Loading dashboard image from registry..."
  load_image_to_kind "${IMAGE}"
  IMAGE_REBUILT=true
elif [ "${FORCE_BUILD}" != "true" ] && \
     ${CONTAINER_ENGINE} exec "${KIND_CLUSTER_NAME}-control-plane" crictl images -o json 2>/dev/null \
     | grep -q "$(echo "${IMAGE}" | cut -d: -f1)"; then
  echo ">>> Image '${IMAGE}' already present in Kind node, skipping build."
  echo "    (set FORCE_BUILD=true to force a rebuild)"
else
  echo ">>> Building dashboard container image '${IMAGE}'..."
  ${CONTAINER_ENGINE} build -t "${IMAGE}" -f "${REPO_ROOT}/Dockerfile" "${REPO_ROOT}"
  echo ">>> Loading image into Kind cluster..."
  kind load docker-image "${IMAGE}" --name "${KIND_CLUSTER_NAME}"
  IMAGE_REBUILT=true
fi

if [ -n "${REGISTRY}" ] && [ "${BUILD_PLUGINS}" = "true" ]; then
  echo ">>> Loading plugin images from registry..."
  load_image_to_kind "${MR_UI_IMAGE}"
  load_image_to_kind "${MAAS_UI_IMAGE}"
  PLUGINS_REBUILT=true
elif [ "${BUILD_PLUGINS}" = "true" ] || [ "${FORCE_BUILD}" = "true" ]; then
  echo ">>> Building model-registry-ui image..."
  ${CONTAINER_ENGINE} build \
    --file "${REPO_ROOT}/packages/model-registry/Dockerfile.workspace" \
    --build-arg DEPLOYMENT_MODE=federated \
    -t "${MR_UI_IMAGE}" "${REPO_ROOT}"

  echo ">>> Building maas-ui image..."
  ${CONTAINER_ENGINE} build \
    --file "${REPO_ROOT}/packages/maas/Dockerfile.workspace" \
    --build-arg DEPLOYMENT_MODE=federated \
    -t "${MAAS_UI_IMAGE}" "${REPO_ROOT}"

  echo ">>> Loading plugin images into Kind cluster..."
  kind load docker-image "${MR_UI_IMAGE}" --name "${KIND_CLUSTER_NAME}"
  kind load docker-image "${MAAS_UI_IMAGE}" --name "${KIND_CLUSTER_NAME}"
  PLUGINS_REBUILT=true
fi

# --- 4. Determine Helm set overrides ---
IMAGE_REPO="${IMAGE%:*}"
IMAGE_TAG_RESOLVED="${IMAGE##*:}"
HELM_SETS=(
  --set "image.repository=${IMAGE_REPO}"
  --set "image.tag=${IMAGE_TAG_RESOLVED}"
)

PLUGINS_AVAILABLE=false
if [ "${PLUGINS_REBUILT}" = "true" ] || \
   ${CONTAINER_ENGINE} exec "${KIND_CLUSTER_NAME}-control-plane" crictl images -o json 2>/dev/null | grep -q "model-registry-ui"; then
  PLUGINS_AVAILABLE=true
fi

if [ "${PLUGINS_AVAILABLE}" = "true" ]; then
  MR_UI_REPO="${MR_UI_IMAGE%:*}"
  MR_UI_TAG="${MR_UI_IMAGE##*:}"
  MAAS_UI_REPO="${MAAS_UI_IMAGE%:*}"
  MAAS_UI_TAG="${MAAS_UI_IMAGE##*:}"
  HELM_SETS+=(
    --set "plugins.modelRegistry.enabled=true"
    --set "plugins.modelRegistry.image.repository=${MR_UI_REPO}"
    --set "plugins.modelRegistry.image.tag=${MR_UI_TAG}"
    --set "plugins.modelRegistry.server.enabled=true"
    --set "plugins.maas.enabled=true"
    --set "plugins.maas.image.repository=${MAAS_UI_REPO}"
    --set "plugins.maas.image.tag=${MAAS_UI_TAG}"
    --set "federation.modelRegistry.enabled=true"
    --set "federation.maas.enabled=true"
  )

  # Pull and load third-party images (pins from lib/helm-utils.sh, Thanos from quay.io)
  for img in "${MR_SERVER_IMAGE}" "${PG_IMAGE}" "${BUSYBOX_IMAGE}" "${PERSES_IMAGE}" "${PROM_IMAGE}" "${THANOS_IMAGE}"; do
    if ! ${CONTAINER_ENGINE} exec "${KIND_CLUSTER_NAME}-control-plane" crictl images -o json 2>/dev/null | grep -q "$(echo "${img}" | cut -d: -f1)"; then
      echo ">>> Pulling ${img}..."
      ${CONTAINER_ENGINE} pull "${img}"
      echo ">>> Loading ${img} into Kind..."
      kind load docker-image "${img}" --name "${KIND_CLUSTER_NAME}"
    else
      echo ">>> Image '${img}' already in Kind, skipping."
    fi
  done
else
  # Even without plugins, ensure Perses + Prometheus + Thanos images are available
  for img in "${PERSES_IMAGE}" "${PROM_IMAGE}" "${THANOS_IMAGE}"; do
    if ! ${CONTAINER_ENGINE} exec "${KIND_CLUSTER_NAME}-control-plane" crictl images -o json 2>/dev/null | grep -q "$(echo "${img}" | cut -d: -f1)"; then
      echo ">>> Pulling ${img}..."
      ${CONTAINER_ENGINE} pull "${img}"
      echo ">>> Loading ${img} into Kind..."
      kind load docker-image "${img}" --name "${KIND_CLUSTER_NAME}"
    else
      echo ">>> Image '${img}' already in Kind, skipping."
    fi
  done
fi

# --- 5. Optionally clean previous state ---
if [ "${CLEAN}" = "true" ]; then
  echo ">>> Cleaning up previous deployment (CLEAN=true)..."
  helm uninstall "${HELM_RELEASE}" -n "${NAMESPACE}" --no-hooks --wait 2>/dev/null || true

  clean_ns "${NAMESPACE}"

  echo ">>> Cleaning sample-project namespace..."
  clean_ns "sample-project"

  kubectl delete clusterrole odh-dashboard odh-dashboard-dsg dsg-cluster-roles --ignore-not-found 2>/dev/null || true
  kubectl delete clusterrolebinding odh-dashboard odh-dashboard-auth-delegator kind-admin-local --ignore-not-found 2>/dev/null || true
  echo "    Cleanup complete."
else
  echo ">>> Skipping cleanup (set CLEAN=true to wipe previous deployment)."
fi

kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

echo ">>> Ensuring 'sample-project' namespace exists..."
kubectl create namespace sample-project --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace sample-project opendatahub.io/dashboard=true --overwrite 2>/dev/null || true

# --- 6. Pre-install CRDs (Helm can't create CRs in the same install as their CRDs) ---
echo ">>> Pre-installing CRDs..."
kustomize build "${REPO_ROOT}/manifests/common/crd" | kubectl apply -f -
kubectl apply -f "${REPO_ROOT}/manifests/overlays/kind/crds/"
echo ">>> Waiting for CRDs to be established..."
kubectl wait --for=condition=Established crd --all --timeout=30s 2>/dev/null || true

# --- 7. Helm install ---
# Helm 4 uses server-side apply which has schema issues with CRD stubs.
# Render the chart and apply with kubectl as a workaround.
# We inject default namespace for resources that don't declare one, so
# cross-namespace resources (sample-project) keep their explicit namespace.
echo ">>> Rendering and applying Helm chart..."
RENDERED=$(helm template "${HELM_RELEASE}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" \
  -f "${CHART_DIR}/values-kind.yaml" \
  "${HELM_SETS[@]}")

RENDERED=$(echo "${RENDERED}" | inject_namespace "${NAMESPACE}")

echo "${RENDERED}" | kubectl apply -f - --server-side --force-conflicts 2>&1 \
  | grep -v "^Warning:"

# --- 8. Restart pods if images were rebuilt (tag doesn't change) ---
if [ "${IMAGE_REBUILT}" = "true" ]; then
  echo ">>> Image was rebuilt; restarting dashboard pods..."
  kubectl rollout restart deployment/odh-dashboard -n "${NAMESPACE}"
fi

if [ "${PLUGINS_REBUILT}" = "true" ]; then
  echo ">>> Plugin images were rebuilt; restarting plugin pods..."
  kubectl rollout restart deployment/model-registry-ui -n "${NAMESPACE}" 2>/dev/null || true
  kubectl rollout restart deployment/maas-ui -n "${NAMESPACE}" 2>/dev/null || true
fi

echo ">>> Waiting for deployment rollout..."
kubectl rollout status deployment/odh-dashboard -n "${NAMESPACE}" --timeout=120s

# --- 9. Seed mock/stub data (status patches, sample models) ---
NAMESPACE="${NAMESPACE}" SAMPLE_NS="${SAMPLE_NS:-sample-project}" \
  "${SCRIPT_DIR}/seed-data.sh"

echo ""
echo "=== Deployment complete ==="
echo "  Dashboard URL: http://odh-dashboard.127.0.0.1.nip.io"
echo ""
echo "  If the URL doesn't work, you can also port-forward:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/odh-dashboard 8080:8080"
echo "    Then open: http://localhost:8080"
echo ""
echo "  To enable model-registry and MaaS plugins (requires Go toolchain):"
echo "    BUILD_PLUGINS=true ./install/deploy-kind-helm.sh"
