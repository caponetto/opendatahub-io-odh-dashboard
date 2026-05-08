# @odh-dashboard/home

Home landing page for ODH Dashboard. Provides the initial view users see after logging in, with quick-access cards, project summaries, and navigation to key features.

## Features

- **Welcome section** — Quick-start actions and getting-started guidance for new users.
- **Project overview** — Summary of recent data science projects with direct access links.
- **Resource highlights** — Cards linking to learning resources, documentation, and quick starts.
- **Feature discovery** — Surface key platform capabilities and recently used features.

## Extension Points

Registers `app.route` extensions for the home/landing page.

## Usage

```ts
import { extensions } from '@odh-dashboard/home/extensions';
```
