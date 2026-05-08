import { LabelGroup, Stack, StackItem } from '@patternfly/react-core';
import * as React from 'react';
import { ServingRuntimeKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import ScopedLabel from '@odh-dashboard/dashboard-foundation-frontend/components/ScopedLabel';
import {
  useIsAreaAvailable,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import {
  getDisplayNameFromServingRuntimeTemplate,
  getServingRuntimeVersion,
  getTemplateNameFromServingRuntime,
} from '../../customServingRuntimes/utils';
import { SERVING_RUNTIME_SCOPE, ServingRuntimeVersionStatusLabel } from '../const';
import ServingRuntimeVersionLabel from '../ServingRuntimeVersionLabel';
import { useTemplateByName } from '../../customServingRuntimes/useTemplateByName';
import ServingRuntimeVersionStatus from '../ServingRuntimeVersionStatus';
import { getServingRuntimeVersionStatus } from '../../utils';

type Props = {
  servingRuntime?: ServingRuntimeKind;
};

const InferenceServiceServingRuntime: React.FC<Props> = ({ servingRuntime }) => {
  const isProjectScopedAvailable = useIsAreaAvailable(SupportedArea.DS_PROJECT_SCOPED).status;

  const templateName = servingRuntime
    ? getTemplateNameFromServingRuntime(servingRuntime)
    : undefined;

  const [template, templateLoaded, templateError] = useTemplateByName(templateName);

  const versionStatus = React.useMemo(() => {
    if (templateLoaded && !templateError && servingRuntime) {
      const servingRuntimeVersion = getServingRuntimeVersion(servingRuntime);
      const templateVersion = getServingRuntimeVersion(template);
      return getServingRuntimeVersionStatus(servingRuntimeVersion, templateVersion);
    }
    return undefined;
  }, [template, templateLoaded, templateError, servingRuntime]);

  return (
    <>
      {servingRuntime ? (
        <Stack>
          <StackItem>{getDisplayNameFromServingRuntimeTemplate(servingRuntime)}</StackItem>
          <StackItem>
            <LabelGroup>
              {getServingRuntimeVersion(servingRuntime) && (
                <ServingRuntimeVersionLabel
                  version={getServingRuntimeVersion(servingRuntime)}
                  isCompact
                />
              )}
              {versionStatus && (
                <ServingRuntimeVersionStatus
                  isOutdated={versionStatus === ServingRuntimeVersionStatusLabel.OUTDATED}
                  version={getServingRuntimeVersion(servingRuntime) || ''}
                  templateVersion={getServingRuntimeVersion(template) || ''}
                />
              )}
              {isProjectScopedAvailable &&
                servingRuntime.metadata.annotations?.['opendatahub.io/serving-runtime-scope'] ===
                  SERVING_RUNTIME_SCOPE.Project && (
                  <ScopedLabel isProject color="blue" isCompact>
                    Project-scoped
                  </ScopedLabel>
                )}
            </LabelGroup>
          </StackItem>
        </Stack>
      ) : (
        'Unknown'
      )}
    </>
  );
};
export default InferenceServiceServingRuntime;
