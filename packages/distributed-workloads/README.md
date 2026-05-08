# @odh-dashboard/distributed-workloads

Distributed Workloads feature package for ODH Dashboard. Provides monitoring and management capabilities for distributed computing workloads powered by Kueue and Ray.

## Features

- **Workload monitoring** — View status, resource usage, and queue position of distributed workloads.
- **Cluster queue overview** — Monitor cluster queue capacity, utilization, and pending workloads.
- **Local queue management** — View and manage project-level local queues.
- **Prometheus metrics** — Queries distributed workload metrics for resource utilization charts.

## Extension Points

Registers `app.route` extensions for distributed workload pages within projects and global views.

## Usage

```ts
import { extensions } from '@odh-dashboard/distributed-workloads/extensions';
```
