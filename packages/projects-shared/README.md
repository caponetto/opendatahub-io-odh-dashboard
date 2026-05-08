# @odh-dashboard/projects-shared

Shared project context for ODH Dashboard. Provides the `ProjectDetailsContext` React context that is consumed by multiple extension packages (workbench, model-serving, hardware-profiles, pipelines, notebook-shared).

## Contents

- **ProjectDetailsContext** — React context carrying project-scoped state (notebooks, PVCs, connections, serving runtimes, inference services, hardware profiles, local queues, Kueue status).

## Architecture

This is a **shared-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and other shared packages. It is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
shared         (1)  projects-shared   <-- this package
extension      (2)  workbench, model-serving, hardware-profiles, ...
```

## Usage

```ts
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';

const { currentProject, notebooks, pvcs } = React.useContext(ProjectDetailsContext);
```
