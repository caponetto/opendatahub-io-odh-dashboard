# @odh-dashboard/notebook-controller

Notebook Controller feature package for ODH Dashboard. Manages the lifecycle of Jupyter notebooks and workbench environments — spawning, stopping, environment configuration, and status monitoring.

## Features

- **Notebook spawner** — Configure and launch notebooks with image selection, hardware profiles, environment variables, and storage.
- **Lifecycle management** — Start, stop, and monitor running notebook instances.
- **Environment configuration** — Manage environment variables, config maps, secrets, and data connections attached to notebooks.
- **Image selection** — Choose from available notebook images with version and package information.
- **Status monitoring** — Track notebook pod status, events, and resource usage.

## Extension Points

Registers `app.route` extensions for notebook-related pages (spawner, admin notebook images, etc.).

## Usage

```ts
import { extensions } from '@odh-dashboard/notebook-controller/extensions';
import { StartNotebookData } from '@odh-dashboard/notebook-controller/types';
```
