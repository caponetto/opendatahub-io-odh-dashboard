#!/usr/bin/env bash
# ------------------------------------------------------------------
# deploy-openshift-helm.sh
#
# Deploy odh-dashboard on a standalone OpenShift cluster (no RHOAI/
# ODH operator) using the Helm chart with OpenShift-specific values.
#
# Prerequisites:
#   - oc / kubectl logged into the target cluster
#   - helm v3+ installed
#   - (optional) images pre-pushed to a registry via push-images.sh
#
# Environment variables:
#   NAMESPACE        – target namespace           (default: odh-dashboard)
#   REGISTRY         – pull images from registry  (default: empty = local)
#   IMAGE_TAG        – image tag when using REGISTRY (default: latest)
#   BUILD_PLUGINS    – build plugin images locally (default: false)
#   FORCE_BUILD      – force rebuild of images    (default: false)
#   SKIP_BUILD       – skip all builds            (default: false)
#   SKIP_CRD_INSTALL – skip ODH CRD pre-install   (default: false)
#   CLEAN            – wipe previous deployment    (default: false)
# ------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
CHART_DIR="${REPO_ROOT}/charts/odh-dashboard"

# shellcheck source=lib/helm-utils.sh
source "${SCRIPT_DIR}/lib/helm-utils.sh"

NAMESPACE="${NAMESPACE:-odh-dashboard}"
# Read sampleNamespace from values-openshift.yaml if SAMPLE_NS not explicitly set
if [ -z "${SAMPLE_NS:-}" ]; then
  _vals_sample_ns=$(grep 'sampleNamespace:' "${CHART_DIR}/values-openshift.yaml" 2>/dev/null | awk '{print $2}' | tr -d '"' | tr -d "'")
  SAMPLE_NS="${_vals_sample_ns:-${NAMESPACE}}"
  [ -z "${SAMPLE_NS}" ] && SAMPLE_NS="${NAMESPACE}"
fi
SKIP_BUILD="${SKIP_BUILD:-false}"
FORCE_BUILD="${FORCE_BUILD:-false}"
BUILD_PLUGINS="${BUILD_PLUGINS:-false}"
HELM_RELEASE="${HELM_RELEASE:-odh-dashboard}"
SKIP_CRD_INSTALL="${SKIP_CRD_INSTALL:-false}"
CLEAN="${CLEAN:-false}"

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

echo "=== ODH Dashboard OpenShift Deployment (Helm) ==="
echo "  Namespace:       ${NAMESPACE}"
echo "  Image:           ${IMAGE}"
echo "  Helm release:    ${HELM_RELEASE}"
echo "  Build plugins:   ${BUILD_PLUGINS}"
echo "  Clean first:     ${CLEAN}"
[ -n "${REGISTRY}" ] && echo "  Registry:        ${REGISTRY}" || echo "  Registry:        (local build)"
echo ""

# --- 0. Verify cluster access ---
if kubectl auth whoami &>/dev/null; then
  CURRENT_USER=$(kubectl auth whoami -o jsonpath='{.status.userInfo.username}' 2>/dev/null)
elif command -v oc &>/dev/null && oc whoami &>/dev/null; then
  CURRENT_USER=$(oc whoami 2>/dev/null)
else
  echo "ERROR: Cannot connect to cluster. Make sure you are logged in (oc login / kubeconfig)."
  exit 1
fi

CURRENT_CTX=$(kubectl config current-context 2>/dev/null || echo "unknown")
echo ">>> Connected to context: ${CURRENT_CTX} (user: ${CURRENT_USER})"

# Detect OpenShift by checking for route.openshift.io API
if kubectl api-resources --api-group=route.openshift.io &>/dev/null 2>&1; then
  echo ">>> OpenShift cluster detected."
else
  echo "WARNING: route.openshift.io API not found. This script is designed for OpenShift."
  echo "         For vanilla Kubernetes, use deploy-kind-helm.sh instead."
  read -rp "Continue anyway? [y/N] " confirm
  [ "${confirm}" = "y" ] || [ "${confirm}" = "Y" ] || exit 0
fi
echo ""

# --- 1. Build images (local build only, no Kind image-load) ---
IMAGE_REBUILT=false
PLUGINS_REBUILT=false

if [ "${SKIP_BUILD}" = "true" ]; then
  echo ">>> Skipping image build (SKIP_BUILD=true / REGISTRY mode)."
elif [ "${FORCE_BUILD}" != "true" ]; then
  echo ">>> Skipping local build (set FORCE_BUILD=true to build locally)."
  echo "    For OpenShift, push images to a registry first:"
  echo "      REGISTRY=quay.io/my-org make push-images"
else
  echo ">>> Building dashboard container image '${IMAGE}'..."
  ${CONTAINER_ENGINE} build -t "${IMAGE}" -f "${REPO_ROOT}/Dockerfile" "${REPO_ROOT}"
  IMAGE_REBUILT=true

  if [ "${BUILD_PLUGINS}" = "true" ]; then
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
    PLUGINS_REBUILT=true
  fi
fi

# --- 2. Determine Helm set overrides ---
IMAGE_REPO="${IMAGE%:*}"
IMAGE_TAG_RESOLVED="${IMAGE##*:}"
HELM_SETS=(
  --set "image.repository=${IMAGE_REPO}"
  --set "image.tag=${IMAGE_TAG_RESOLVED}"
  --set "sampleNamespace=${SAMPLE_NS}"
)

if [ -n "${REGISTRY}" ]; then
  HELM_SETS+=(--set "image.pullPolicy=Always")
  # Override Docker Hub images with registry mirrors to avoid rate limits
  HELM_SETS+=(
    --set "plugins.modelRegistry.server.postgres.image=${REGISTRY}/postgres:16"
    --set "plugins.modelRegistry.server.initImage=${REGISTRY}/busybox:1.37"
    --set "mocks.perses.image=${REGISTRY}/perses:v0.42.1"
  )
fi

PLUGINS_AVAILABLE=false
if [ "${PLUGINS_REBUILT}" = "true" ] || [ -n "${REGISTRY}" ]; then
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
    --set "plugins.modelRegistry.image.pullPolicy=Always"
    --set "plugins.modelRegistry.server.enabled=true"
    --set "plugins.maas.enabled=true"
    --set "plugins.maas.image.repository=${MAAS_UI_REPO}"
    --set "plugins.maas.image.tag=${MAAS_UI_TAG}"
    --set "plugins.maas.image.pullPolicy=Always"
    --set "federation.modelRegistry.enabled=true"
    --set "federation.maas.enabled=true"
  )
fi

# --- 3. Ensure namespaces and (optionally) clean previous state ---
if [ "${CLEAN}" = "true" ]; then
  echo ">>> Cleaning up previous deployment (CLEAN=true)..."
  helm uninstall "${HELM_RELEASE}" -n "${NAMESPACE}" --no-hooks --wait 2>/dev/null || true

  # clean_ns sourced from lib/helm-utils.sh
  clean_ns "${NAMESPACE}"

  if [ "${SAMPLE_NS}" != "${NAMESPACE}" ]; then
    clean_ns "${SAMPLE_NS}"
  fi

  kubectl delete clusterrole odh-dashboard odh-dashboard-dsg dsg-cluster-roles --ignore-not-found 2>/dev/null || true
  kubectl delete clusterrolebinding odh-dashboard odh-dashboard-auth-delegator --ignore-not-found 2>/dev/null || true

  # Remove orphaned admission webhooks from a previous ODH/RHOAI operator install.
  echo ">>> Removing orphaned admission webhooks (if any)..."
  for mwh in $(kubectl get mutatingwebhookconfiguration -o name 2>/dev/null \
    | grep -E "odh-model-controller|model-registry-operator" || true); do
    echo "    Deleting ${mwh}..."
    kubectl delete "${mwh}" --ignore-not-found 2>/dev/null || true
  done
  for vwh in $(kubectl get validatingwebhookconfiguration -o name 2>/dev/null \
    | grep -E "odh-model-controller|model-registry-operator" || true); do
    echo "    Deleting ${vwh}..."
    kubectl delete "${vwh}" --ignore-not-found 2>/dev/null || true
  done
  echo "    Cleanup complete."
else
  echo ">>> Skipping cleanup (set CLEAN=true to wipe previous deployment)."
fi

kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -
kubectl label namespace "${NAMESPACE}" opendatahub.io/dashboard=true --overwrite 2>/dev/null || true

if [ "${SAMPLE_NS}" != "${NAMESPACE}" ]; then
  echo ">>> Ensuring '${SAMPLE_NS}' namespace exists..."
  kubectl create namespace "${SAMPLE_NS}" --dry-run=client -o yaml | kubectl apply -f -
  kubectl label namespace "${SAMPLE_NS}" opendatahub.io/dashboard=true --overwrite 2>/dev/null || true
fi

# --- 4. Pre-install CRDs ---
if [ "${SKIP_CRD_INSTALL}" != "true" ]; then
  echo ">>> Pre-installing ODH CRDs..."
  kustomize build "${REPO_ROOT}/manifests/common/crd" | kubectl apply -f -

  # On OpenShift, skip CRD stubs for APIs that are native or already managed by operators.
  SKIP_CRDS="route.openshift.io|image.openshift.io|template.openshift.io|trustyai.opendatahub.io"
  for crd_file in "${REPO_ROOT}"/manifests/overlays/kind/crds/*.yaml; do
    if echo "${crd_file}" | grep -qE "${SKIP_CRDS}"; then
      echo "    Skipping: $(basename "${crd_file}")"
    else
      kubectl apply -f "${crd_file}" 2>&1 | grep -v "^Warning:" || true
    fi
  done

  echo ">>> Waiting for CRDs to be established..."
  kubectl wait --for=condition=Established crd --all --timeout=30s 2>/dev/null || true
else
  echo ">>> Skipping CRD install (SKIP_CRD_INSTALL=true)."
fi

# --- 5. Render and apply Helm chart ---
echo ">>> Rendering and applying Helm chart..."
RENDERED=$(helm template "${HELM_RELEASE}" "${CHART_DIR}" \
  --namespace "${NAMESPACE}" \
  -f "${CHART_DIR}/values-openshift.yaml" \
  "${HELM_SETS[@]}")

RENDERED=$(echo "${RENDERED}" | inject_namespace "${NAMESPACE}")

APPLY_OUTPUT=$(echo "${RENDERED}" | kubectl apply -f - --server-side --force-conflicts 2>&1 || true)
echo "${APPLY_OUTPUT}" | grep -v "^Warning:"
if echo "${APPLY_OUTPUT}" | grep -q "^Error"; then
  echo ""
  echo "WARNING: Some resources failed to apply (see errors above)."
  echo "         This is often caused by orphaned webhooks or missing operators."
  echo "         The deployment will continue with the resources that succeeded."
  echo ""
fi

# --- 6. Wait for rollout ---
echo ">>> Waiting for deployment rollout..."
kubectl rollout status deployment/odh-dashboard -n "${NAMESPACE}" --timeout=120s

# --- 7. Seed mock/stub data (status patches, sample models) ---
NAMESPACE="${NAMESPACE}" SAMPLE_NS="${SAMPLE_NS:-sample-project}" \
  "${SCRIPT_DIR}/seed-data.sh"

# --- 8. Print access info ---
ROUTE_HOST=$(kubectl get route odh-dashboard -n "${NAMESPACE}" -o jsonpath='{.spec.host}' 2>/dev/null || true)

echo ""
echo "=== Deployment complete ==="
if [ -n "${ROUTE_HOST}" ]; then
  echo "  Dashboard URL: https://${ROUTE_HOST}"
else
  echo "  Route not found. Access via port-forward:"
  echo "    kubectl port-forward -n ${NAMESPACE} svc/odh-dashboard 8080:8080"
  echo "    Then open: http://localhost:8080"
fi
echo ""
echo "  To enable model-registry and MaaS plugins, push images to a registry first:"
echo "    REGISTRY=quay.io/my-org make push-images"
echo "  Then deploy with:"
echo "    REGISTRY=quay.io/my-org BUILD_PLUGINS=true make deploy-openshift-helm"
