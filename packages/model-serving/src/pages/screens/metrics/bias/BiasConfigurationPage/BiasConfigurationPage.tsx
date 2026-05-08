import * as React from 'react';
import { Breadcrumb, Button, EmptyStateVariant, PageSection } from '@patternfly/react-core';
import { useNavigate } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { BreadcrumbItemType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { InferenceServiceKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { TrustyInstallState } from '@odh-dashboard/model-serving-shared/concepts/trustyai/types';
import ManageBiasConfigurationModal from './BiasConfigurationModal/ManageBiasConfigurationModal';
import BiasConfigurationTable from './BiasConfigurationTable';
import BiasConfigurationEmptyState from './BiasConfigurationEmptyState';
import { MetricsTabKeys } from '../../types';
import { getBreadcrumbItemComponents } from '../../utils';
import { useModelBiasData } from '../../../../../concepts/useBiasIntegration';

type BiasConfigurationPageProps = {
  breadcrumbItems: BreadcrumbItemType[];
  inferenceService: InferenceServiceKind;
};

const BiasConfigurationPage: React.FC<BiasConfigurationPageProps> = ({
  breadcrumbItems,
  inferenceService,
}) => {
  const { biasMetricConfigs, statusState, refresh } = useModelBiasData();
  const navigate = useNavigate();
  const firstRender = React.useRef(true);
  const [isOpen, setOpen] = React.useState(false);

  const isInstalled = statusState.type === TrustyInstallState.INSTALLED;
  React.useEffect(() => {
    if (isInstalled) {
      if (firstRender.current) {
        firstRender.current = false;
        if (biasMetricConfigs.length === 0) {
          setOpen(true);
        }
      }
    }
  }, [biasMetricConfigs, isInstalled]);

  return (
    <>
      <ApplicationsPage
        title="Bias metric configuration"
        description="Manage the configuration of model bias metrics."
        breadcrumb={<Breadcrumb>{getBreadcrumbItemComponents(breadcrumbItems)}</Breadcrumb>}
        headerAction={
          <Button onClick={() => navigate(`../${MetricsTabKeys.BIAS}`, { relative: 'path' })}>
            {biasMetricConfigs.length === 0
              ? `Back to ${getDisplayNameFromK8sResource(inferenceService)}`
              : 'View metrics'}
          </Button>
        }
        loaded={isInstalled}
        provideChildrenPadding
        empty={biasMetricConfigs.length === 0}
        emptyStatePage={
          <PageSection hasBodyWrapper={false} isFilled>
            <BiasConfigurationEmptyState
              actionButton={<Button onClick={() => setOpen(true)}>Configure metric</Button>}
              variant={EmptyStateVariant.lg}
            />
          </PageSection>
        }
      >
        <BiasConfigurationTable
          inferenceService={inferenceService}
          onConfigure={() => setOpen(true)}
        />
      </ApplicationsPage>
      {isOpen ? (
        <ManageBiasConfigurationModal
          onClose={(submit) => {
            if (submit) {
              refresh();
            }
            setOpen(false);
          }}
          inferenceService={inferenceService}
        />
      ) : null}
    </>
  );
};

export default BiasConfigurationPage;
