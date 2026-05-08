# @odh-dashboard/dashboard-build

Shared webpack build infrastructure for ODH Dashboard assembler packages. Provides reusable webpack configurations, Module Federation setup, plugin discovery, and build-time code generation.

## Responsibilities

- **Webpack configs** — Common, development, and production webpack configurations with SWC/TypeScript loaders, CSS/SCSS processing, Monaco editor integration, and asset handling.
- **Module Federation** — Shared dependency configuration and remote entry generation for federated modules.
- **Plugin discovery** — `discoverPluginPackages` scans the monorepo workspace to find extension packages and resolve their build metadata.
- **Plugin chunking** — `pluginChunking` configures webpack chunk splitting per extension package for optimal code splitting.
- **Dotenv** — Layered `.env` file loading and variable expansion for build-time environment configuration.

## Usage

Assembler packages (`dashboard-dist-full`, `dashboard-dist-slim`) consume this as a `devDependency`:

```js
const { createWebpackDev, createWebpackProd } = require('@odh-dashboard/dashboard-build');

module.exports = createWebpackDev({ srcDir, publicDir, packageJson });
```

## Exports

| Export | Description |
|--------|-------------|
| `createWebpackCommon` | Base webpack config shared by dev and prod |
| `createWebpackDev` | Development config with HMR and React Refresh |
| `createWebpackProd` | Production config with minification and optimization |
| `dotenv` | Dotenv file loader with expansion |
| `discoverPluginPackages` | Workspace scanner for extension packages |
| `moduleFederation` | MF shared dependency configuration |
| `pluginChunking` | Per-plugin chunk splitting setup |
| `getRuntimeOdhPackages` | Runtime package metadata resolver |
