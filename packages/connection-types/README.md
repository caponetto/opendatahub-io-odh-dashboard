# @odh-dashboard/connection-types

Connection Types feature package for ODH Dashboard. Manages the creation, editing, previewing, and usage of connection types — reusable templates that define how workloads connect to external data sources and services.

## Features

- **Connection type management** — Create, edit, duplicate, and delete connection type definitions.
- **Field editor** — Visual form builder for defining connection parameters (text, password, URI, dropdown, file upload, etc.).
- **Preview mode** — Preview how a connection type form will render to end users.
- **Data connections** — Attach connection instances to workbenches and projects.

## Extension Points

Registers `app.route` extensions for the connection types admin and user-facing pages.

## Usage

```ts
import { extensions } from '@odh-dashboard/connection-types/extensions';
import { getConnectionTypeDisplayName } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/utils';
```
