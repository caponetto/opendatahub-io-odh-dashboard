import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { useParams } from 'react-router-dom';
import { ServingRuntimePlatform } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  byName,
  ProjectsContext,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/ProjectsContext';
import { useKueueConfiguration } from '@odh-dashboard/distributed-workloads-shared/concepts/kueue/kueueUtils';
import { KUEUE_MODEL_DEPLOYMENT_DISABLED_MESSAGE } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/kueueConstants';
import { ModelServingContext } from '../../ModelServingContext';
import {
  getSortedTemplates,
  getTemplateEnabled,
  getTemplateEnabledForPlatform,
} from '../../customServingRuntimes/utils';
import { getProjectModelServingPlatform } from '../projects/utils';
import ManageKServeModal from '../projects/kServeModal/ManageKServeModal';
import { isProjectNIMSupported } from '../projects/nim/nimUtils';
import ManageNIMServingModal from '../projects/nim/NIMServiceModal/ManageNIMServingModal';
import useServingPlatformStatuses from '../../useServingPlatformStatuses';

const ServeModelButton: React.FC = () => {
  const [platformSelected, setPlatformSelected] = React.useState<
    ServingRuntimePlatform | undefined
  >(undefined);
  const {
    inferenceServices: { refresh: refreshInferenceServices },
    servingRuntimes: { refresh: refreshServingRuntimes },
    servingRuntimeTemplates: [templates],
    servingRuntimeTemplateOrder: { data: templateOrder },
    servingRuntimeTemplateDisablement: { data: templateDisablement },
    connections: { data: connections },
  } = React.useContext(ModelServingContext);
  const { projects } = React.useContext(ProjectsContext);
  const { namespace } = useParams<{ namespace: string }>();
  const servingPlatformStatuses = useServingPlatformStatuses();
  const isNIMAvailable = servingPlatformStatuses.kServeNIM.enabled;
  const safeTemplates = React.useMemo(() => templates ?? [], [templates]);

  const project = projects.find(byName(namespace));

  const { isKueueDisabled } = useKueueConfiguration(project);

  const templatesSorted = getSortedTemplates(safeTemplates, templateOrder);
  const templatesEnabled = templatesSorted.filter((template) =>
    getTemplateEnabled(template, templateDisablement),
  );
  const isKServeNIMEnabled = !!project && isProjectNIMSupported(project);

  const onSubmit = (submit: boolean) => {
    if (submit) {
      refreshInferenceServices();
      refreshServingRuntimes();
    }
    setPlatformSelected(undefined);
  };

  const deployButton = (
    <Button
      data-testid="deploy-button"
      variant="primary"
      onClick={() =>
        project &&
        setPlatformSelected(
          getProjectModelServingPlatform(project, servingPlatformStatuses).platform,
        )
      }
      isAriaDisabled={
        !project ||
        templatesEnabled.length === 0 ||
        (!isNIMAvailable && isKServeNIMEnabled) ||
        isKueueDisabled
      }
    >
      Deploy model
    </Button>
  );

  if (!project) {
    return (
      <Tooltip data-testid="deploy-model-tooltip" content="To deploy a model, select a project.">
        {deployButton}
      </Tooltip>
    );
  }

  if (!isNIMAvailable && isKServeNIMEnabled) {
    return (
      <Tooltip content="NIM is not available. Contact your administrator.">{deployButton}</Tooltip>
    );
  }

  if (isKueueDisabled) {
    return <Tooltip content={KUEUE_MODEL_DEPLOYMENT_DISABLED_MESSAGE}>{deployButton}</Tooltip>;
  }

  return (
    <>
      {deployButton}
      {/* Now KServe-only */}
      {platformSelected === ServingRuntimePlatform.SINGLE ? (
        isKServeNIMEnabled ? (
          <ManageNIMServingModal projectContext={{ currentProject: project }} onClose={onSubmit} />
        ) : (
          <ManageKServeModal
            projectContext={{
              currentProject: project,
              connections,
            }}
            servingRuntimeTemplates={templatesEnabled.filter((template) =>
              getTemplateEnabledForPlatform(template, ServingRuntimePlatform.SINGLE),
            )}
            onClose={(submit: boolean) => {
              onSubmit(submit);
            }}
          />
        )
      ) : null}
    </>
  );
};

export default ServeModelButton;
