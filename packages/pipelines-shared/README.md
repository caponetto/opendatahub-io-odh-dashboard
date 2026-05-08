# @odh-dashboard/pipelines-shared

Shared pipeline infrastructure for ODH Dashboard. Provides types, components, and utilities for pipeline project selection consumed by multiple extension packages (pipelines, automl, autorag).

## Contents

- **Pipeline Concepts** — `PipelineCoreProjectSelector` and project picker components.
- **Utilities** — Pipeline periodic schedule helpers.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  pipelines-shared   <-- this package
extension      (2)  pipelines, automl, autorag, ...
```

## Usage

```ts
import { PipelineCoreProjectSelector } from '@odh-dashboard/pipelines-shared/concepts/pipelines/PipelineCoreProjectSelector';
```
