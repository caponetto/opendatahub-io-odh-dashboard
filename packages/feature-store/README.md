# @odh-dashboard/feature-store

Feature Store plugin for ODH Dashboard. Provides UI for managing feature engineering workflows, data pipelines, and lineage visualization using topology graphs.

## Features

- **Feature management** — Browse and manage feature definitions, feature sets, and data sources.
- **Lineage visualization** — Interactive topology graph showing data lineage relationships between entities using PatternFly Topology.
- **Custom node rendering** — Specialized graph nodes (pills, groups) for representing different entity types in the lineage view.

## Extension Points

Registers `app.route` extensions for feature store pages.

## Usage

```ts
import { extensions } from '@odh-dashboard/feature-store/extensions';
```

## Key Dependencies

- `@patternfly/react-topology` — Graph visualization library
