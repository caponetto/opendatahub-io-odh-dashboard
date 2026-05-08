# @odh-dashboard/storage-classes

Storage Classes feature package for ODH Dashboard. Manages Kubernetes StorageClass configurations and provides utilities for determining default storage settings across the platform.

## Features

- **Storage class administration** — View, enable/disable, and configure storage classes for the platform.
- **Default storage config** — Determine and apply default storage class settings used by PVC creation flows.
- **OPAQUE annotation management** — Manage ODH-specific annotations on StorageClass resources.

## Extension Points

Registers `app.route` extensions for the storage classes admin page.

## Usage

```ts
import { extensions } from '@odh-dashboard/storage-classes/extensions';
import { getDefaultStorageClassConfig } from '@odh-dashboard/storage-classes/utils';
```
