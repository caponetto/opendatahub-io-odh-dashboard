# @odh-dashboard/hardware-profiles-shared

Shared hardware profile infrastructure for ODH Dashboard. Provides types, hooks, form components, and utilities for hardware profile management that are consumed by multiple extension packages (hardware-profiles, model-serving, notebook-controller, pipelines, kserve, llmd-serving, admin, workbench).

## Contents

- **Profile Contexts & Hooks** — `useAssignHardwareProfile`, hardware profile configuration hooks.
- **Form Components** — Profile selection, node resource management, toleration editing, node selector configuration.
- **Management Pages** — Create/edit hardware profile UI (manage pages, deprecated accelerator paths).
- **Notebook Integration** — Hardware profile paths for notebook CR annotations.
- **Utilities** — Profile filtering, validation, and type helpers.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  hardware-profiles-shared   <-- this package
extension      (2)  hardware-profiles, model-serving, notebook-controller, ...
```

Note: 4 files with runtime dependencies on `modelServing` and `kueue` concepts remain in `dashboard-foundation` to avoid cross-framework-tier imports.

## Usage

```ts
import { useAssignHardwareProfile } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/useAssignHardwareProfile';
import { HardwareProfileFormData } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/types';
```
