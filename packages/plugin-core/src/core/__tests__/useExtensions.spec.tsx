import * as React from 'react';
import { act } from 'react';
import { renderHook } from '@odh-dashboard/jest-config/hooks';
import { PluginStore } from '../plugin-store';
import { PluginStoreProvider, usePluginStore } from '../PluginStoreContext';
import { useExtensions } from '../useExtensions';
import type { Extension } from '../types';

type TestExtension = Extension<'test', { id: string }>;

const renderOptions = (store: PluginStore) => ({
  wrapper: ({ children }: { children: React.ReactNode }) => (
    <PluginStoreProvider store={store}>{children}</PluginStoreProvider>
  ),
});

describe('useExtensions', () => {
  it('should expose the current plugin store via usePluginStore', () => {
    const store = new PluginStore({});

    const renderResult = renderHook(() => usePluginStore(), renderOptions(store));

    expect(renderResult.result.current).toBe(store);
  });

  it('should return matching extensions and update when feature flags change', () => {
    const store = new PluginStore({
      test: [
        {
          type: 'test',
          flags: {
            required: ['enabled'],
          },
          properties: {
            id: 'flagged-extension',
          },
        },
      ],
    });

    const renderResult = renderHook(
      () =>
        useExtensions<TestExtension>(
          (extension): extension is TestExtension => extension.type === 'test',
        ),
      renderOptions(store),
    );

    expect(renderResult.result.current).toHaveLength(0);

    act(() => {
      store.setFeatureFlags({ enabled: true });
    });

    expect(renderResult.result.current).toHaveLength(1);
    expect(renderResult.result.current[0].properties).toMatchObject({
      id: 'flagged-extension',
    });
  });
});
