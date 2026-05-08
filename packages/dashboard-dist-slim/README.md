# @odh-dashboard/dashboard-dist-slim

Slim assembler package that produces a minimal dashboard variant with a selective subset of feature packages. Demonstrates the modular architecture's ability to compose different dashboard experiences from the same set of building blocks.

## Responsibilities

- Imports a curated subset of feature package extensions (currently Model Serving).
- Passes the reduced extension set to `@odh-dashboard/dashboard-shell-frontend` for bootstrapping.
- Produces a smaller, faster dashboard suitable for environments that only need specific capabilities.

## Architecture

```
dashboard-dist-slim (assembler)
  ├── dashboard-shell-frontend (app shell)
  ├── dashboard-shell-backend (BFF server)
  ├── dashboard-foundation-frontend (shared infra)
  └── selected feature packages only
```

## Customization

To create a new dashboard variant, duplicate this package and adjust which feature packages are imported and registered. The shell handles routing and context providers dynamically based on the extensions provided.
