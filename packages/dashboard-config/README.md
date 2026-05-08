# @odh-dashboard/dashboard-config

Shared configuration types and utilities for the ODH Dashboard application.

## Purpose

Provides Module Federation configuration helpers and shared TypeScript types consumed across the frontend and backend layers. Includes workspace discovery, federation config normalization, and proxy/backend config shapes.

## Usage

```ts
import { getWorkspacePackages, getMFRemoteConfigs } from '@odh-dashboard/dashboard-config';
import type { ModuleFederationConfig, ProxyConfig } from '@odh-dashboard/dashboard-config';
```

## Contents

| Path | Description |
|------|-------------|
| `src/module-federation.ts` | Workspace/Module Federation config loading and normalization helpers |
| `src/types.ts` | TypeScript definitions for federation, workspace, proxy, and backend config shapes |
| `scripts/` | Build-time configuration scripts |
