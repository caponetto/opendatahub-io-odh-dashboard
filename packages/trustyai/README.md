# @odh-dashboard/trustyai

TrustyAI feature package for ODH Dashboard. Provides model fairness monitoring and bias detection capabilities through the TrustyAI service integration.

## Features

- **Bias metrics** — Configure and monitor SPD (Statistical Parity Difference) and DIR (Disparate Impact Ratio) fairness metrics.
- **TrustyAI service management** — Install, configure, and check status of the TrustyAI service within projects.
- **Model monitoring** — Track model fairness over time with historical metric data.
- **Custom API integration** — Direct communication with the TrustyAI REST API for metric configuration and querying.

## Extension Points

- `app.project-details/settings-card` — `ModelBiasSettingsCard` for project details (gated by `TRUSTY_AI`).
- `model-serving.metrics/bias-integration` — Provides `TrustyAIContextProvider`, `useModelBiasData`, and `useIsBiasAvailable` for model-serving bias metrics (gated by `TRUSTY_AI`).

## Usage

```ts
import { useTrustyAINamespaceCR } from '@odh-dashboard/trustyai/concepts/useTrustyAINamespaceCR';
import { useTrustyAIAPIState } from '@odh-dashboard/trustyai/concepts/useTrustyAIAPIState';
```
