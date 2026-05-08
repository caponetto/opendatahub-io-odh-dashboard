import React from 'react';
import { FetchStateObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { DEFAULT_LIST_FETCH_STATE } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import { useMakeFetchObject } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useMakeFetchObject';
import { ModelCatalogSource } from '../types';
import { useModelCatalogSources } from '../useModelCatalogSources';

export type ModelCatalogContextType = {
  modelCatalogSources: FetchStateObject<ModelCatalogSource[]>;
};

type ModelCatalogContextProviderProps = {
  children: React.ReactNode;
};

export const ModelCatalogContext = React.createContext<ModelCatalogContextType>({
  modelCatalogSources: DEFAULT_LIST_FETCH_STATE,
});

export const ModelCatalogContextProvider: React.FC<ModelCatalogContextProviderProps> = ({
  children,
}) => {
  const modelCatalogSources = useMakeFetchObject(useModelCatalogSources());

  const contextValue = React.useMemo(
    () => ({
      modelCatalogSources,
    }),
    [modelCatalogSources],
  );

  return (
    <ModelCatalogContext.Provider value={contextValue}>{children}</ModelCatalogContext.Provider>
  );
};
