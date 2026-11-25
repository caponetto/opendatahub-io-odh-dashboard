import React from 'react';
import { renderHook } from '@testing-library/react';
import { DashboardNamespaceContext } from '../DashboardNamespaceContext';
import { useWatchConnectionTypes } from '../useWatchConnectionTypes';

const wrapper: React.FC<React.PropsWithChildren> = ({ children }) => (
  <DashboardNamespaceContext.Provider value="rhaii-operator">
    {children}
  </DashboardNamespaceContext.Provider>
);

describe('useWatchConnectionTypes', () => {
  it('should provide the built-in URI connection type', () => {
    const { result } = renderHook(() => useWatchConnectionTypes(), { wrapper });

    expect(result.current[0].map((t) => t.metadata.name)).toEqual(['uri-v1']);
    expect(result.current[0][0].metadata.namespace).toBe('rhaii-operator');
    expect(result.current[1]).toBe(true);
  });

  it('should keep the type when filtered to model-serving compatibility', () => {
    const { result } = renderHook(() => useWatchConnectionTypes(true), { wrapper });

    expect(result.current[0].map((t) => t.metadata.name)).toEqual(['uri-v1']);
  });
});
