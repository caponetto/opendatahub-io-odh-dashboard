# @odh-dashboard/dashboard-foundation-backend

Shared backend types, helpers, and utilities consumed by extension backend routes and the dashboard server framework (`dashboard-shell-backend`).

## Purpose

This package contains the backend code that is shared across the monorepo — Kubernetes resource types, route-security middleware, service proxy helpers, user/admin utilities, and constants. It was extracted from `dashboard-shell-backend` to separate the **reusable utilities** from the **server framework** (routes, plugins, server creation).

- **Extensions** depend on this package for backend route logic (auth, proxy, k8s helpers).
- **`dashboard-shell-backend`** depends on this package and re-uses it from its own routes and plugins.

## Architecture

This is an **infrastructure** tier package (`topology.tier: "infrastructure"`). It sits below extension packages in the dependency graph:

```text
assemblers (dashboard-dist-full / dashboard-dist-slim)
    └── dashboard-shell-backend  (server framework)
            └── dashboard-foundation-backend  ← this package
    └── extensions (pipelines, model-serving, …)
            └── dashboard-foundation-backend  ← this package
```
