import React, { type FC, type PropsWithChildren } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { PluginStoreProvider, useFeatureFlag } from '@openshift/dynamic-plugin-sdk';
import { PluginStore } from '@odh-dashboard/plugin-core';
import { SupportedArea, useIsAreaAvailable } from '@odh-dashboard/plugin-core/areas';
import AppBootstrapProvider from '../AppBootstrapProvider';
import RhaiiAreaProvider from '../RhaiiAreaProvider';

let pluginStore: PluginStore;

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

/** The area provider reads the bootstrap state, so mount both like the app does. */
const AreaProviders: FC<PropsWithChildren> = ({ children }) => (
  <PluginStoreProvider store={pluginStore}>
    <AppBootstrapProvider>
      <RhaiiAreaProvider>{children}</RhaiiAreaProvider>
    </AppBootstrapProvider>
  </PluginStoreProvider>
);

const AreaFlagProbe: FC = () => {
  const [llmdFlag] = useFeatureFlag('llmd-serving');
  const [kserveFlag] = useFeatureFlag('kserve');
  const modelServingArea = useIsAreaAvailable(SupportedArea.MODEL_SERVING).status;
  return (
    <span data-testid="area-flags">
      {[
        `llmd:${String(llmdFlag)}`,
        `kserve:${String(kserveFlag)}`,
        `model-serving:${String(modelServingArea)}`,
      ].join(' ')}
    </span>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  pluginStore = new PluginStore({});
  globalThis.fetch = createBootstrapFetch();
  jest.spyOn(console, 'warn').mockImplementation();
  jest.spyOn(console, 'error').mockImplementation();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('RhaiiAreaProvider serving capability discovery', () => {
  it('should enable both serving areas when the cluster serves both resources', async () => {
    render(
      <AreaProviders>
        <AreaFlagProbe />
      </AreaProviders>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('area-flags').textContent).toBe(
        'llmd:true kserve:true model-serving:true',
      ),
    );
  });

  it('should gate the serving areas when the API group is not served', async () => {
    globalThis.fetch = createBootstrapFetch({ [SERVING_GROUP_URL]: errorResponse(404) });

    render(
      <AreaProviders>
        <AreaFlagProbe />
      </AreaProviders>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('area-flags').textContent).toBe(
        'llmd:false kserve:false model-serving:true',
      ),
    );
  });

  it('should gate only the missing capability when one serving resource is absent', async () => {
    globalThis.fetch = createBootstrapFetch({
      [SERVING_RESOURCES_URL]: jsonResponse({
        resources: [{ name: 'inferenceservices' }],
      }),
    });

    render(
      <AreaProviders>
        <AreaFlagProbe />
      </AreaProviders>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('area-flags').textContent).toBe(
        'llmd:false kserve:true model-serving:true',
      ),
    );
  });

  it('should surface a discovery error instead of gating silently', async () => {
    globalThis.fetch = createBootstrapFetch({ [SERVING_GROUP_URL]: errorResponse(500) });

    render(
      <AreaProviders>
        <AreaFlagProbe />
      </AreaProviders>,
    );

    await waitFor(() => expect(screen.getByTestId('bootstrap-error')).toBeInTheDocument());
  });
});

describe('RhaiiAreaProvider unified selector gate', () => {
  it.each([
    [undefined, false],
    [false, false],
    [true, true],
  ])('should expose %s through the area contract', async (flag, expected) => {
    if (flag !== undefined) {
      pluginStore.setFeatureFlags({ 'unified-project-selector': flag });
    }
    const Status: FC = () => {
      const { status } = useIsAreaAvailable(SupportedArea.UNIFIED_PROJECT_SELECTOR);
      return <span data-testid="ups-status">{String(status)}</span>;
    };
    render(
      <AreaProviders>
        <Status />
      </AreaProviders>,
    );
    await waitFor(() =>
      expect(screen.getByTestId('ups-status').textContent).toBe(String(expected)),
    );
  });
});
