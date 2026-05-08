import * as React from 'react';
import { act } from 'react';
import { renderHook } from '@odh-dashboard/jest-config/hooks';
import { PluginStore } from '../plugin-store';
import { PluginStoreProvider } from '../PluginStoreContext';
import { useFeatureFlag } from '../useFeatureFlag';

const renderOptions = (store: PluginStore) => ({
  wrapper: ({ children }: { children: React.ReactNode }) => (
    <PluginStoreProvider store={store}>{children}</PluginStoreProvider>
  ),
});

describe('useFeatureFlag', () => {
  it('should return the current flag value and update when feature flags change', () => {
    const store = new PluginStore({});

    const renderResult = renderHook(() => useFeatureFlag('enabled-feature'), renderOptions(store));

    expect(renderResult.result.current).toStrictEqual([false]);

    act(() => {
      store.setFeatureFlags({ enabledFeature: true, 'enabled-feature': true });
    });

    expect(renderResult.result.current).toStrictEqual([true]);
  });
});
