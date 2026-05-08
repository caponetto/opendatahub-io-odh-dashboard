# @odh-dashboard/llmd-serving

LLM-d (distributed LLM) serving extension for ODH Dashboard. Provides support for deploying large language models using the LLM-d distributed serving architecture via KServe.

## Features

- **Distributed LLM deployment** — Configure and deploy LLMs using LLM-d's distributed inference architecture.
- **Form utilities** — Specialized form handling for LLM-d deployment parameters.
- **KServe integration** — Extends the KServe platform with LLM-d-specific configuration and resource management.

## Extension Points

Registers model-serving platform extensions for the LLM-d serving runtime.

## Usage

```ts
import { extensions } from '@odh-dashboard/llmd-serving/extensions';
import { LlmdFormData } from '@odh-dashboard/llmd-serving/types';
```
