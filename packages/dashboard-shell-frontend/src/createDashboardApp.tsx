import React from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ReduxContext } from '@odh-dashboard/dashboard-foundation-frontend/redux/context';
import type { Action } from 'redux';
import type { AppShellConfig } from './types';
import { configureStores } from './redux/configureStores';
import ErrorBoundary from './components/error/ErrorBoundary';
import RouteErrorElement from './components/error/RouteErrorElement';
import { BrowserStorageContextProvider } from './providers/BrowserStorageContext';
import { ThemeProvider } from './providers/ThemeContext';
import SDKInitialize from './providers/SDKInitialize';

export function createDashboardApp<S, A extends Action>(config: AppShellConfig<S, A>): void {
  const { App, appReducer, rootElementId = 'root' } = config;
  const { store } = configureStores(appReducer);

  const router = createBrowserRouter([
    {
      path: '*',
      element: (
        <SDKInitialize>
          <BrowserStorageContextProvider>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </BrowserStorageContextProvider>
        </SDKInitialize>
      ),
      errorElement: <RouteErrorElement />,
    },
  ]);

  const container = document.getElementById(rootElementId);
  if (!container) {
    throw new Error(`Root element #${rootElementId} not found`);
  }
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Provider store={store} context={ReduxContext}>
          <RouterProvider router={router} />
        </Provider>
      </ErrorBoundary>
    </React.StrictMode>,
  );
}
