import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { buildV2RedirectElement } from '@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect';
import {
  isHrefNavItemExtension,
  isRouteExtension,
  isRouteRedirectExtension,
  isTabRoutePageExtension,
  TabRoutePageExtension,
} from '@odh-dashboard/plugin-core/extension-points';
import { LazyCodeRefComponent, useExtensions } from '@odh-dashboard/plugin-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import UnauthorizedError from '@odh-dashboard/dashboard-foundation-frontend/components/UnauthorizedError';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import TabRoutePage from './navigation/TabRoutePage';
import { compareNavItemGroups } from './navigation/utils';

const NotFound = React.lazy(
  () => import('@odh-dashboard/dashboard-foundation-frontend/pages/NotFound'),
);

const DependencyMissingPage = React.lazy(
  () => import('../pages/dependencies/DependencyMissingPage'),
);

const fallback = <ApplicationsPage title="" description="" loaded={false} empty />;

const AppRoutes: React.FC = () => {
  const { isAllowed } = useUser();
  const routeExtensions = useExtensions(isRouteExtension);
  const redirectExtensions = useExtensions(isRouteRedirectExtension);
  const tabRoutePageExtensions = useExtensions<TabRoutePageExtension>(isTabRoutePageExtension);
  const navHrefExtensions = useExtensions(isHrefNavItemExtension);

  const hasRootRoute = routeExtensions.some(
    (ext) => ext.properties.path === '/' || ext.properties.path === '/*',
  );

  const rootRedirectTarget = React.useMemo(() => {
    if (hasRootRoute) {
      return null;
    }
    const all = [...navHrefExtensions, ...tabRoutePageExtensions];
    const topLevel = all.filter((ext) => !ext.properties.section);
    const candidates = (topLevel.length > 0 ? topLevel : all).toSorted(compareNavItemGroups);
    return candidates[0]?.properties.href ?? null;
  }, [hasRootRoute, navHrefExtensions, tabRoutePageExtensions]);

  const dynamicRoutes = React.useMemo(
    () =>
      routeExtensions.map((routeExtension) => (
        <Route
          key={routeExtension.uid}
          path={routeExtension.properties.path}
          element={
            <LazyCodeRefComponent
              key={routeExtension.uid}
              component={routeExtension.properties.component}
              fallback={fallback}
            />
          }
        />
      )),
    [routeExtensions],
  );

  const tabRoutePages = React.useMemo(
    () =>
      tabRoutePageExtensions.map((pageExtension) => (
        <Route
          key={pageExtension.uid}
          path={pageExtension.properties.path}
          element={<TabRoutePage extension={pageExtension} />}
        />
      )),
    [tabRoutePageExtensions],
  );

  const redirectRoutes = React.useMemo(
    () =>
      redirectExtensions.map((ext) => (
        <Route
          key={ext.uid}
          path={ext.properties.from}
          element={buildV2RedirectElement({
            from: ext.properties.from,
            to: ext.properties.to,
          })}
        />
      )),
    [redirectExtensions],
  );

  if (!isAllowed) {
    return (
      <Routes>
        <Route path="*" element={<UnauthorizedError />} />
      </Routes>
    );
  }

  return (
    <React.Suspense fallback={fallback}>
      <Routes>
        {dynamicRoutes}
        {tabRoutePages}
        {redirectRoutes}
        {rootRedirectTarget && (
          <Route path="/" element={<Navigate to={rootRedirectTarget} replace />} />
        )}
        <Route path="/dependency-missing/:area" element={<DependencyMissingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </React.Suspense>
  );
};

export default AppRoutes;
