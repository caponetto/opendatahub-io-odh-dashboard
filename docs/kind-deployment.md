# Deploying ODH Dashboard on Kind (Vanilla Kubernetes)

This guide walks through deploying the ODH Dashboard on a local [Kind](https://kind.sigs.k8s.io/) (Kubernetes in Docker) cluster. This is the first step toward running the dashboard on vanilla Kubernetes across cloud providers.

## Prerequisites

Install the following tools:

- **Docker** (or Podman with Docker CLI compatibility)
- **Kind** >= 0.20.0: `brew install kind` / `go install sigs.k8s.io/kind@latest`
- **kubectl**: `brew install kubectl`
- **Helm** >= 3.12: `brew install helm` (for Helm-based deployment)
- **kustomize** >= 5.0: `brew install kustomize` (for legacy Kustomize-based deployment)
- **Node.js** >= 22 and **npm** >= 10 (for local builds)

## Kind Cluster Setup

Create a Kind cluster with NGINX Ingress (idempotent -- safe to re-run):

```bash
make create-kind-cluster

# Or with a custom cluster name
KIND_CLUSTER_NAME=my-cluster make create-kind-cluster
```

This creates the cluster with ingress-ready port mappings and installs the NGINX Ingress Controller. The nginx manifest is always re-applied to ensure hostPort bindings survive node restarts.

You can then deploy the dashboard using either the Helm or Kustomize method below.

## Quick Start (Helm -- Recommended)

The Helm chart is the recommended deployment method. It packages all resources (CRDs, RBAC, deployment, ingress, mocks, sample data) into a single parameterized install:

```bash
# Build image and deploy everything via Helm
make deploy-kind-helm

# Or with custom settings
IMAGE=my-dashboard:dev NAMESPACE=my-ns ./install/deploy-kind-helm.sh

# Force a rebuild even if the image is already loaded
FORCE_BUILD=true make deploy-kind-helm

# Build and deploy with model-registry and MaaS plugins
BUILD_PLUGINS=true make deploy-kind-helm
```

The script will:
1. Create/reuse the Kind cluster and NGINX Ingress (via `create-kind-cluster.sh`)
2. Build the dashboard image (and optionally plugin images) and load them into Kind
3. Pull and load third-party images (Perses, Prometheus, and optionally PostgreSQL + Model Registry server)
4. Pre-install CRDs, then render and apply the Helm chart via `helm template | kubectl apply --server-side`
5. Patch CR status subresources and seed sample data (Model Registry models)

Access the dashboard at: **http://odh-dashboard.127.0.0.1.nip.io**

### Helm Chart Structure

The chart lives in `charts/odh-dashboard/` and supports multiple value files:

| File | Purpose |
|------|---------|
| `values.yaml` | Base defaults |
| `values-kind.yaml` | Kind-specific overrides (nip.io host, mocks on, sample data on) |
| `values-openshift.yaml` | OpenShift-specific overrides (Route, no CRD stubs, registry mirrors) |

Key values for controlling what gets deployed:

```yaml
plugins:
  modelRegistry:
    enabled: false      # set true when plugin images are built
    server:
      enabled: false    # deploy real Model Registry + PostgreSQL + Model Catalog
  maas:
    enabled: false      # set true when plugin images are built

mocks:
  perses:
    enabled: true       # real Perses server + Prometheus for observability
  pipeline:
    enabled: true       # mock pipeline server (KFP v2 API stub)

crdStubs:
  install: true         # OpenShift API CRD stubs (needed on vanilla K8s)

sampleData:
  install: true         # demo data (users, hardware profiles, models, etc.)
```

### Direct Helm Commands

> **Note:** Due to Helm 4's server-side apply (SSA) schema validation issues with CRD stubs, `helm install` / `helm upgrade` may fail. The deploy script works around this by using `helm template | kubectl apply --server-side --force-conflicts`. For manual use:

```bash
# Render and apply (recommended)
helm template odh-dashboard charts/odh-dashboard \
  -f charts/odh-dashboard/values-kind.yaml \
  -n odh-dashboard | kubectl apply -f - --server-side --force-conflicts

# Uninstall (clean up resources manually since we bypass Helm tracking)
kubectl delete deployment,service,configmap,ingress -n odh-dashboard --all
```

## Quick Start (Kustomize -- Legacy)

The Kustomize-based deployment is still available:

```bash
# Build image and deploy everything
make deploy-kind

# Or with custom settings
IMAGE=my-dashboard:dev NAMESPACE=my-ns ./install/deploy-kind.sh

# Skip the image build entirely (useful with local dev workflow)
SKIP_BUILD=true ./install/deploy-kind.sh

# Force a rebuild
FORCE_BUILD=true make deploy-kind

# Build and deploy with plugins
BUILD_PLUGINS=true make deploy-kind
```

The script will:
1. Create/reuse the Kind cluster and NGINX Ingress (via `create-kind-cluster.sh`)
2. Build the dashboard image and load it into Kind
4. (Optional) Build and load plugin UI images (model-registry-ui, maas-ui)
5. Install ODH CRDs and OpenShift API CRD stubs (Routes, Templates, ImageStreams, DSC, etc.)
6. Deploy mock servers (Perses for observability, pipeline server)
7. Apply the Kustomize overlay (RBAC, deployment, ingress, module federation config)
8. Apply sample data (namespace, users, hardware profiles, connection types, DSC, etc.)
9. Wait for the deployment to be ready

Access the dashboard at: **http://odh-dashboard.127.0.0.1.nip.io**

## Step-by-Step Manual Deployment

### 1. Create the Kind Cluster

Use the dedicated script which creates the cluster with ingress-ready port mappings and installs NGINX:

```bash
make create-kind-cluster
```

Or manually:

```bash
kind create cluster \
  --name odh-dashboard \
  --config manifests/overlays/kind/kind-cluster-config.yaml \
  --wait 60s

kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

kubectl wait --namespace ingress-nginx \
  --for=condition=ready pod \
  --selector=app.kubernetes.io/component=controller \
  --timeout=120s
```

Verify the cluster is running:

```bash
kubectl cluster-info --context kind-odh-dashboard
```

### 2. Build the Dashboard Image

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
- `disablePerformanceMetrics: true` -- No Thanos/OpenShift monitoring stack
- `disableTrustyBiasMetrics: true` -- No TrustyAI metrics
- `disableKServeMetrics: true` -- No KServe-specific metrics endpoint
- `observabilityDashboard: true` -- Enables the Observe & Monitor > Dashboard nav item (served by real Perses + Prometheus)
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
- A Perses API backend at `/perses/api` (provided by the real Perses server)

The Helm chart deploys a **real Perses server** (`persesdev/perses:v0.42.1`) with a file-based database and pre-provisioned dashboards (Cluster Overview, Model Serving Resources, Workload Metrics). A **real Prometheus instance** (`prom/prometheus`) is also deployed alongside Perses, scraping cadvisor metrics from the Kind node. This provides live container CPU, memory, network, and filesystem data in the dashboards. The nav item appears under **Observe & Monitor > Dashboard** for admin users.

### Model Registry and MaaS (optional, requires `BUILD_PLUGINS=true`)

These plugins are loaded **dynamically via module federation** at runtime. Their UI code is served by separate sidecar containers (Go BFF + webpack bundle), and they require building additional Docker images.

To enable:

```bash
# Build dashboard + plugin images and deploy everything
BUILD_PLUGINS=true make deploy-kind-helm

# Or force rebuild of everything
FORCE_BUILD=true BUILD_PLUGINS=true make deploy-kind-helm
```

The plugin images are built from `Dockerfile.workspace` files:
- `packages/model-registry/Dockerfile.workspace` -- includes the Go BFF and model-registry frontend
- `packages/maas/Dockerfile.workspace` -- includes the Go BFF and MaaS frontend (heavier build due to dependencies on `llmd-serving`, `model-serving`, `kserve`, `model-registry`)

**Requirements**: Building plugin images requires a Go toolchain (Go >= 1.24) in addition to the standard Node.js prerequisites.

#### Real Model Registry Server

When `BUILD_PLUGINS=true`, the deploy script also sets `plugins.modelRegistry.server.enabled=true`, which deploys the **real Model Registry stack**:

- **PostgreSQL** (`postgres:16`) -- backing database for the Model Registry and Model Catalog
- **Model Registry server** (`ghcr.io/kubeflow/model-registry/server:v0.3.8` in `proxy` mode) -- serves the Model Registry REST API, discovered by the BFF via `component: model-registry` label
- **Model Catalog server** (`ghcr.io/kubeflow/model-registry/server:v0.3.8` in `catalog` mode) -- serves the Model Catalog API, discovered via `component: model-catalog` label

With the real server enabled, the BFF's `--mock-mr-client` and `--mock-mr-catalog-client` flags are automatically removed. The deploy script seeds the registry with sample models (granite-8b-code-instruct, llama-3-8b-instruct, mistral-7b-instruct) on first deploy.

#### MaaS Plugin

The MaaS BFF runs in mock mode (`MOCK_K8S_CLIENT=true`, `MOCK_HTTP_CLIENT=true`) on Kind, so it returns sample data without needing real backend services.

A `DataScienceCluster` CRD stub and sample CR are installed automatically. The DSC status is patched with component statuses (`kserve: Managed`, `modelregistry: Managed`, etc.) and a `ModelsAsServiceReady: True` condition, which the MaaS plugin requires to activate.

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

### Post-Deploy Seed Data

The deploy script calls `install/seed-data.sh` after the Helm install to perform operations that require admin-level access:

- **Status patches**: Sets `.status` on CRs that have no real controller (DSPA, InferenceService, DataScienceCluster)
- **Model Registry seeding**: Populates the real Model Registry with sample models if it's empty

You can re-run the seed script standalone to reset sample data without a full redeploy:

```bash
./install/seed-data.sh
```

## Teardown

### Helm-based deployment (recommended)

The Helm deploy script (`deploy-kind-helm.sh`) automatically cleans up previous
resources on every run, so re-running `make deploy-kind-helm` is a clean redeploy.

Remove dashboard resources while keeping the cluster:

```bash
kubectl delete namespace odh-dashboard sample-project --ignore-not-found
kubectl delete clusterrole odh-dashboard odh-dashboard-dsg --ignore-not-found
kubectl delete clusterrolebinding odh-dashboard odh-dashboard-auth-delegator odh-dashboard-dsg --ignore-not-found
```

### Kustomize-based deployment (legacy)

```bash
make undeploy-kind
```

### Delete the entire Kind cluster

```bash
kind delete cluster --name odh-dashboard
```

### Full Clean Start

To wipe everything (cluster, images, build cache) and start from scratch:

```bash
# Delete the Kind cluster
kind delete cluster --name odh-dashboard

# Remove dashboard Docker images
docker rmi -f odh-dashboard:latest model-registry-ui:latest maas-ui:latest 2>/dev/null

# (Optional) Reclaim disk space from Docker build cache
docker builder prune -f

# Redeploy from scratch
FORCE_BUILD=true BUILD_PLUGINS=true make deploy-kind-helm
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

## Multi-Cloud Deployment

The Helm chart is designed for multi-cloud portability. For deploying on standalone OpenShift (without RHOAI/ODH operator), see [OpenShift Deployment](openshift-deployment.md).

For other cloud providers (AKS, EKS, GKE), the Kind Helm chart works with minimal adjustments:
- Set `ingress.className` and `ingress.host` for your provider's ingress controller
- Push images to your cloud registry via `REGISTRY=<your-registry> make push-images`
- Use `helm template ... | kubectl apply` with your registry overrides

The CRD stubs (`crdStubs.install: true`) are still needed on all vanilla Kubernetes providers since OpenShift APIs are not available natively.
