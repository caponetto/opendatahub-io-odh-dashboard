import React from 'react';
import { Outlet } from 'react-router-dom';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import EnsureCompatiblePipelineServer from '@odh-dashboard/pipelines/concepts/EnsureCompatiblePipelineServer';

const PipelineAvailabilityLoader: React.FC = () => (
  <EnsureAPIAvailability>
    <EnsureCompatiblePipelineServer>
      <Outlet />
    </EnsureCompatiblePipelineServer>
  </EnsureAPIAvailability>
);

export default PipelineAvailabilityLoader;
