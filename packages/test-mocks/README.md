# @odh-dashboard/test-mocks

Shared test mock data for ODH Dashboard. Provides factory functions and pre-built mock objects for Kubernetes resources, dashboard types, and feature-specific data structures used across unit and integration tests.

## Contents

- **Mock factories** — Functions that create realistic mock instances of K8s resources (ConfigMaps, Secrets, PVCs, Pods, Routes, etc.).
- **Dashboard mocks** — Mock data for dashboard-specific types (DashboardConfig, OdhApplication, OdhDocument, etc.).
- **Feature mocks** — Mock data for feature-specific resources (InferenceServices, Pipelines, Notebooks, ServingRuntimes, etc.).
- **Context mocks** — Pre-configured context values for React context providers used in testing.

## Usage

```ts
import { mockNotebookK8sResource } from '@odh-dashboard/test-mocks/mockNotebookK8sResource';
import { mockDashboardConfig } from '@odh-dashboard/test-mocks/mockDashboardConfig';
import { mockInferenceServiceK8sResource } from '@odh-dashboard/test-mocks/mockInferenceServiceK8sResource';
```

## Note

This package is intended for use in test environments only. It should appear in `devDependencies` of consuming packages, never in production `dependencies`.
