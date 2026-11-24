import React, { type FC } from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AppBootstrapProvider, { useBootstrapState } from '../AppBootstrapProvider';

const DEFAULT_STATUS = { kube: { namespace: 'opendatahub' } };
const SERVING_GROUP_URL = '/api/k8s/apis/serving.kserve.io';
const SERVING_GROUP = { versions: [{ groupVersion: 'serving.kserve.io/v1alpha2' }] };
const SERVING_RESOURCES_URL = '/api/k8s/apis/serving.kserve.io/v1alpha2';
const SERVING_RESOURCES = {
  resources: [{ name: 'llminferenceservices' }, { name: 'inferenceservices' }],
};

const jsonResponse = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body } as Response);

const errorResponse = (status: number): Response =>
  ({ ok: false, status, json: async () => ({}) } as Response);

const toUrl = (input: RequestInfo | URL): string => {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.href;
  }
  return input.url;
};

const createBootstrapFetch = (routeOverrides: Record<string, Response> = {}) => {
  const routes: Record<string, Response> = {
    '/api/status': jsonResponse(DEFAULT_STATUS),
    [SERVING_GROUP_URL]: jsonResponse(SERVING_GROUP),
    [SERVING_RESOURCES_URL]: jsonResponse(SERVING_RESOURCES),
    ...routeOverrides,
  };
  return jest.fn<Promise<Response>, Parameters<typeof fetch>>((input) => {
    const url = toUrl(input);
    if (!Object.hasOwn(routes, url)) {
      return Promise.reject(new Error(`Unexpected request: ${url}`));
    }
    return Promise.resolve(routes[url]);
  });
};

const BootstrapStateConsumer: FC = () => {
  const { namespace } = useBootstrapState();
  return <span data-testid="resolved-namespace">{namespace}</span>;
};

beforeEach(() => {
  jest.clearAllMocks();
  globalThis.fetch = createBootstrapFetch();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('AppBootstrapProvider', () => {
  it('should not render children while the bootstrap is pending', async () => {
    let resolveStatus: (value: Response) => void = () => undefined;
    globalThis.fetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>((input) => {
      if (toUrl(input) === '/api/status') {
        return new Promise((resolve) => {
          resolveStatus = resolve;
        });
      }
      return createBootstrapFetch()(input);
    });

    render(
      <AppBootstrapProvider>
        <BootstrapStateConsumer />
      </AppBootstrapProvider>,
    );

    // Flush microtasks: children — and everything they would request — stay unmounted.
    await Promise.resolve();
    await Promise.resolve();
    expect(screen.queryByTestId('resolved-namespace')).not.toBeInTheDocument();

    resolveStatus({ ok: true, status: 200, json: async () => DEFAULT_STATUS } as Response);
    await waitFor(() =>
      expect(screen.getByTestId('resolved-namespace').textContent).toBe('opendatahub'),
    );
  });

  it('should render an actionable error with a retry when the bootstrap fails', async () => {
    globalThis.fetch = createBootstrapFetch({ '/api/status': errorResponse(500) });

    render(
      <AppBootstrapProvider>
        <BootstrapStateConsumer />
      </AppBootstrapProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('bootstrap-error')).toBeInTheDocument());
    expect(screen.getByText(/Unable to load the server status \(HTTP 500\)/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
    expect(screen.queryByTestId('resolved-namespace')).not.toBeInTheDocument();
  });

  it('should recover through the retry button', async () => {
    let statusResponse: Response = {
      ok: false,
      status: 503,
      json: async () => ({}),
    } as Response;
    globalThis.fetch = jest.fn<Promise<Response>, Parameters<typeof fetch>>((input) => {
      if (toUrl(input) === '/api/status') {
        return Promise.resolve(statusResponse);
      }
      return createBootstrapFetch()(input);
    });

    render(
      <AppBootstrapProvider>
        <BootstrapStateConsumer />
      </AppBootstrapProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('bootstrap-error')).toBeInTheDocument());

    statusResponse = {
      ok: true,
      status: 200,
      json: async () => DEFAULT_STATUS,
    } as Response;
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() =>
      expect(screen.getByTestId('resolved-namespace').textContent).toBe('opendatahub'),
    );
  });
});
