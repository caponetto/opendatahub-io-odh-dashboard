# @odh-dashboard/plugin-types

Shared extension contract types for the ODH Dashboard modular architecture.

## Purpose

This package holds the small, type-only extension contract surface that is shared across modular packages:

- base extension shapes such as `Extension`, `LoadedExtension`, and `ResolvedExtension`
- code reference helpers such as `CodeRef` and `ComponentCodeRef`
- shared flag and utility types such as `ExtensionFlags`, `FeatureFlags`, and `AnyObject`

It exists to keep these contracts lightweight and reusable without forcing every consumer to depend on the full `plugin-core` runtime stack.

## When To Use It

- Import from `@odh-dashboard/plugin-types` when a package only needs extension contract types.
- Import from `@odh-dashboard/plugin-core` when you also need plugin runtime APIs such as hooks, providers, extension-point definitions, or store utilities.

`plugin-core` re-exports these types for convenience, so runtime-oriented code should usually keep using `plugin-core`.

## Key Exports

| Export | Description |
|--------|-------------|
| `Extension` | Base extension contract with `type`, `properties`, and optional flags |
| `LoadedExtension` | Extension shape after plugin metadata such as `pluginName` and `uid` is attached |
| `ResolvedExtension` | Extension shape after `CodeRef` properties have been resolved to loaded values |
| `CodeRef`, `ComponentCodeRef` | Lazy code-loading reference helpers used by extension definitions |
| `ExtensionFlags`, `FeatureFlags` | Shared feature-flag and extension gating types |
| `AnyObject` | Generic object helper used across extension type definitions |

## Usage

```ts
import type { CodeRef, Extension, ResolvedExtension } from '@odh-dashboard/plugin-types';

type ExampleExtension = Extension<
  'app.example',
  {
    id: string;
    component: CodeRef<{ default: React.ComponentType }>;
  }
>;

type LoadedExample = ResolvedExtension<ExampleExtension>;
```

## Boundaries

- Keep this package type-only and minimal.
- Do not move plugin runtime behavior here; that belongs in `plugin-core`.
- Prefer adding new extension contracts here only when they are broadly shared and have no runtime behavior.

> For full documentation see [`docs/guidelines.md`](../../docs/guidelines.md).
