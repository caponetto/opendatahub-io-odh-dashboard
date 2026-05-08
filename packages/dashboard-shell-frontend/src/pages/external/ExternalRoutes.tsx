import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { useExtensions, LazyCodeRefComponent } from '@odh-dashboard/plugin-core';
import { isExternalRedirectExtension } from '@odh-dashboard/plugin-core/extension-points';
import ExternalRedirectNotFound from './redirectComponents/ExternalRedirectNotFound';

const ExternalRoutes: React.FC = () => {
  const redirectExtensions = useExtensions(isExternalRedirectExtension);

  return (
    <Routes>
      {redirectExtensions.map((ext) => (
        <Route
          key={ext.uid}
          path={ext.properties.path}
          element={<LazyCodeRefComponent component={ext.properties.component} />}
        />
      ))}
      <Route path="*" element={<ExternalRedirectNotFound />} />
    </Routes>
  );
};

export default ExternalRoutes;
