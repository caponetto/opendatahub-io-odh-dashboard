# @odh-dashboard/dashboard-foundation-frontend

Shared infrastructure layer for the ODH Dashboard monorepo. This package provides the foundational building blocks that all feature packages depend on, including API clients, Kubernetes resource models, Redux state management, generic React components, and common utilities.

## Responsibilities

- **API layer** — Kubernetes resource model definitions, proxy utilities, error handling, access/rules review hooks, and generic CRUD helpers for K8s resources.
- **Services** — Backend service wrappers (cluster settings, role bindings, routes, builds, operator subscriptions, etc.).
- **Concepts** — Shared domain logic that is not feature-specific: K8s abstractions, RBAC/permissions, dashboard areas, user configs, analytics tracking, notification watcher, proxy, secrets, integrations, and project-level utilities.
- **Hooks** — Reusable React hooks for notifications, fetch state, browser storage, and more.
- **Redux** — Store configuration, shared reducers, selectors, and actions.
- **Components** — Generic, feature-agnostic UI components (modals, tables, toolbars, error boundaries, markdown views, PatternFly overrides, etc.).
- **Utilities** — Date/time formatting, string helpers, YAML parsing, image stream utilities, and other cross-cutting concerns.

## Usage

```ts
import { useAccessReview } from '@odh-dashboard/dashboard-foundation-frontend/api/useAccessReview';
import { KnownLabels } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s';
import { SimpleSelect } from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
```

## Dependencies

This package sits at the bottom of the dependency graph (above only `plugin-core` and `dashboard-config`) and must not depend on any feature package.
