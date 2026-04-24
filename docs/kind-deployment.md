# Deploying ODH Dashboard on Kind (Vanilla Kubernetes)

This guide walks through deploying the ODH Dashboard on a local [Kind](https://kind.sigs.k8s.io/) (Kubernetes in Docker) cluster. This is the first step toward running the dashboard on vanilla Kubernetes across cloud providers.

## Prerequisites

Install the following tools:

- **Docker** (or Podman with Docker CLI compatibility)
- **Kind** >= 0.20.0: `brew install kind` / `go install sigs.k8s.io/kind@latest`
- **kubectl**: `brew install kubectl`
- **kustomize** >= 5.0: `brew install kustomize`
- **Node.js** >= 22 and **npm** >= 10 (for local builds)

## Quick Start (Automated)

The fastest path uses the deploy script:

```bash
# Build image and deploy everything in one command
make deploy-kind

# Or with custom settings
IMAGE=my-dashboard:dev NAMESPACE=my-ns ./install/deploy-kind.sh

# Skip the image build entirely (useful with local dev workflow)
SKIP_BUILD=true ./install/deploy-kind.sh

# Force a rebuild even if the image is already loaded in Kind
FORCE_BUILD=true make deploy-kind

# Build and deploy with model-registry and MaaS plugins (requires Go toolchain)
BUILD_PLUGINS=true make deploy-kind
```

The script will:
1. Create a Kind cluster with ingress-ready port mappings
2. Install the NGINX Ingress Controller
3. Build the dashboard image and load it into Kind
4. (Optional) Build and load plugin UI images (model-registry-ui, maas-ui)
5. Install ODH CRDs and OpenShift API CRD stubs (Routes, Templates, ImageStreams, DSC, etc.)
6. Deploy mock servers (Perses for observability, pipeline server)
7. Apply the Kustomize overlay (RBAC, deployment, ingress, module federation config)
8. Apply sample data (namespace, users, hardware profiles, connection types, DSC, etc.)
9. Wait for the deployment to be ready

Access the dashboard at: **http://odh-dashboard.127.0.0.1.nip.io**

## Step-by-Step Manual Deployment

### 1. Create the Kind Cluster

The Kind cluster needs extra port mappings for the ingress controller:

```bash
kind create cluster \
  --name odh-dashboard \
  --config manifests/overlays/kind/kind-cluster-config.yaml \
  --wait 60s
```

Verify the cluster is running:

```bash
kubectl cluster-info --context kind-odh-dashboard
```

### 2. Install NGINX Ingress Controller

Kind requires the NGINX ingress controller variant designed for Kind clusters:

```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml
```

Wait for the controller to be ready:

```bash
kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

### 3. Build the Dashboard Image

From the repository root:

```bash
docker build -t odh-dashboard:latest -f Dockerfile .
```

Load the image into the Kind cluster (Kind nodes cannot pull from the local Docker daemon directly):

```bash
kind load docker-image odh-dashboard:latest --name odh-dashboard
```

### 4. Create the Namespace

```bash
kubectl create namespace odh-dashboard
```

### 5. Install CRDs

Install the ODH CRDs and the OpenShift API CRD stubs:

```bash
kustomize build manifests/common/crd | kubectl apply -f -
kubectl apply -f manifests/overlays/kind/crds/
```

### 6. Deploy the Dashboard

Apply the manifests:

```bash
kustomize build manifests/overlays/kind | kubectl apply -f -
```

### 7. Apply Sample Data

```bash
kubectl apply -f manifests/overlays/kind/sample-data.yaml
```

### 8. Wait for Rollout

```bash
kubectl rollout status deployment/odh-dashboard -n odh-dashboard --timeout=120s
```

### 9. Access the Dashboard

The dashboard is available at:

```
http://odh-dashboard.127.0.0.1.nip.io
```

This works because:
- The Kind cluster maps container ports 80/443 to host ports 80/443
- The NGINX ingress controller listens on those ports
- The `nip.io` domain resolves `*.127.0.0.1.nip.io` to `127.0.0.1`

**Alternative: port-forward** (no ingress needed):

```bash
kubectl port-forward -n odh-dashboard svc/odh-dashboard 8080:8080
# Open http://localhost:8080
```

## What's Different from OpenShift

The Kind overlay makes several adaptations from the standard OpenShift deployment:

| Aspect | OpenShift | Kind |
|--------|-----------|------|
| Ingress | `Route` (route.openshift.io) | `Ingress` (networking.k8s.io) |
| Auth proxy | `kube-rbac-proxy` sidecar | None (direct HTTP on port 8080) |
| TLS | OpenShift serving cert annotation | Plain HTTP (dev only) |
| User identity | user.openshift.io User API | SelfSubjectReview / JWT / dev fallback |
| Admin check | SSAR on ODH Auth CRD | Env var `ADMIN_USERS` or allow-all |
| Projects | project.openshift.io | Core `v1/namespaces` |
| Builds | build.openshift.io | Disabled (watchers skipped) |
| ConsoleLinks | console.openshift.io | Disabled (watcher skipped) |
| QuickStarts | console.openshift.io | Disabled (watcher skipped) |
| OLM Subscriptions | operators.coreos.com | Disabled (watcher skipped) |
| ImageStreams | image.openshift.io | CRD stub installed (API works, no controller) |
| Routes | route.openshift.io | CRD stub installed (API works, no controller) |
| Templates | template.openshift.io | CRD stub installed (API works, no controller) |

The backend detects the platform at startup by probing for the `config.openshift.io` ClusterVersion API. On vanilla Kubernetes, it skips OpenShift-specific resource watchers (builds, consolelinks, quickstarts, subscriptions) and falls back to Kubernetes-native APIs for projects and permissions. Several OpenShift API groups (`image.openshift.io`, `route.openshift.io`, `template.openshift.io`) have CRD stubs installed so that existing code paths succeed against the API server and return empty results naturally.

## Configuration

### Admin Users

On vanilla Kubernetes, there is no OpenShift Auth CR for SSAR-based admin checks. You can control admin access via the `ADMIN_USERS` environment variable:

```bash
# In the deployment or via kustomize patch
env:
  - name: ADMIN_USERS
    value: "admin@example.com,devops@example.com"
```

If `ADMIN_USERS` is not set, all authenticated users are treated as admins (suitable for dev/test).

### Dashboard Config

The Kind overlay deploys an `OdhDashboardConfig` CR with sensible defaults for local development:

- `disableSupport: true` -- No Red Hat support integration
- `disableTracking: true` -- No telemetry
- `disableISVBadges: true` -- No ISV badges
- `disablePerformanceMetrics: true` -- No Prometheus/Thanos (not available on Kind)
- `disableTrustyBiasMetrics: true` -- No TrustyAI metrics
- `disableKServeMetrics: true` -- No KServe metrics
- `observabilityDashboard: true` -- Enables the Observe & Monitor > Dashboard nav item (served by the mock Perses server)
- `modelAsService: true` -- Enables the Gen AI Studio nav items (requires the MaaS plugin)

BYON image streams, cluster settings, and serving runtime templates are **enabled** since the necessary CRD stubs (ImageStream, Template) are installed on Kind.

You can customize this by editing `manifests/overlays/kind/odhdashboardconfig.yaml` before deploying.

## Plugin Architecture

The Kind deployment supports three modular architecture plugins via module federation:

| Plugin | Nav Location | Integration | Build Required |
|--------|-------------|-------------|----------------|
| **Observability** | Observe & Monitor > Dashboard | Static (bundled in host) | No |
| **Model Registry** | AI Hub > Models > Catalog/Registry | Dynamic (MF remote) | Yes |
| **MaaS** | Gen AI Studio + Settings | Dynamic (MF remote) | Yes |

### Observability (enabled by default)

The observability plugin is **statically bundled** into the host webpack build. It only requires:
- The `observabilityDashboard: true` feature flag (set in `odhdashboardconfig.yaml`)
- A Perses API backend at `/perses/api` (provided by the mock Perses server)

The mock Perses server deploys automatically and serves sample dashboard metadata. The nav item appears under **Observe & Monitor > Dashboard** for admin users.

### Model Registry and MaaS (optional, requires `BUILD_PLUGINS=true`)

These plugins are loaded **dynamically via module federation** at runtime. Their UI code is served by separate sidecar containers (Go BFF + webpack bundle), and they require building additional Docker images.

To enable:

```bash
# Build dashboard + plugin images and deploy everything
BUILD_PLUGINS=true make deploy-kind

# Or force rebuild of everything
FORCE_BUILD=true make deploy-kind
```

The plugin images are built from `Dockerfile.workspace` files:
- `packages/model-registry/Dockerfile.workspace` -- includes the Go BFF and model-registry frontend
- `packages/maas/Dockerfile.workspace` -- includes the Go BFF and MaaS frontend (heavier build due to dependencies on `llmd-serving`, `model-serving`, `kserve`, `model-registry`)

**Requirements**: Building plugin images requires a Go toolchain (Go >= 1.24) in addition to the standard Node.js prerequisites.

The MaaS BFF runs in mock mode (`MOCK_K8S_CLIENT=true`, `MOCK_HTTP_CLIENT=true`) on Kind, so it returns sample data without needing real backend services.

A `DataScienceCluster` CRD stub and sample CR are installed automatically. The DSC status is patched with a `ModelsAsServiceReady: True` condition, which the MaaS plugin requires to activate.

### Module Federation Configuration

The `MODULE_FEDERATION_CONFIG` environment variable is injected into the dashboard container from the `federation-config` ConfigMap (`manifests/overlays/kind/federation-configmap.yaml`). It configures:
- `modelRegistry`: Backend proxy at `/_mf/modelRegistry/*` and API proxy at `/model-registry/api`
- `maas`: Backend proxy at `/_mf/maas/*` and API proxy at `/maas/api`
- `perses`: API proxy at `/perses/api` (no remote entry -- observability is statically bundled)

If the plugin images are not built, the dashboard still starts normally. Module federation services that are unavailable return 503, and the corresponding nav items simply don't appear.

### Docker Build Context and `.dockerignore`

The root `.dockerignore` excludes heavy subdirectories inside workspace packages (`packages/*/frontend/`, `packages/*/bff/`, `packages/*/upstream/`) to keep the Docker build context small and avoid disk exhaustion errors (some packages like `notebooks` contain deeply nested `node_modules` trees). Only the specific directories needed by the Dockerfiles are re-included:

```
# Excluded by default
packages/*/frontend/
packages/*/bff/
packages/*/upstream/
packages/*/node_modules/
packages/*/dist/

# Re-included for builds
!packages/model-registry/upstream/        # core dashboard + model-registry plugin
!packages/maas/frontend/                  # maas plugin
!packages/maas/bff/                       # maas plugin
!packages/llmd-serving/                   # maas workspace dep
!packages/model-serving/                  # maas workspace dep
!packages/kserve/                         # maas workspace dep
```

When adding a new plugin that uses `Dockerfile.workspace`, add a corresponding `!packages/<name>/frontend/` and `!packages/<name>/bff/` re-include rule to `.dockerignore`, along with any workspace dependencies it copies.

## Local Development (Hot-Reload)

For day-to-day development you do **not** need to rebuild the Docker image on every change. Instead, run the backend and frontend directly on your host with hot-reload, pointed at the Kind cluster's API server.

### One-Time Setup

Deploy the Kind cluster infrastructure (CRDs, RBAC, namespace, ingress) without building the container image:

```bash
SKIP_BUILD=true make deploy-kind
```

Create a `.env.local` file in the repository root (this file is git-ignored):

```bash
cat > .env.local << 'EOF'
APP_ENV=development
OC_PROJECT=odh-dashboard
EOF
```

> **Note:** `OC_PROJECT` is used as the target namespace name. Despite the OpenShift-sounding name, it works with any Kubernetes cluster. No OpenShift connection is needed -- the backend reads credentials from your local `~/.kube/config` via `@kubernetes/client-node`.

### Running Locally

Make sure your kubectl context points to the Kind cluster:

```bash
kubectl config use-context kind-odh-dashboard
```

Start both the backend and frontend with a single command from the repository root:

```bash
npm run dev
```

This runs the backend (port 4000, nodemon) and frontend (port 4010, webpack-dev-server) in parallel. Open **http://localhost:4010** in your browser. Changes to frontend code are reflected instantly via HMR. Changes to backend code trigger an automatic restart via nodemon.

### When to Rebuild the Image

You only need a full image rebuild (`FORCE_BUILD=true make deploy-kind`) when:
- Testing the actual containerized deployment before pushing
- Validating the Dockerfile or production build
- Testing ingress/networking behavior through the in-cluster pod

## Teardown

Remove dashboard resources while keeping the cluster:

```bash
make undeploy-kind
```

Delete the entire Kind cluster:

```bash
DELETE_CLUSTER=true ./install/undeploy-kind.sh
# or simply:
kind delete cluster --name odh-dashboard
```

## Troubleshooting

### Dashboard pod fails to start

Check the pod logs:

```bash
kubectl logs -n odh-dashboard deployment/odh-dashboard
```

Common issues:
- **Image not found**: Make sure you ran `kind load docker-image` after building
- **CRD not installed**: Verify with `kubectl get crd odhdashboardconfigs.opendatahub.io`

### Ingress not working

Verify the ingress controller is running:

```bash
kubectl get pods -n ingress-nginx
```

Check the ingress resource:

```bash
kubectl get ingress -n odh-dashboard
kubectl describe ingress odh-dashboard -n odh-dashboard
```

If `nip.io` DNS doesn't resolve in your network, use port-forward instead:

```bash
kubectl port-forward -n odh-dashboard svc/odh-dashboard 8080:8080
```

### Backend errors about missing APIs

The backend gracefully handles missing OpenShift APIs. If you see warnings like:
- `OpenShift ClusterVersion API not found` -- Expected on vanilla K8s
- `Skipping OpenShift-only resource watchers` -- Expected on vanilla K8s
- `Failed to retrieve cluster id` -- Expected on vanilla K8s (clusterID will be undefined)

These are informational and do not prevent the dashboard from functioning.
