# @odh-dashboard/storage-classes-shared

Shared storage class infrastructure for ODH Dashboard. Provides types, hooks, and select components for storage class management consumed by multiple extension packages (storage-classes, model-serving, notebook-controller, pipelines, dashboard-shell-frontend, workbench).

## Contents

- **Storage Class Hooks** — `useStorageClasses` for fetching and filtering storage classes.
- **Select Components** — `StorageClassSelect` dropdown for PVC provisioning.
- **Access Mode Helpers** — Utilities for storage class access mode detection and validation.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  storage-classes-shared   <-- this package
extension      (2)  storage-classes, model-serving, notebook-controller, ...
```

## Usage

```ts
import { useStorageClasses } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useStorageClasses';
import { StorageClassSelect } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/StorageClassSelect';
```
