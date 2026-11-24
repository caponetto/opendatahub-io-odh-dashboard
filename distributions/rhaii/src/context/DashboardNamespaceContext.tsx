import { createContext } from 'react';
import { isRecord } from '../utils/typeGuards';

/** Context default only — the bootstrap gate never renders consumers before the namespace resolves. */
export const DEFAULT_DASHBOARD_NAMESPACE = 'opendatahub';
export const DASHBOARD_NAMESPACE_TIMEOUT_MS = 30_000;

export const DashboardNamespaceContext = createContext(DEFAULT_DASHBOARD_NAMESPACE);

export type BootstrapStatus = {
  namespace: string;
  userName: string | undefined;
};

const readString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined;

export const API_STATUS_PATH = '/api/status';

/** Only the namespace is required: a missing user name is not a bootstrap failure. */
export const fetchBootstrapStatus = async (signal?: AbortSignal): Promise<BootstrapStatus> => {
  const response = await fetch(API_STATUS_PATH, { signal });
  if (!response.ok) {
    throw new Error(`Unable to load the server status (HTTP ${response.status}).`);
  }
  const body: unknown = await response.json().catch(() => undefined);
  const kube = isRecord(body) && isRecord(body.kube) ? body.kube : undefined;
  const namespace = readString(kube?.namespace);
  if (namespace === undefined) {
    throw new Error('The server status did not include the application namespace.');
  }
  const userName =
    readString(kube?.userName) ??
    (isRecord(kube?.currentUser) ? readString(kube.currentUser.name) : undefined);
  return { namespace, userName };
};
