# @odh-dashboard/learning-center

Learning Center page for ODH Dashboard. Provides curated educational resources, documentation links, and quick-start guides to help users learn about the platform and AI/ML workflows.

## Features

- **Resource catalog** — Browse documentation, tutorials, how-to guides, and quick starts.
- **Filtering** — Filter resources by type, provider, and enabled applications.
- **Doc cards** — Rich cards displaying resource metadata, badges, and direct links.
- **Quick start integration** — Launch PatternFly quick starts directly from the learning center.

## Extension Points

Registers `app.route` extensions for the Learning Center page.

## Usage

```ts
import { extensions } from '@odh-dashboard/learning-center/extensions';
import { OdhDocCard } from '@odh-dashboard/learning-center/components/OdhDocCard';
```
