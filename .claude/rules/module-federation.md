---
description: Module Federation — how modules are exposed and consumed across packages in the modular architecture
globs: "**/config/moduleFederation.js,**/config/webpack.*.js,**/module-federation.ts,**/useAppExtensions.ts,**/ExtensibilityContext.tsx,**/extensions.ts,**/extension-points.ts,**/odh/extensions.ts,**/odh/extension-points.ts"
alwaysApply: false
---

# Module Federation — Modular Architecture

> **Canonical docs** — read these first for full details:
> - [docs/module-federation.md](../../docs/module-federation.md) — MF config schema, shared deps, proxy flow, webpack setup, troubleshooting
> - [docs/extensibility.md](../../docs/extensibility.md) — extension points, code refs, lazy loading, helper components (`LazyCodeRefComponent`, `HookNotify`), hooks (`useExtensions`, `useResolvedExtensions`), type guards, best practices

This rule provides a quick reference for working with Module Federation files. Defer to the docs above for full explanations and code examples.

## Architecture

ODH Dashboard uses a **hybrid extension model**: static shell extensions bundled at build time provide the core UI structure (navigation, routes, task areas), while Webpack Module Federation (`@module-federation/enhanced`) dynamically loads remote module extensions at runtime.

| Role | Location | MF Name |
|---|---|---|
| **Host / Shell** | `packages/dashboard-shell-frontend/` | `host` |
| **Remotes** | `packages/*/` (with `module-federation` in `package.json`) | camelCase (e.g., `genAi`, `modelRegistry`, `maas`) |

The host never exposes modules (`exposes: {}`). Remotes expose `./extensions` and optionally `./extension-points`.

## Registering a Federated Module

See [docs/module-federation.md](../../docs/module-federation.md) for the full config schema and webpack template. In brief:

1. **`package.json`** — add a `module-federation` key (name, remoteEntry, proxy, local port, service) and `"exports": { "./extensions": "..." }`
2. **`moduleFederation.js`** — configure `ModuleFederationPlugin` with `name`, `exposes`, `shared` singletons, `runtime: false`
3. **`src/odh/extensions.ts`** — export a default array of `Extension` objects
4. **Plugin discovery** — `discoverPluginPackages.js` finds packages with `./extensions` exports for webpack chunk grouping and manifest generation (it does not generate a static aggregator module)

## Shared Dependencies

All remotes **must** share as singletons: `react`, `react-dom`, `react-router`, `react-router-dom`, `@patternfly/react-core`.

Include if used: `@openshift/dynamic-plugin-sdk`, `@openshift/dynamic-plugin-sdk-utils`, `@odh-dashboard/plugin-core`.

All use `singleton: true` and `requiredVersion: deps['<package>']` from the local `package.json`.

## Runtime Loading Flow

1. `ExtensibilityContext` imports static shell extensions (`packages/dashboard-shell-frontend/src/plugins/extensions/`) at build time — these provide core navigation, routes, and task areas
2. Backend injects `mfRemotesJson` into `index.html` as `<script id="mf-remotes-json">` (prod) or `DefinePlugin` sets `MF_REMOTES` (dev)
3. `useAppExtensions` calls `init()` from `@module-federation/runtime` with remote entry URLs at `/_mf/{name}/remoteEntry.js`
4. Each remote's `./extensions` is loaded via `loadRemote('{name}/extensions')`
5. Failed loads are caught gracefully — the remote returns `[]` instead of crashing
6. `ExtensibilityContext` merges static shell extensions (keyed `'shell'`) with dynamic MF extensions into a single `PluginStore`
7. `PluginStore` makes all extensions available via `useExtensions()` / `useResolvedExtensions()`

## Entry Point Pattern

Both host and remotes use an async bootstrap — **required** for Module Federation shared scope negotiation:

```typescript
// src/index.ts — thin entry
import('./bootstrap');
// src/bootstrap.tsx — actual app mount
```

## Conventions

- **MF name** is camelCase matching `module-federation.name` in `package.json` and `name` in `ModuleFederationPlugin`
- **Remote entry** is always `/remoteEntry.js`
- **Exposes** use `./extensions` and `./extension-points` — not arbitrary module paths
- **Proxy paths** follow `/package-name/api` → `/api` rewrite pattern
- **Local dev ports** are unique per package (9100+)
- Set `runtime: false` on all remotes
- Set `output.publicPath = 'auto'` in webpack
- Lazy-load components in extensions via `component: () => import('./MyComponent')` (CodeRef pattern)
- Use `@mf/*` TypeScript path alias for typed imports of remote modules (types in `frontend/@mf-types/`)

## Key Files

| Purpose | Path |
|---|---|
| Host MF config | `packages/dashboard-config/src/module-federation.ts` |
| Plugin discovery | `packages/dashboard-build/discoverPluginPackages.js` |
| Plugin manifest | `packages/dashboard-build/generatePluginManifest.js` |
| Shell static extensions | `packages/dashboard-shell-frontend/src/plugins/extensions/` |
| Runtime init + loading | `packages/dashboard-shell-frontend/src/plugins/useAppExtensions.ts` |
| PluginStore provider | `packages/dashboard-shell-frontend/src/plugins/ExtensibilityContext.tsx` |
| MF_REMOTES constant | `packages/dashboard-foundation-frontend/src/utilities/const.ts` |
| Backend proxy setup | `packages/dashboard-shell-backend/src/routes/module-federation.ts` |
| Backend remotes injection | `packages/dashboard-shell-backend/src/routes/root.ts` |
| Prod ConfigMap | `manifests/modular-architecture/federation-configmap.yaml` |
| Extension point types | `packages/plugin-core/src/extension-points/` |
| Full MF docs | `docs/module-federation.md` |
| Extensibility docs | `docs/extensibility.md` |
