# @odh-dashboard/kserve

KServe model serving platform extension for ODH Dashboard. Implements the model-serving platform interface for deploying and managing models via KServe InferenceServices.

## Features

- **Model deployment** — Deploy models to KServe with configurable runtime, resources, and storage.
- **InferenceService management** — Monitor status, endpoints, and replicas of deployed models.
- **Platform integration** — Implements `@odh-dashboard/model-serving` extension points for the KServe platform.
- **Deployment utilities** — Helpers for constructing InferenceService specs from form data.

## Extension Points

Registers model-serving platform extensions that the model-serving package discovers and renders.

## Usage

```ts
import { extensions } from '@odh-dashboard/kserve/extensions';
import { createInferenceServiceSpec } from '@odh-dashboard/kserve/deployUtils';
```
