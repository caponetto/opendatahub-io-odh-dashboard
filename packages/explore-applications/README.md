# @odh-dashboard/explore-applications

Explore Applications page for ODH Dashboard. Provides the application catalog where users can discover, learn about, and enable ISV integrations and platform components.

## Features

- **Application catalog** — Browse available applications with filtering and search.
- **Application cards** — Display application metadata, descriptions, and enablement status.
- **Enable/disable flow** — Guide users through enabling applications that require configuration.

## Extension Points

Registers `app.route` extensions for the Explore page.

## Usage

```ts
import { extensions } from '@odh-dashboard/explore-applications/extensions';
```
