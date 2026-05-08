# @odh-dashboard/hardware-profiles

Hardware Profiles feature package for ODH Dashboard. Manages hardware profile definitions that specify compute resource configurations (CPU, memory, GPU) for notebooks, model serving, and other workloads.

## Features

- **Profile management** — Create, edit, enable/disable, and delete hardware profiles.
- **Resource configuration** — Define CPU limits/requests, memory allocations, GPU counts, and node selectors/tolerations.
- **Identifier management** — Configure custom resource identifiers beyond standard CPU/memory/GPU.
- **Usage across workloads** — Hardware profiles are consumed by notebook spawners, model serving deployments, and distributed workloads.

## Extension Points

- `app.route` — Admin page for managing hardware profiles.
- `app.status-provider` — Reports hardware profile status for navigation indicators.
- `app.context-provider` — `HardwareProfilesContextProvider` for shared hardware profile state.

## Usage

```ts
import { extensions } from '@odh-dashboard/hardware-profiles/extensions';
import { useHardwareProfiles } from '@odh-dashboard/hardware-profiles/concepts/useHardwareProfiles';
```
