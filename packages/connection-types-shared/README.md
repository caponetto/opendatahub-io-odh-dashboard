# @odh-dashboard/connection-types-shared

Shared connection type infrastructure for ODH Dashboard. Provides types, form field components, and utilities for data connections that are consumed by multiple extension packages (connection-types, model-serving, model-registry, pipelines, kserve, llmd-serving, notebook-controller, workbench, automl, autorag).

## Contents

- **Connection Type Definitions** — Field types, connection type schemas, labelled connection models.
- **Form Fields** — Reusable form field components for connection type editing and selection.
- **Workbench Env Types** — Environment variable form type definitions for workbench spawner integration.
- **Services** — Secret/ConfigMap environment variable fetch service.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  connection-types-shared   <-- this package
extension      (2)  connection-types, model-serving, pipelines, ...
```

## Usage

```ts
import { ConnectionTypeFieldType } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';
import { ConnectionTypeForm } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/ConnectionTypeForm';
```
