import React, { createContext, useContext, type FC, type PropsWithChildren } from 'react';
import {
  Bullseye,
  Button,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Spinner,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/esm/icons/exclamation-circle-icon';
import { DashboardNamespaceContext } from './DashboardNamespaceContext';
import { useAppBootstrap, type BootstrapState } from './useAppBootstrap';

const BootstrapStateContext = createContext<BootstrapState | null>(null);

export const useBootstrapState = (): BootstrapState => {
  const state = useContext(BootstrapStateContext);
  if (!state) {
    throw new Error('useBootstrapState must be used below the app bootstrap provider.');
  }
  return state;
};

/**
 * Withhold children until the namespace and capabilities resolve, so no request
 * or watch runs against a fallback namespace or an ungated capability.
 */
const AppBootstrapProvider: FC<PropsWithChildren> = ({ children }) => {
  const { state, error, reload } = useAppBootstrap();

  if (error) {
    return (
      <Bullseye>
        <EmptyState
          data-testid="bootstrap-error"
          headingLevel="h1"
          icon={ExclamationCircleIcon}
          titleText="Unable to start the dashboard"
        >
          <EmptyStateBody>
            {error.message} Verify the deployment configuration, sign in again, and retry. If the
            problem persists, contact your administrator.
          </EmptyStateBody>
          <EmptyStateFooter>
            <Button variant="primary" onClick={reload}>
              Retry
            </Button>
          </EmptyStateFooter>
        </EmptyState>
      </Bullseye>
    );
  }

  if (!state) {
    return (
      <Bullseye>
        <Spinner aria-label="Starting the dashboard" />
      </Bullseye>
    );
  }

  return (
    <BootstrapStateContext.Provider value={state}>
      <DashboardNamespaceContext.Provider value={state.namespace}>
        {children}
      </DashboardNamespaceContext.Provider>
    </BootstrapStateContext.Provider>
  );
};

export default AppBootstrapProvider;
