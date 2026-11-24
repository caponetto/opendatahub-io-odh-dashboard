import { useEffect, useState } from 'react';
import { DASHBOARD_NAMESPACE_TIMEOUT_MS, fetchBootstrapStatus } from './DashboardNamespaceContext';
import { fetchServingCapabilities, type ServingCapabilities } from './fetchServingCapabilities';

export type BootstrapState = {
  namespace: string;
  userName: string | undefined;
  capabilities: ServingCapabilities;
};

export type AppBootstrap = {
  state: BootstrapState | null;
  error: Error | null;
  reload: () => void;
};

const toBootstrapError = (error: unknown): Error => {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new Error('The server did not respond in time.');
  }
  return error instanceof Error ? error : new Error('Bootstrap failed.');
};

/** The status and capability fetches share one timeout and abort signal. */
export const useAppBootstrap = (): AppBootstrap => {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<BootstrapState | null>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DASHBOARD_NAMESPACE_TIMEOUT_MS);

    setState(null);
    setError(null);
    void Promise.all([
      fetchBootstrapStatus(controller.signal),
      fetchServingCapabilities(controller.signal),
    ])
      .then(([{ namespace, userName }, capabilities]) => {
        if (!cancelled) {
          setState({ namespace, userName, capabilities });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(toBootstrapError(e));
        }
      })
      .finally(() => clearTimeout(timer));

    return () => {
      cancelled = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, [attempt]);

  return { state, error, reload: () => setAttempt((a) => a + 1) };
};
