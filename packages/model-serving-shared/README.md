# @odh-dashboard/model-serving-shared

Shared model serving infrastructure for ODH Dashboard. Provides types, hooks, components, and utilities related to model serving that are consumed by multiple extension packages (model-serving, kserve, llmd-serving, admin, workbench, trustyai, model-registry).

## Contents

- **Model Serving Concepts** — Wizard field components, deployment constants, serving runtime bindings, NIM/NVIDIA integration helpers.
- **Model Catalog Utilities** — Deploy button state logic and gating.
- **TrustyAI Types** — Bias metric types and TrustyAI install state definitions.
- **Resource Utilities** — Model serving resource and sizing helpers.

## Architecture

This is a **framework-tier** package (Tier 1). It can import from infrastructure packages (Tier 0, e.g. `dashboard-foundation`) and is importable by all extension packages (Tier 2).

```
infrastructure (0)  dashboard-foundation, dashboard-config, plugin-core
framework      (1)  model-serving-shared   <-- this package
extension      (2)  model-serving, kserve, llmd-serving, admin, ...
```

## Usage

```ts
import { ScopedType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/modelServing/constants';
import { getDeployButtonState } from '@odh-dashboard/model-serving-shared/concepts/modelCatalog/utils';
```
