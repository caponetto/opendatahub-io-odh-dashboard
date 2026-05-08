import { proxyService } from '@odh-dashboard/dashboard-foundation-backend/proxy';

export default proxyService(
  null,
  {
    internalPort: 8321,
  },
  {
    // Use port forwarding for local development:
    // kubectl port-forward -n <namespace> svc/<service-name> 8321:8321
    host: 'localhost',
    port: 8321,
  },
  undefined,
  false,
);
