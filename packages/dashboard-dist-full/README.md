# @odh-dashboard/dashboard-dist-full

Full-featured assembler package for Red Hat OpenShift AI (RHOAI) and Open Data Hub. This package wires together the app shell, backend, and all feature packages to produce the complete dashboard application.

## Responsibilities

- Imports and registers all available feature package extensions.
- Passes the complete extension set and application configuration to `@odh-dashboard/dashboard-shell-frontend` for bootstrapping.
- Serves as the build entry point for the full RHOAI/ODH dashboard variant.

## Architecture

```
dashboard-dist-full (assembler)
  ├── dashboard-shell-frontend (app shell)
  ├── dashboard-shell-backend (BFF server)
  ├── dashboard-foundation-frontend (shared infra)
  └── all feature packages (pipelines, model-serving, etc.)
```

This is one of potentially many "assembler" packages. Each assembler selectively includes feature packages to produce a different dashboard variant (see also `dashboard-dist-slim`).
