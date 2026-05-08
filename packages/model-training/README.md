# @odh-dashboard/model-training

Model Training plugin for ODH Dashboard. Provides UI for managing distributed training jobs and fine-tuning experiments.

## Features

- **Training job management** — Create, monitor, and manage distributed model training jobs.
- **Experiment tracking** — View training runs, metrics, and outputs.
- **Kubernetes types** — Custom resource definitions for training-related K8s objects (PyTorchJob, etc.).

## Extension Points

Registers `app.route` extensions for training job pages within projects.

## Usage

```ts
import { extensions } from '@odh-dashboard/model-training/extensions';
import { TrainingJobKind } from '@odh-dashboard/model-training/k8sTypes';
```
