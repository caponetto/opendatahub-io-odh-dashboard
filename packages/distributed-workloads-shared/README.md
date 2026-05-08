# @odh-dashboard/distributed-workloads-shared

Shared distributed workload and Kueue infrastructure for ODH Dashboard. Provides types, hooks, utilities, and API helpers for Kueue workloads, cluster queues, and distributed workload status tracking consumed by multiple extension packages (distributed-workloads, hardware-profiles, model-serving, model-training, notebook-controller, workbench).

## Contents

- **Distributed Workload Types** — `WorkloadStatusType` enum and workload status definitions.
- **Kueue Concepts** — Kueue utils, message formatting, workload priority classes, queue status tracking.
- **API Helpers** — K8s CRUD operations for `ClusterQueue`, `LocalQueue`, and `Workload` resources.
- **Utilities** — Cluster queue utils, assigned flavor hooks, cluster queue hooks.
- **Kueue Models** — K8s model constants for Kueue CRDs.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  distributed-workloads-shared   <-- this package
extension      (2)  distributed-workloads, model-training, hardware-profiles, ...
```

## Usage

```ts
import { WorkloadStatusType } from '@odh-dashboard/distributed-workloads-shared/concepts/distributedWorkloads/types';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
```
