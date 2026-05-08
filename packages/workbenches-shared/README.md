# @odh-dashboard/workbenches-shared

Shared notebook infrastructure for ODH Dashboard. Provides types, hooks, components, and utilities related to notebooks and workbenches that are consumed by multiple extension packages (notebook-controller, workbench).

## Contents

- **Notebook Types** — `StartNotebookData`, `NotebookFeatureStore`, `FeastData` and related types.
- **Notebook K8s Operations** — CRUD operations for Notebook resources (`assembleNotebook`, `createNotebook`, `startNotebook`, `stopNotebook`, etc.).
- **Elyra Utilities** — Elyra volume/mount helpers and pipeline version checks.
- **Notebook Status** — `useNotebookStatus` and `useNotebookProgress` hooks for tracking notebook lifecycle.
- **Notebook Utils** — `isWorkbenchMigrated`, `useNotebookHardwareProfile`, route path helpers.
- **UI Components** — `StartNotebookModal`, `NotebookStatusLabel`.

## Architecture

This is a **shared-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and other shared packages. It is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
shared         (1)  notebook-shared   <-- this package
extension      (2)  notebook-controller, workbench, ...
```

## Usage

```ts
import { StartNotebookData } from '@odh-dashboard/workbenches-shared/concepts/notebooks/types';
import { useNotebookStatus } from '@odh-dashboard/workbenches-shared/concepts/notebooks/useNotebookStatus';
import StartNotebookModal from '@odh-dashboard/workbenches-shared/concepts/notebooks/StartNotebookModal';
```
