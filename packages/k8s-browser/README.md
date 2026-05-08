# @odh-dashboard/k8s-browser

Browser-side Kubernetes runtime helpers for the ODH Dashboard.

## Purpose

Provides the ODH-owned browser K8s layer that replaces direct use of `@openshift/dynamic-plugin-sdk-utils` in dashboard runtime code. It centralizes:

- client bootstrap for the dashboard backend proxy paths (`/api/k8s` and `/wss/k8s`)
- low-level CRUD helpers for Kubernetes resources
- a generic watch hook for browser consumers
- shared browser-facing K8s types and normalized status errors

This package is intentionally low-level. Domain-specific wrappers should stay in `dashboard-foundation` or feature packages instead of growing more resource-specific helpers here.

## Key Exports

| Export | Description |
|--------|-------------|
| `configureK8sClient`, `getK8sClientConfig`, `resetK8sClientConfig` | Configure fetch and websocket behavior for the current runtime |
| `K8sAPIProvider` | React provider that applies API and websocket path configuration |
| `k8sGetResource`, `k8sListResource`, `k8sCreateResource`, `k8sPatchResource`, `k8sUpdateResource`, `k8sDeleteResource` | Generic browser-side CRUD helpers |
| `useK8sWatchResource` | Generic websocket-backed watch hook for single resources or lists |
| `K8sStatusError`, `isK8sStatus` | Error normalization helpers for Kubernetes `Status` responses |
| `K8sResourceCommon`, `K8sModelCommon`, `WatchK8sResource`, `Patch` | Shared browser-side K8s types used across packages |

## Usage

```ts
import {
  K8sAPIProvider,
  k8sListResource,
  type K8sModelCommon,
} from '@odh-dashboard/k8s-browser';

const PodModel: K8sModelCommon = {
  apiGroup: 'core',
  apiVersion: 'v1',
  kind: 'Pod',
  plural: 'pods',
};

// App bootstrap
<K8sAPIProvider apiBasePath="/api/k8s" wsBasePath="/wss/k8s">
  <App />
</K8sAPIProvider>;

// Generic CRUD
const pods = await k8sListResource({ model: PodModel, queryOptions: { ns: 'my-project' } });
```

## Boundaries

- Use this package for shared browser K8s primitives, not feature-specific business logic.
- Keep resource-specific convenience functions in higher-level packages that already own those domains.
- Defaults assume the main dashboard backend proxy contract. Alternate hosts or paths should be configured through `configureK8sClient()` or `K8sAPIProvider`.

> For full documentation see [`docs/guidelines.md`](../../docs/guidelines.md).
