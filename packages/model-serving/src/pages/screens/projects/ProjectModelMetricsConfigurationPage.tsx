import * as React from 'react';
import { useOutletContext } from 'react-router';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { ProjectModelMetricsOutletContextProps } from './ProjectModelMetricsWrapper';
import BiasConfigurationPage from '../metrics/bias/BiasConfigurationPage/BiasConfigurationPage';

const ProjectModelMetricsConfigurationPage: React.FC = () => {
  const { currentProject, model } = useOutletContext<ProjectModelMetricsOutletContextProps>();
  return (
    <BiasConfigurationPage
      breadcrumbItems={[
        { label: 'Projects', link: '/projects' },
        {
          label: getDisplayNameFromK8sResource(currentProject),
          link: `/projects/${currentProject.metadata.name}`,
        },
        {
          label: getDisplayNameFromK8sResource(model),
          link: `/projects/${currentProject.metadata.name}/metrics/model/${model.metadata.name}`,
        },
        { label: 'Metric configuration', isActive: true },
      ]}
      inferenceService={model}
    />
  );
};

export default ProjectModelMetricsConfigurationPage;
