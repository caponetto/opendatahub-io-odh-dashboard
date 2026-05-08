# @odh-dashboard/model-serving

Core model serving UI package for ODH Dashboard. Provides the shared framework for deploying, managing, and monitoring ML model endpoints across different serving platforms (KServe, ModelMesh, NIM, LLM-d).

## Features

- **Deployment wizard** — Multi-step wizard for deploying models with platform selection, resource configuration, and connection setup.
- **Endpoint management** — View, monitor, and manage model serving endpoints and their status.
- **Metrics and monitoring** — Performance metrics charts for inference latency, throughput, and resource utilization.
- **Multi-platform architecture** — Extensible platform system where specific serving runtimes (KServe, ModelMesh) register via extension points.
- **Serving runtime management** — Configure and manage serving runtime templates.
- **Token authentication** — Manage inference endpoint authentication tokens.

## Extension Points

- Registers `app.route` extensions for model serving pages.
- Registers `app.context-provider` for `ModelRegistriesContextProvider`.
- Defines its own extension points that platform packages (kserve, llmd-serving, model-serving-backport) implement.

## Usage

```ts
import { extensions } from '@odh-dashboard/model-serving/extensions';
import { useModelServingEnabled } from '@odh-dashboard/model-serving/hooks/useModelServingEnabled';
```
