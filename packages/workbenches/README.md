# @odh-dashboard/workbenches

Workbench Projects feature package for ODH Dashboard. Provides the data science project management UI — the central organizational unit where users configure workbenches, storage, connections, and collaborate on ML workflows.

## Features

- **Project management** — Create, edit, and delete data science projects (Kubernetes namespaces).
- **Project overview** — Dashboard view showing all project resources (workbenches, storage, connections, pipelines, models).
- **Workbench configuration** — Manage workbench environments with notebooks, images, and resource allocation.
- **PVC storage** — Create and manage persistent volume claims attached to projects.
- **Data connections** — Configure data connections (S3, databases, etc.) for project workloads.
- **Sharing and permissions** — Manage project access through role bindings.
- **Kueue integration** — Local queue configuration and workload quota management.

## Extension Points

Registers `app.route` extensions for project list, project details, and nested resource pages.

## Usage

```ts
import { extensions } from '@odh-dashboard/workbenches/extensions';
import { ProjectDetailsContext } from '@odh-dashboard/workbenches/concepts/projects/ProjectDetailsContext';
```
