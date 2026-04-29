#!/usr/bin/env bash
# ------------------------------------------------------------------
# create-kind-cluster.sh
#
# Create (or reuse) a Kind cluster with NGINX Ingress for the
# ODH Dashboard. Safe to run multiple times -- idempotent.
#
# Environment variables:
#   KIND_CLUSTER_NAME – cluster name  (default: odh-dashboard)
# ------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
KIND_CONFIG="${REPO_ROOT}/manifests/overlays/kind/kind-cluster-config.yaml"

KIND_CLUSTER_NAME="${KIND_CLUSTER_NAME:-odh-dashboard}"

echo "=== Kind Cluster Setup ==="
echo "  Cluster name: ${KIND_CLUSTER_NAME}"
echo ""

# --- 1. Create Kind cluster if it doesn't exist ---
if ! kind get clusters 2>/dev/null | grep -q "^${KIND_CLUSTER_NAME}$"; then
  echo ">>> Creating Kind cluster '${KIND_CLUSTER_NAME}'..."
  kind create cluster \
    --name "${KIND_CLUSTER_NAME}" \
    --config "${KIND_CONFIG}" \
    --wait 60s
else
  echo ">>> Kind cluster '${KIND_CLUSTER_NAME}' already exists, reusing."
fi

kubectl config use-context "kind-${KIND_CLUSTER_NAME}"

# --- 2. Install / re-apply NGINX Ingress Controller ---
# Always re-apply to ensure hostPort bindings survive node restarts.
echo ">>> Applying NGINX Ingress Controller (Kind provider)..."
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
echo ">>> Waiting for ingress controller to be ready..."
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s

echo ""
echo ">>> Kind cluster '${KIND_CLUSTER_NAME}' is ready."
echo "    Context: kind-${KIND_CLUSTER_NAME}"
echo "    Ingress: http://<app>.127.0.0.1.nip.io"
