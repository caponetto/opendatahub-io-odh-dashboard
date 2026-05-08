# @odh-dashboard/mlflow-shared

Shared MLflow infrastructure for ODH Dashboard. Provides types, route helpers, and UI components for MLflow experiment selection consumed by multiple extension packages (mlflow-embedded, eval-hub, mlflow, pipelines, admin, workbench).

## Contents

- **Types** — `MlflowExperiment`, `MlflowExperimentsResponse`, `MlflowSelectorStatus`, `MlflowExperimentData`.
- **Routes** — `mlflowRootPath`, `mlflowExperimentsBaseRoute`, `mlflowExperimentRoute`.
- **Components** — `MlflowExperimentSelector` dropdown and `MlflowExperimentTable`.
- **Hooks** — `useMlflowExperiments` data-fetching hook.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  mlflow-shared   <-- this package
extension      (2)  mlflow-embedded, eval-hub, mlflow, pipelines, ...
```

## Usage

```ts
import type { MlflowExperiment } from '@odh-dashboard/mlflow-shared/concepts/mlflow/types';
import { mlflowExperimentsBaseRoute } from '@odh-dashboard/mlflow-shared/concepts/mlflow/routes';
import { MlflowExperimentSelector } from '@odh-dashboard/mlflow-shared/concepts/mlflow';
```
