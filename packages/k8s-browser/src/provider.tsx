import * as React from 'react';
import { configureK8sClient } from './config';

type K8sAPIProviderProps = React.PropsWithChildren<{
  apiBasePath?: string;
  wsBasePath?: string;
  wsHost?: string;
}>;

export const K8sAPIProvider: React.FC<K8sAPIProviderProps> = ({
  apiBasePath,
  children,
  wsBasePath,
  wsHost,
}) => {
  React.useLayoutEffect(() => {
    configureK8sClient({
      ...(apiBasePath && { apiBasePath }),
      ...(wsBasePath && { wsBasePath }),
      ...(wsHost && { wsHost }),
    });
  }, [apiBasePath, wsBasePath, wsHost]);

  return <>{children}</>;
};
