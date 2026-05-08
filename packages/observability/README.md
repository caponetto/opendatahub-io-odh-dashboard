# @odh-dashboard/observability

Observability plugin for ODH Dashboard. Provides monitoring and metrics visualization for AI/ML workloads and platform infrastructure using embedded Perses dashboards.

## Features

- **Perses dashboards** — Embedded interactive dashboards for visualizing Prometheus and Loki metrics.
- **Multi-datasource support** — Prometheus for metrics, Loki for logs, Tempo for traces, Pyroscope for profiling.
- **Rich chart library** — Time series, bar, gauge, pie, heatmap, histogram, scatter, stat, flame, and table visualizations.
- **Variable-driven exploration** — Dashboard variables and filters for dynamic exploration of metrics data.

## Extension Points

Registers `app.route` extensions for the observability pages.

## Architecture

Uses Module Federation to proxy API requests to the Perses backend service, enabling real-time data querying without direct cluster access from the browser.

## Usage

```ts
import { extensions } from '@odh-dashboard/observability/extensions';
```

## Key Dependencies

- `@perses-dev/*` — Perses dashboard and plugin ecosystem
- `@tanstack/react-query` — Data fetching and caching
- `@mui/material` — Material UI (used by Perses components)
