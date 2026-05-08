# @odh-dashboard/dashboard-shell-backend

Configurable Fastify-based backend server for ODH Dashboard. Provides the Backend-for-Frontend (BFF) layer with Kubernetes API proxying, Module Federation remote routing, WebSocket support, and static SPA serving.

## Responsibilities

- **Kubernetes proxy** — Authenticates and proxies requests to the cluster API server on behalf of the logged-in user.
- **Module Federation routing** — Serves federated remote entry points for dynamically loaded UI plugins.
- **SPA serving** — Serves the built frontend assets with proper fallback routing for client-side navigation.
- **WebSocket support** — Proxies WebSocket connections for real-time features (e.g., notebook terminals).
- **Configuration** — Reads dashboard configuration from `@odh-dashboard/dashboard-config` and exposes it to the frontend.

## Usage

```ts
import { createBackendServer } from '@odh-dashboard/dashboard-shell-backend';

const server = await createBackendServer({ publicDir, assemblerDir });
await server.listen({ port: 8080 });
```

## Key Dependencies

- [Fastify](https://fastify.dev/) — HTTP framework
- `@kubernetes/client-node` — Kubernetes API client
- `@odh-dashboard/dashboard-config` — Shared configuration types
