# @odh-dashboard/model-serving-backport

Backport plugin providing legacy model serving platform support for ModelMesh and NVIDIA NIM. Bridges older serving runtimes into the new model-serving extension point architecture.

## Features

- **ModelMesh support** — Platform extension for deploying models via ModelMesh multi-model serving.
- **NIM support** — Platform extension for deploying NVIDIA NIM inference microservices.
- **Legacy compatibility** — Ensures existing ModelMesh and NIM deployments continue to be manageable through the unified model serving UI.

## Extension Points

Registers model-serving platform extensions for ModelMesh and NIM runtimes.

## Usage

```ts
import { extensions } from '@odh-dashboard/model-serving-backport/extensions';
```
