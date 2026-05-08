---
description: ODH Dashboard monorepo architecture, package boundaries, and BFF structure
globs: "packages/**,frontend/**,backend/**"
alwaysApply: false
---

# ODH Dashboard Architecture

## Monorepo Structure

ODH Dashboard is a monorepo managed with npm workspaces and Turbo. It provides the web UI for Red Hat OpenShift AI (RHOAI) and Open Data Hub (ODH).

All packages live under `packages/`. Two **assembler** packages (`dashboard-dist-full`, `dashboard-dist-slim`) compose extensions into runnable applications. The **shell** packages (`dashboard-shell-frontend`, `dashboard-shell-backend`) provide the app framework and server. **Extension** packages are independent features loaded via Module Federation.

## Package Tier Model

Every package declares its tier in `package.json` under `"topology": { "tier": "<name>" }`. The five tiers enforce a one-way dependency flow:

```
infrastructure │  dashboard-foundation, dashboard-config, plugin-core, dashboard-build,
               │  dashboard-foundation-backend, eslint-config, eslint-plugin, jest-config,
               │  tsconfig, test-mocks, contract-tests, cypress, plugin-template
───────────────┼──────────────────────────────────────────────────────────────────────────
shared         │  connection-types-shared, storage-classes-shared, hardware-profiles-shared,
               │  distributed-workloads-shared, model-serving-shared, pipelines-shared,
               │  mlflow-shared
───────────────┼──────────────────────────────────────────────────────────────────────────
shell          │  dashboard-shell-frontend, dashboard-shell-backend
───────────────┼──────────────────────────────────────────────────────────────────────────
extension      │  admin, home, pipelines, model-serving, model-registry, notebook-controller,
               │  workbench, connection-types, storage-classes, hardware-profiles,
               │  distributed-workloads, gen-ai, kserve, notebooks, maas, automl, autorag,
               │  eval-hub, mlflow, mlflow-embedded, model-training, feature-store,
               │  llmd-serving, explore-applications, learning-center, observability,
               │  trustyai, model-serving-backport
───────────────┼──────────────────────────────────────────────────────────────────────────
assembler      │  dashboard-dist-full, dashboard-dist-slim
```

**Dependency rules:**

- **Infrastructure:** Foundation, config, build tooling, and shared utilities. May import from other infrastructure packages. No feature dependencies.
- **Shared:** Domain-specific types, hooks, and UI components (the `*-shared` packages) consumed by multiple extensions. May import from infrastructure and other shared packages.
- **Shell:** App framework (`dashboard-shell-frontend`) and server (`dashboard-shell-backend`). May import from infrastructure and shared. Must not import extensions.
- **Extension:** Independent features. **MUST NOT import from other extensions.** May import from infrastructure, shared, and shell.
- **Assembler:** Composes extensions into a runnable application. May depend on anything.

Type-only imports (`import type`) across tiers are always allowed since they create no runtime dependency.

These rules are enforced at two levels:
- **Import-level:** `@odh-dashboard/eslint-config/tier-restrictions.js` via the `@odh-dashboard/no-restricted-imports` ESLint rule (error severity). Each package's `.eslintrc.js` should include `tierRestrictions('<package-name>')`.
- **Dependency-level:** `packages/eslint-config/validate-tiers.js` validates `package.json` dependency graphs.

## Package Boundaries (Critical)

- Extension packages MUST NOT import directly from other extension packages' internal modules.
- Extension packages MUST use exported APIs from `plugin-core` or `dashboard-foundation` for shared functionality, or use extension points for cross-feature integration.
- Changes to infrastructure packages (`eslint-config`, `jest-config`, `tsconfig`, `dashboard-foundation`) affect ALL packages — review with extra care.

## BFF (Backend-for-Frontend) Architecture

Several packages have a Go-based BFF service: `automl`, `autorag`, `eval-hub`, `gen-ai`, `maas`, `mlflow`.
- Located in `bff/` within the package
- Check each package's `bff/go.mod` for its required Go toolchain version
- Exposes REST APIs consumed by the package's frontend
- Must expose a `/healthcheck` endpoint
- Has its own OpenAPI specification in `api/` or `bff/openapi/`
