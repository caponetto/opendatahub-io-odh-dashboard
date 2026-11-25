import React, { useContext, type FC, type PropsWithChildren, type ReactNode } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useK8sWatchResource } from '@openshift/dynamic-plugin-sdk-utils';
import { PluginStoreProvider } from '@openshift/dynamic-plugin-sdk';
import { PluginStore } from '@odh-dashboard/plugin-core';
import { useWatchConnectionTypes } from '@odh-dashboard/plugin-core/host-api';
import { HardwareProfilesContext } from '@odh-dashboard/ui-core/context/HardwareProfilesContext';
import type { HardwareProfileKind } from '@odh-dashboard/k8s-core';
import RhaiiAppProviderComponent from '../RhaiiAppProvider';

jest.mock('@openshift/dynamic-plugin-sdk-utils', () => ({
  ...jest.requireActual('@openshift/dynamic-plugin-sdk-utils'),
  useK8sWatchResource: jest.fn(),
}));

const mockUseK8sWatchResource = jest.mocked(useK8sWatchResource);

jest.mock('../ProjectsContextProvider', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));

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

const RhaiiAppProvider: FC<PropsWithChildren> = ({ children }) => (
  <PluginStoreProvider store={pluginStore}>
    <RhaiiAppProviderComponent>{children}</RhaiiAppProviderComponent>
  </PluginStoreProvider>
);

const ConnectionTypesConsumer: FC = () => {
  const [connectionTypes] = useWatchConnectionTypes();
  const {
    globalHardwareProfiles: [profiles],
  } = useContext(HardwareProfilesContext);
  return (
    <>
      <span data-testid="connection-type-names">
        {connectionTypes.map((connectionType) => connectionType.metadata.name).join(',')}
      </span>
      <span data-testid="hardware-profile-names">
        {profiles.map((profile) => profile.metadata.name).join(',')}
      </span>
    </>
  );
};

const HARDWARE_PROFILES: HardwareProfileKind[] = [
  {
    apiVersion: 'infrastructure.opendatahub.io/v1',
    kind: 'HardwareProfile',
    metadata: { name: 'default-profile', namespace: 'opendatahub' },
    spec: { identifiers: [] },
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  pluginStore = new PluginStore({});
  mockUseK8sWatchResource.mockReturnValue([HARDWARE_PROFILES, true, undefined]);
  globalThis.fetch = createBootstrapFetch();
});

afterEach(() => {
  jest.restoreAllMocks();
  delete (globalThis as { fetch?: typeof fetch }).fetch;
});

describe('RhaiiAppProvider composition', () => {
  it('should provide the built-in URI connection type through the composition', async () => {
    render(
      <RhaiiAppProvider>
        <ConnectionTypesConsumer />
      </RhaiiAppProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('connection-type-names').textContent).toBe('uri-v1'),
    );
  });

  it('should watch the dashboard namespace resolved by the BFF', async () => {
    globalThis.fetch = createBootstrapFetch({
      '/api/status': jsonResponse({ kube: { namespace: 'redhat-ods-applications' } }),
    });

    render(
      <RhaiiAppProvider>
        <ConnectionTypesConsumer />
      </RhaiiAppProvider>,
    );

    await waitFor(() =>
      expect(mockUseK8sWatchResource).toHaveBeenLastCalledWith(
        expect.objectContaining({ namespace: 'redhat-ods-applications' }),
        expect.objectContaining({ kind: 'HardwareProfile' }),
        undefined,
      ),
    );
    // The watch never started against the fallback namespace.
    for (const call of mockUseK8sWatchResource.mock.calls) {
      expect((call[0] as { namespace?: string }).namespace).not.toBe('opendatahub');
    }
  });
});
