# @odh-dashboard/dashboard-shell-frontend

Application shell for ODH Dashboard variants. Provides the DI-based bootstrap factory, routing infrastructure, Module Federation configuration, error boundaries, and the extension-driven plugin system that dynamically loads feature packages.

## Responsibilities

- **`createDashboardApp`** — Factory function that accepts a root App component and Redux reducer, then bootstraps the full React application with providers, error boundaries, and routing.
- **Extension system** — Aggregates and resolves `app.route`, `app.context-provider`, `app.external-redirect`, and `app.status-provider` extensions contributed by feature packages.
- **Routing** — React Router v7 setup with lazy-loaded route components driven by extension declarations.
- **Webpack / Module Federation config** — Shared build configuration used by assembler packages (`dashboard-dist-full`, `dashboard-dist-slim`).
- **Providers** — Theme context, SDK initialization, browser storage context, and Redux store provider.

## Usage

Assembler packages import and invoke the factory:

```ts
import { createDashboardApp } from '@odh-dashboard/dashboard-shell-frontend';
import App from './App';
import { appReducer } from './redux';

createDashboardApp({ App, appReducer });
```

## Architecture

The shell is feature-agnostic — it has no knowledge of specific features like pipelines or model serving. Feature packages register themselves through the extension point system, and the shell dynamically loads them at runtime.
