import { Outlet, useParams } from 'react-router-dom';
import React from 'react';
import NotFound from '@odh-dashboard/dashboard-foundation-frontend/pages/NotFound';
import { BiasContextProviderWrapper } from '../../../concepts/useBiasIntegration';

const ProjectInferenceExplainabilityWrapper: React.FC = () => {
  const { namespace } = useParams<{ namespace: string }>();

  if (!namespace) {
    return <NotFound />;
  }

  return (
    <BiasContextProviderWrapper namespace={namespace}>
      <Outlet />
    </BiasContextProviderWrapper>
  );
};

export default ProjectInferenceExplainabilityWrapper;
