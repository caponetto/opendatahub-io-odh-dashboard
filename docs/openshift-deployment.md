# Deploying ODH Dashboard on Standalone OpenShift

This guide walks through deploying the ODH Dashboard on a standalone OpenShift cluster without the RHOAI or ODH operator, using the Helm chart with OpenShift-specific values.

## Prerequisites

- `oc` or `kubectl` logged into the target OpenShift cluster (cluster-admin recommended)
- `helm` >= 3.12
- `kustomize` >= 5.0
- `podman` or `docker` (for building/mirroring images)
- A container registry accessible from the cluster (for example Quay.io, GHCR, ACR)

## Quick Start

### 1. Push images to a registry

Since OpenShift nodes cannot access locally built images, you must push them to a registry first:

```bash
# Build and push all images (dashboard + plugins)
REGISTRY=quay.io/my-org PLATFORM=linux/amd64 make push-images
```

This builds `odh-dashboard`, `model-registry-ui`, and `maas-ui` for `linux/amd64` and pushes them to the specified registry.

### 2. Mirror third-party images

The `push-images` script automatically mirrors third-party images (PostgreSQL, BusyBox, Perses, Prometheus) alongside the project images. If you already ran step 1, this is done for you.

To mirror manually (for example if Docker Hub rate limits block the automation):

```bash
for img in postgres:16 busybox:1.37 persesdev/perses:v0.42.1 prom/prometheus:v2.53.0; do
  podman pull --platform linux/amd64 "$img"
  short="${img##*/}"  # strip org prefix
  podman tag "$img" "quay.io/my-org/$short"
  podman push "quay.io/my-org/$short"
done
```

The deploy script automatically overrides Docker Hub images with your `REGISTRY` prefix when `REGISTRY` is set.

### 3. Deploy

```bash
REGISTRY=quay.io/my-org NAMESPACE=my-namespace make deploy-openshift-helm
```

The script will:

1. Verify cluster access and detect OpenShift
2. Pre-install ODH CRDs (skipping OpenShift-native ones like Routes, ImageStreams)
3. Remove orphaned admission webhooks from previous ODH or RHOAI operator installs
4. Render the Helm chart with `values-openshift.yaml` and apply via `kubectl apply --server-side`
5. Wait for the dashboard deployment to roll out
6. Seed sample data (status patches for DSC, DSPA, InferenceServices, and Model Registry models)
7. Print the Route URL

Access the dashboard at the OpenShift Route URL printed at the end.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NAMESPACE` | `odh-dashboard` | Target namespace for the dashboard |
| `REGISTRY` | (empty) | Container registry prefix; enables registry mode |
| `IMAGE_TAG` | `latest` | Image tag when using `REGISTRY` |
| `BUILD_PLUGINS` | `false` | Build plugin images locally |
| `FORCE_BUILD` | `false` | Force rebuild of images |
| `SKIP_BUILD` | `false` | Skip all image builds |
| `SKIP_CRD_INSTALL` | `false` | Skip ODH CRD pre-installation |
| `CLEAN` | `false` | Wipe previous deployment before installing |
| `CONTAINER_ENGINE` | auto-detected | `docker` or `podman` (auto-detects, prefers docker) |
| `SAMPLE_NS` | from `values-openshift.yaml` | Namespace for sample data (default: `sample-project`) |

## Incremental Updates vs. Clean Redeploy

By default, the script performs an incremental update: it applies the Helm chart on top of existing resources without deleting anything first. This is faster and preserves persistent data (for example PostgreSQL volumes).

For a full clean redeploy:

```bash
CLEAN=true REGISTRY=quay.io/my-org NAMESPACE=my-namespace make deploy-openshift-helm
```

This will:

- Uninstall the previous Helm release
- Delete all deployments, services, ConfigMaps, Secrets, and custom resources in the namespace
- Remove orphaned cluster-scoped resources (ClusterRoles, ClusterRoleBindings, webhooks)

## What's Different from Kind

| Aspect | Kind | OpenShift |
|--------|------|-----------|
| Ingress | NGINX `Ingress` | OpenShift `Route` (auto-TLS) |
| Values file | `values-kind.yaml` | `values-openshift.yaml` |
| CRD stubs | Installed (Routes, ImageStreams, Templates) | Skipped (native APIs available) |
| Image loading | `kind load docker-image` | Pull from registry |
| Cluster setup | `make create-kind-cluster` | Existing OpenShift cluster |
| Security context | Standard Kubernetes defaults | OpenShift restricted SCC (arbitrary UIDs) |
| Docker Hub images | Direct pull | Mirrored via `REGISTRY` to avoid rate limits |
| PostgreSQL `fsGroup` | `999` (via values) | `null` (SCC assigns group from namespace range) |

## Helm Values (`values-openshift.yaml`)

The OpenShift values file overrides the base defaults:

```yaml
# Route instead of Ingress
ingress:
  enabled: false
route:
  enabled: true

# Plugins enabled by default
plugins:
  modelRegistry:
    enabled: true
    server:
      enabled: true

# Sample data in a separate namespace
sampleNamespace: sample-project

# CRD stubs not needed on OpenShift
crdStubs:
  install: false

# Mocks for observability and pipelines
mocks:
  perses:
    enabled: true
    image: persesdev/perses:v0.42.1
    prometheusImage: quay.io/prometheus/prometheus:v2.53.0
  pipeline:
    enabled: true
    image: ghcr.io/nginx/nginx-unprivileged:1.27-alpine
```

When `REGISTRY` is set, the deploy script automatically overrides Docker Hub images:

- `postgres:16` becomes `${REGISTRY}/postgres:16`
- `busybox:1.37` becomes `${REGISTRY}/busybox:1.37`
- `persesdev/perses:v0.42.1` becomes `${REGISTRY}/perses:v0.42.1`

## OpenShift-Specific Considerations

### Security Context Constraints (SCCs)

OpenShift's `restricted` SCC enforces:

- Arbitrary UIDs (containers do not run as their Dockerfile-specified user)
- No `fsGroup` outside the namespace's allocated range
- No privilege escalation

All containers in the Helm chart are compatible with the restricted SCC. The Prometheus deployment does not set `fsGroup` to avoid SCC conflicts.

### Docker Hub Rate Limits

OpenShift worker nodes pulling from Docker Hub will eventually hit rate limits. The `REGISTRY` environment variable solves this by:

1. Overriding third-party image references in the Helm chart with your registry prefix.
2. You mirror the images once, and all subsequent deploys pull from your registry.

### Orphaned Webhooks

If the cluster previously had ODH or RHOAI operators installed, orphaned `MutatingWebhookConfiguration` and `ValidatingWebhookConfiguration` resources may block creation of `InferenceService` and Model Registry CRs. The deploy script automatically detects and removes these.

### Namespace Separation

Sample data (notebooks, InferenceServices, pipeline server mock) is deployed to a separate namespace (`sample-project` by default) to keep the dashboard namespace clean. The dashboard's project selector filters out its own namespace, so sample workloads need to be in a different namespace to be visible.

## Troubleshooting

### Image pull errors (`toomanyrequests`)

Mirror the failing image to your registry:

```bash
podman pull --platform linux/amd64 <failing-image>
podman tag <failing-image> quay.io/my-org/<short-name>
podman push quay.io/my-org/<short-name>
```

### `Exec format error`

Architecture mismatch: the image was built for arm64 but the cluster runs amd64. Re-pull with `--platform linux/amd64`:

```bash
podman pull --platform linux/amd64 <image>
```

### Model Registry / Catalog not showing data

- Check that `model-registry-db` pod is running and PostgreSQL accepted connections
- Verify the `DataScienceCluster` status has `registriesNamespace` set to your namespace
- Check `model-registry-server` and `model-catalog-server` logs for PostgreSQL auth errors

### Observability dashboards show "No dashboards found"

- Verify `data-science-perses` pod is running and logs do not show schema errors
- Check that Prometheus is running (not OOMKilled; it needs 1Gi memory limit)
- Ensure the Perses config includes `schemas` paths pointing to `/etc/perses/schemas/`

### Pipeline server shows "failed"

- The mock pipeline server uses `nginx-unprivileged`, which is compatible with OpenShift's restricted SCC
- If the error persists, ensure the DSPA status was patched correctly by `seed-data.sh`
- Check that the sample namespace is different from the dashboard namespace

## Teardown

Remove all dashboard resources:

```bash
kubectl delete namespace my-namespace sample-project --ignore-not-found
kubectl delete clusterrole odh-dashboard odh-dashboard-dsg --ignore-not-found
kubectl delete clusterrolebinding odh-dashboard odh-dashboard-auth-delegator odh-dashboard-dsg --ignore-not-found
```

Or use `CLEAN=true` on the next deploy to wipe and redeploy in one step:

```bash
CLEAN=true REGISTRY=quay.io/my-org NAMESPACE=my-namespace make deploy-openshift-helm
```
