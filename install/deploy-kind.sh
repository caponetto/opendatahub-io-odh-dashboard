#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
KUSTOMIZE_DIR="${REPO_ROOT}/manifests/overlays/kind"
CRD_DIR="${REPO_ROOT}/manifests/common/crd"

NAMESPACE="${NAMESPACE:-odh-dashboard}"
IMAGE="${IMAGE:-odh-dashboard:latest}"
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-odh-dashboard}"
SKIP_BUILD="${SKIP_BUILD:-false}"
BUILD_PLUGINS="${BUILD_PLUGINS:-false}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-$(command -v docker &>/dev/null && echo docker || echo podman)}"

echo "=== ODH Dashboard Kind Deployment ==="
echo "  Namespace:       ${NAMESPACE}"
echo "  Image:           ${IMAGE}"
echo "  Kind cluster:    ${KIND_CLUSTER_NAME}"
echo "  Build plugins:   ${BUILD_PLUGINS}"
echo ""

# --- 1. Create Kind cluster + NGINX Ingress ---
"${SCRIPT_DIR}/create-kind-cluster.sh"

# --- 3. Build and load the dashboard image ---
FORCE_BUILD="${FORCE_BUILD:-false}"
if [ "${SKIP_BUILD}" = "true" ]; then
  echo ">>> Skipping image build (SKIP_BUILD=true)."
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

# --- 3b. Build and load plugin UI images (optional, controlled by BUILD_PLUGINS) ---
if [ "${BUILD_PLUGINS}" = "true" ] || [ "${FORCE_BUILD}" = "true" ]; then
  MR_IMAGE="model-registry-ui:latest"
  MAAS_IMAGE="maas-ui:latest"

  echo ">>> Building model-registry-ui image..."
  ${CONTAINER_ENGINE} build \
    --file "${REPO_ROOT}/packages/model-registry/Dockerfile.workspace" \
    --build-arg DEPLOYMENT_MODE=federated \
    -t "${MR_IMAGE}" "${REPO_ROOT}"

  echo ">>> Building maas-ui image..."
  ${CONTAINER_ENGINE} build \
    --file "${REPO_ROOT}/packages/maas/Dockerfile.workspace" \
    --build-arg DEPLOYMENT_MODE=federated \
    -t "${MAAS_IMAGE}" "${REPO_ROOT}"

  echo ">>> Loading plugin images into Kind cluster..."
  kind load docker-image "${MR_IMAGE}" --name "${KIND_CLUSTER_NAME}"
  kind load docker-image "${MAAS_IMAGE}" --name "${KIND_CLUSTER_NAME}"
  PLUGINS_REBUILT=true
fi

# --- 4. Create namespace ---
echo ">>> Ensuring namespace '${NAMESPACE}' exists..."
kubectl create namespace "${NAMESPACE}" --dry-run=client -o yaml | kubectl apply -f -

# --- 5. Install CRDs first (must be registered before CRs can be created) ---
echo ">>> Installing ODH CRDs..."
kustomize build "${CRD_DIR}" | kubectl apply -f -

echo ">>> Installing additional CRD stubs for Kind..."
kubectl apply -f "${KUSTOMIZE_DIR}/crds/"

echo ">>> Waiting for all CRDs to be established..."
kubectl wait --for=condition=Established \
  crd/odhdashboardconfigs.opendatahub.io \
  crd/servingruntimes.serving.kserve.io \
  crd/inferenceservices.serving.kserve.io \
  crd/llminferenceservices.serving.kserve.io \
  crd/llminferenceserviceconfigs.serving.kserve.io \
  crd/hardwareprofiles.infrastructure.opendatahub.io \
  crd/notebooks.kubeflow.org \
  crd/datasciencepipelinesapplications.datasciencepipelinesapplications.opendatahub.io \
  crd/trustyaiservices.trustyai.opendatahub.io \
  crd/rayjobs.ray.io \
  crd/trainjobs.trainer.kubeflow.org \
  crd/auths.services.platform.opendatahub.io \
  crd/imagestreams.image.openshift.io \
  crd/routes.route.openshift.io \
  crd/templates.template.openshift.io \
  crd/clusterqueues.kueue.x-k8s.io \
  crd/localqueues.kueue.x-k8s.io \
  crd/workloads.kueue.x-k8s.io \
  crd/datascienceclusters.datasciencecluster.opendatahub.io \
  crd/modelregistries.modelregistry.opendatahub.io \
  --timeout=30s

# --- 6. Deploy mock pipeline server ---
echo ">>> Ensuring 'sample-project' namespace exists for mock pipeline server..."
kubectl create namespace sample-project --dry-run=client -o yaml | kubectl apply -f -

echo ">>> Deploying mock pipeline server..."
kubectl apply -f "${KUSTOMIZE_DIR}/mock-pipeline-server/deployment.yaml"

echo ">>> Waiting for mock pipeline server to be ready..."
kubectl rollout status deployment/mock-pipeline-server -n sample-project --timeout=120s

# --- 6b. Deploy mock Perses server ---
echo ">>> Deploying mock Perses server..."
kubectl apply -f "${KUSTOMIZE_DIR}/data-science-perses/deployment.yaml"

echo ">>> Waiting for mock Perses server to be ready..."
kubectl rollout status deployment/data-science-perses -n "${NAMESPACE}" --timeout=120s

# --- 6c. Deploy plugin UI services (if images are available) ---
if [ "${PLUGINS_REBUILT:-false}" = "true" ] || \
   ${CONTAINER_ENGINE} exec "${KIND_CLUSTER_NAME}-control-plane" crictl images -o json 2>/dev/null | grep -q "model-registry-ui"; then
  echo ">>> Deploying model-registry-ui..."
  kubectl apply -f "${KUSTOMIZE_DIR}/model-registry-ui-deployment.yaml"
  kubectl rollout status deployment/model-registry-ui -n "${NAMESPACE}" --timeout=120s

  echo ">>> Deploying maas-ui..."
  kubectl apply -f "${KUSTOMIZE_DIR}/maas-ui-deployment.yaml"
  kubectl rollout status deployment/maas-ui -n "${NAMESPACE}" --timeout=120s
else
  echo ">>> Skipping plugin UI deployments (images not built)."
  echo "    Run with BUILD_PLUGINS=true to build and deploy model-registry-ui and maas-ui."
fi

# --- 7. Apply sample data (users, groups, RoleBindings, DSPA CR, DSC) ---
echo ">>> Applying sample data (Auth, users, groups, RoleBindings, DSPA, DSC, etc.)..."
kubectl apply -f "${KUSTOMIZE_DIR}/sample-data.yaml"

# Patch DSPA status via the status subresource (kubectl apply ignores status for CRDs with subresources.status)
echo ">>> Patching DSPA status to mark pipeline server as ready..."
kubectl patch datasciencepipelinesapplications.datasciencepipelinesapplications.opendatahub.io dspa \
  -n sample-project \
  --type=merge \
  --subresource=status \
  -p '{"status":{"conditions":[{"type":"Ready","status":"True","reason":"MinimumReplicasAvailable","message":"All components ready","lastTransitionTime":"2025-04-20T12:00:00Z"},{"type":"APIServerReady","status":"True","reason":"Ready","message":"API server is running","lastTransitionTime":"2025-04-20T12:00:00Z"},{"type":"PersistenceAgentReady","status":"True","reason":"Ready","message":"Persistence agent is running","lastTransitionTime":"2025-04-20T12:00:00Z"},{"type":"ScheduledWorkflowReady","status":"True","reason":"Ready","message":"Scheduled workflow is running","lastTransitionTime":"2025-04-20T12:00:00Z"}],"components":{"apiServer":{"externalUrl":"http://ds-pipeline-dspa.sample-project.svc.cluster.local:8443","url":"http://ds-pipeline-dspa.sample-project.svc.cluster.local:8443"},"mlmdProxy":{"externalUrl":"http://ds-pipeline-dspa.sample-project.svc.cluster.local:8443","url":"http://ds-pipeline-dspa.sample-project.svc.cluster.local:8443"}}}}'

# Patch InferenceService status (kubectl apply ignores status for CRDs with subresources.status)
echo ">>> Patching InferenceService statuses for sample deployed models..."
kubectl patch inferenceservices.serving.kserve.io llama-3-8b \
  -n sample-project \
  --type=merge \
  --subresource=status \
  -p '{"status":{"conditions":[{"type":"Ready","status":"True","lastTransitionTime":"2025-04-20T10:05:00Z"},{"type":"PredictorReady","status":"True","lastTransitionTime":"2025-04-20T10:05:00Z"}],"modelStatus":{"states":{"activeModelState":"Loaded","targetModelState":"Loaded"},"transitionStatus":"UpToDate"},"url":"http://llama-3-8b.sample-project.svc.cluster.local","address":{"url":"http://llama-3-8b.sample-project.svc.cluster.local"}}}'

kubectl patch inferenceservices.serving.kserve.io mistral-7b \
  -n sample-project \
  --type=merge \
  --subresource=status \
  -p '{"status":{"conditions":[{"type":"Ready","status":"False","lastTransitionTime":"2025-04-22T14:30:00Z","reason":"RevisionMissing","message":"Waiting for model to load"}],"modelStatus":{"states":{"targetModelState":"Pending"},"transitionStatus":"InProgress"}}}'

# Patch DSC status to set ModelsAsServiceReady condition (needed for MaaS plugin)
echo ">>> Patching DSC status with component readiness conditions..."
kubectl patch datascienceclusters.datasciencecluster.opendatahub.io default-dsc \
  --type=merge \
  --subresource=status \
  -p '{"status":{"conditions":[{"type":"ModelsAsServiceReady","status":"True","reason":"Ready","message":"MaaS components ready","lastTransitionTime":"2025-04-20T12:00:00Z"}],"components":{"modelregistry":{"registriesNamespace":"odh-dashboard"}}}}'

# --- 8. Deploy using kustomize ---
echo ">>> Deploying dashboard manifests..."
pushd "${KUSTOMIZE_DIR}" > /dev/null
kustomize edit set namespace "${NAMESPACE}"
popd > /dev/null

kustomize build "${KUSTOMIZE_DIR}" \
  | sed "s|image: odh-dashboard:latest|image: ${IMAGE}|g" \
  | kubectl apply -f -

# --- 9. Restart pods if image was rebuilt (tag doesn't change so K8s won't auto-restart) ---
if [ "${IMAGE_REBUILT:-false}" = "true" ]; then
  echo ">>> Image was rebuilt; restarting pods to pick up new image..."
  kubectl rollout restart deployment/odh-dashboard -n "${NAMESPACE}"
fi

if [ "${PLUGINS_REBUILT:-false}" = "true" ]; then
  echo ">>> Plugin images were rebuilt; restarting plugin pods..."
  kubectl rollout restart deployment/model-registry-ui -n "${NAMESPACE}" 2>/dev/null || true
  kubectl rollout restart deployment/maas-ui -n "${NAMESPACE}" 2>/dev/null || true
fi

echo ">>> Waiting for deployment rollout..."
kubectl rollout status deployment/odh-dashboard -n "${NAMESPACE}" --timeout=120s

echo ""
echo "=== Deployment complete ==="
echo "  Dashboard URL: http://odh-dashboard.127.0.0.1.nip.io"
echo ""
echo "  If the URL doesn't work, you can also port-forward:"
echo "    kubectl port-forward -n ${NAMESPACE} svc/odh-dashboard 8080:8080"
echo "    Then open: http://localhost:8080"
echo ""
echo "  To enable model-registry and MaaS plugins (requires Go toolchain):"
echo "    BUILD_PLUGINS=true make deploy-kind"
