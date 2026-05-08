# @odh-dashboard/admin

Administration settings shell and User Management for ODH Dashboard.

## Features

- **Settings navigation shell** -- Declares the top-level "Settings" navigation section used by all admin sub-packages.
- **User Management** -- Manage admin and user group access controls.

## Related packages

Feature-specific admin pages live in their own packages:

- `@odh-dashboard/cluster-settings` -- General cluster settings (PVC, culler, telemetry, model serving platforms)
- `@odh-dashboard/workbench-images` -- Workbench images (BYON) management

## Usage

```ts
import { extensions } from '@odh-dashboard/admin/extensions';
```
