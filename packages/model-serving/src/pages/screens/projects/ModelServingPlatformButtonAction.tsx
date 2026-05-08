import * as React from 'react';
import { Button, ButtonProps, Content, Tooltip } from '@patternfly/react-core';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import { KUEUE_MODEL_DEPLOYMENT_DISABLED_MESSAGE } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/kueueConstants';
import { isProjectNIMSupported } from './nim/nimUtils';
import useServingPlatformStatuses from '../../useServingPlatformStatuses';

type ModelServingPlatformButtonActionProps = ButtonProps & {
  emptyTemplates: boolean;
  testId?: string;
};

const ModelServingPlatformButtonAction: React.FC<ModelServingPlatformButtonActionProps> = ({
  emptyTemplates,
  testId,
  variant = 'secondary',
  ...buttonProps
}) => {
  const {
    servingRuntimeTemplates: [, templatesLoaded],
    currentProject,
  } = React.useContext(ProjectDetailsContext);
  const servingPlatformStatuses = useServingPlatformStatuses();
  const isNIMAvailable = servingPlatformStatuses.kServeNIM.enabled;
  const isKServeNIMEnabled = isProjectNIMSupported(currentProject);
  const isNimDisabled = !isNIMAvailable && isKServeNIMEnabled;

  const { isKueueDisabled } = useKueueConfiguration(currentProject);

  const actionButton = (
    <Button
      {...buttonProps}
      isLoading={!templatesLoaded}
      isAriaDisabled={!templatesLoaded || emptyTemplates || isNimDisabled || isKueueDisabled}
      data-testid={testId}
      variant={variant}
    >
      Deploy model
    </Button>
  );

  if (!emptyTemplates && !isNimDisabled && !isKueueDisabled) {
    return actionButton;
  }

  return (
    <Tooltip
      data-testid="deploy-model-tooltip"
      aria-label="Model Serving Action Info"
      content={
        isNimDisabled ? (
          'NIM is not available. Contact your administrator.'
        ) : isKueueDisabled ? (
          KUEUE_MODEL_DEPLOYMENT_DISABLED_MESSAGE
        ) : (
          <Content component="p">
            At least one serving runtime must be enabled to deploy a model. Contact your
            administrator.
          </Content>
        )
      }
    >
      {actionButton}
    </Tooltip>
  );
};

export default ModelServingPlatformButtonAction;
