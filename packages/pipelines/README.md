# @odh-dashboard/pipelines

Pipelines feature package for ODH Dashboard. Provides the complete UI for creating, managing, and monitoring ML pipelines powered by Kubeflow Pipelines.

## Features

- **Pipeline management** — Import, create, version, and delete pipeline definitions.
- **Run execution** — Create runs and recurring runs with parameter configuration.
- **Run monitoring** — View run status, logs, metrics, and artifacts.
- **Topology visualization** — Interactive DAG visualization of pipeline structure using PatternFly Topology.
- **Experiment organization** — Group runs into experiments for comparison and tracking.
- **Pipeline server management** — Configure and manage pipeline server instances per project.
- **External redirects** — Route to Kubeflow Pipelines native UI for advanced operations.

## Extension Points

- `app.route` — Pipeline definitions, runs, experiments, artifacts, executions, and model customization pages.
- `app.context-provider` — `InvalidArgoAlertProvider` for Argo deployment health alerts (gated by `DS_PIPELINES`).
- `app.external-redirect` — Routes for Kubeflow Pipelines SDK and Elyra notebook redirects.
- `workbench.pipelines-integration` — Provides pipeline context, section, overview card, and Elyra checks for project details (gated by `DS_PIPELINES`).

## Usage

```ts
import { extensions } from '@odh-dashboard/pipelines/extensions';
```
