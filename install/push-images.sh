#!/usr/bin/env bash
# ------------------------------------------------------------------
# push-images.sh
#
# Build and push all deployment images to a container registry.
#
# Usage:
#   ./install/push-images.sh quay.io/my-org
#   ./install/push-images.sh quay.io/my-org v0.1.0
#   REGISTRY=quay.io/my-org make push-images
#
# Args:
#   $1  REGISTRY  – container registry prefix  (required)
#   $2  IMAGE_TAG – image tag                  (default: latest)
# ------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# shellcheck source=lib/helm-utils.sh
source "${SCRIPT_DIR}/lib/helm-utils.sh"

REGISTRY="${1:-${REGISTRY:-}}"
IMAGE_TAG="${2:-${IMAGE_TAG:-latest}}"
CONTAINER_ENGINE="${CONTAINER_ENGINE:-$(command -v docker &>/dev/null && echo docker || echo podman)}"
SKIP_BUILD="${SKIP_BUILD:-false}"
FORCE_BUILD="${FORCE_BUILD:-false}"
PLATFORM="${PLATFORM:-linux/amd64}"
NO_CACHE="${NO_CACHE:-false}"

if [ -z "${REGISTRY}" ]; then
  echo "Usage: $0 <registry> [tag]"
  echo "  e.g. $0 quay.io/my-org"
  echo "  e.g. $0 quay.io/my-org v0.1.0"
  exit 1
fi

IMAGES=(
  "odh-dashboard|Dockerfile|"
  "model-registry-ui|packages/model-registry/Dockerfile.workspace|--build-arg DEPLOYMENT_MODE=federated"
  "maas-ui|packages/maas/Dockerfile.workspace|--build-arg DEPLOYMENT_MODE=federated"
)

echo "=== Building and pushing images ==="
echo "  Registry: ${REGISTRY}"
echo "  Tag:      ${IMAGE_TAG}"
echo "  Platform: ${PLATFORM}"
echo ""

for entry in "${IMAGES[@]}"; do
  IFS='|' read -r name dockerfile extra <<< "${entry}"
  full="${REGISTRY}/${name}:${IMAGE_TAG}"

  if [ "${SKIP_BUILD}" = "true" ]; then
    echo ">>> Skipping build for ${full} (SKIP_BUILD=true), tagging local image..."
    ${CONTAINER_ENGINE} tag "${name}:latest" "${full}" 2>/dev/null || {
      echo "    WARNING: Local image '${name}:latest' not found, skipping ${full}."
      continue
    }
  elif [ "${FORCE_BUILD}" != "true" ] && ${CONTAINER_ENGINE} image inspect "${full}" &>/dev/null; then
    echo ">>> Image '${full}' already exists locally, skipping build. (set FORCE_BUILD=true to rebuild)"
  else
    CACHE_FLAG=""
    [ "${NO_CACHE}" = "true" ] && CACHE_FLAG="--no-cache"
    echo ">>> Building ${full} (${PLATFORM})..."
    # shellcheck disable=SC2086
    ${CONTAINER_ENGINE} build --platform "${PLATFORM}" ${CACHE_FLAG} -t "${full}" -f "${REPO_ROOT}/${dockerfile}" ${extra} "${REPO_ROOT}"
  fi

  echo ">>> Pushing ${full}..."
  ${CONTAINER_ENGINE} push "${full}"
  echo ""
done

echo "=== All project images pushed ==="
echo ""

# --- Mirror third-party images needed by the Helm chart ---
MIRROR_IMAGES="${MIRROR_IMAGES:-true}"
# Image pins sourced from lib/helm-utils.sh
THIRD_PARTY=(
  "${PG_IMAGE}|${PG_IMAGE}"
  "${BUSYBOX_IMAGE}|${BUSYBOX_IMAGE}"
  "${PERSES_IMAGE}|perses:${PERSES_IMAGE##*:}"
  "${PROM_IMAGE}|prometheus:${PROM_IMAGE##*:}"
  "${ENVOY_IMAGE}|envoy:${ENVOY_IMAGE##*:}"
)

if [ "${MIRROR_IMAGES}" = "true" ]; then
  echo "=== Mirroring third-party images ==="
  for entry in "${THIRD_PARTY[@]}"; do
    IFS='|' read -r src dest <<< "${entry}"
    full="${REGISTRY}/${dest}"
    echo ">>> Mirroring ${src} -> ${full}..."
    ${CONTAINER_ENGINE} pull --platform "${PLATFORM}" "${src}" 2>/dev/null || {
      echo "    WARNING: Failed to pull ${src}, skipping."
      continue
    }
    ${CONTAINER_ENGINE} tag "${src}" "${full}"
    ${CONTAINER_ENGINE} push "${full}"
    echo ""
  done
  echo "=== All third-party images mirrored ==="
else
  echo ">>> Skipping third-party image mirroring (MIRROR_IMAGES=false)."
fi

echo ""
echo "Others can now deploy with:"
echo "  REGISTRY=${REGISTRY} IMAGE_TAG=${IMAGE_TAG} BUILD_PLUGINS=true make deploy-kind-helm"
