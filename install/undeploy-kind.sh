#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
KUSTOMIZE_DIR="${REPO_ROOT}/manifests/overlays/kind"

NAMESPACE="${NAMESPACE:-odh-dashboard}"
KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-odh-dashboard}"
DELETE_CLUSTER="${DELETE_CLUSTER:-false}"

echo "=== ODH Dashboard Kind Undeployment ==="

if [ "${DELETE_CLUSTER}" = "true" ]; then
  echo ">>> Deleting Kind cluster '${KIND_CLUSTER_NAME}'..."
  kind delete cluster --name "${KIND_CLUSTER_NAME}"
  echo "=== Cluster deleted ==="
else
  echo ">>> Removing dashboard resources from namespace '${NAMESPACE}'..."
  kustomize build "${KUSTOMIZE_DIR}" | kubectl delete --ignore-not-found -f -
  echo ">>> Deleting namespace '${NAMESPACE}'..."
  kubectl delete namespace "${NAMESPACE}" --ignore-not-found
  echo "=== Resources removed ==="
  echo "  To also delete the Kind cluster: DELETE_CLUSTER=true $0"
fi
