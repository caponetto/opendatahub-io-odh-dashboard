import * as React from 'react';
import { FormGroup, Stack, StackItem, ExpandableSection } from '@patternfly/react-core';
import {
  HardwareProfileKind,
  HardwareProfileFeatureVisibility,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  useValidation,
  ValidationContext,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useValidation';
import { ContainerResources } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { ZodErrorHelperText } from '@odh-dashboard/dashboard-foundation-frontend/components/ZodErrorFormHelperText';
import ProjectScopedPopover from '@odh-dashboard/dashboard-foundation-frontend/components/ProjectScopedPopover';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import DashboardHelpTooltip from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardHelpTooltip';
import type { HardwarePodSpecOptions } from '@odh-dashboard/dashboard-foundation-frontend/types';
import HardwareProfileSelect from '#~/concepts/hardwareProfiles/HardwareProfileSelect';
import { HARDWARE_PROFILE_SELECTION_HELP } from '#~/concepts/hardwareProfiles/const';
import { hardwareProfileValidationSchema } from '#~/concepts/hardwareProfiles/validationUtils';
import HardwareProfileCustomize from '#~/concepts/hardwareProfiles/HardwareProfileCustomize';
import { useHardwareProfilesByFeatureVisibility } from '#~/concepts/hardwareProfiles/pages/useHardwareProfilesByFeatureVisibility';
import { PodSpecOptions, HardwarePodSpecOptionsState } from '#~/concepts/hardwareProfiles/types';
import { getContainerResourcesFromHardwareProfile } from '#~/concepts/hardwareProfiles/utils';

type HardwareProfileFormSectionProps<T extends HardwarePodSpecOptions> = {
  isEditing: boolean;
  project?: string;
  visibleIn?: HardwareProfileFeatureVisibility[];
  podSpecOptionsState: HardwarePodSpecOptionsState<T>;
  isHardwareProfileSupported?: (profile: HardwareProfileKind) => boolean;
};

const HardwareProfileFormSection: React.FC<HardwareProfileFormSectionProps<PodSpecOptions>> = ({
  podSpecOptionsState,
  project,
  isEditing,
  visibleIn = [],
  isHardwareProfileSupported = () => false,
}) => {
  const {
    hardwareProfile: { formData, initialHardwareProfile, setFormData },
  } = podSpecOptionsState;
  const isProjectScoped = useIsAreaAvailable(SupportedArea.DS_PROJECT_SCOPED).status;

  const validation = useValidation(formData, hardwareProfileValidationSchema);
  const hasValidationErrors = Object.keys(validation.getAllValidationIssues()).length > 0;
  const {
    globalProfiles: [hardwareProfiles, loaded, error],
    projectProfiles: projectScopedHardwareProfiles,
  } = useHardwareProfilesByFeatureVisibility(visibleIn, project);

  const [isExpanded, setIsExpanded] = React.useState(false);

  React.useEffect(() => {
    if (initialHardwareProfile && hasValidationErrors) {
      setIsExpanded(true);
    }
  }, [initialHardwareProfile, hasValidationErrors]);

  const onProfileSelect = (profile?: HardwareProfileKind) => {
    // if no profile provided, use existing settings
    if (!profile) {
      setFormData('selectedProfile', undefined);
      setFormData('useExistingSettings', true);
      return;
    }

    // Reset customization when changing profiles
    const newResources = getContainerResourcesFromHardwareProfile(profile);

    setFormData('selectedProfile', profile);
    setFormData('useExistingSettings', false);
    setFormData('resources', newResources);
  };

  return (
    <ValidationContext.Provider value={validation}>
      <Stack hasGutter data-testid="hardware-profile-section">
        <StackItem>
          <FormGroup
            label="Hardware profile"
            isRequired
            labelHelp={
              isProjectScoped && project && projectScopedHardwareProfiles[0].length > 0 ? (
                <ProjectScopedPopover
                  title="Hardware profile"
                  item="hardware profiles"
                  description={HARDWARE_PROFILE_SELECTION_HELP}
                />
              ) : (
                <DashboardHelpTooltip content={HARDWARE_PROFILE_SELECTION_HELP} />
              )
            }
          >
            <HardwareProfileSelect
              isProjectScoped={isProjectScoped}
              hardwareProfileConfig={formData}
              previewDescription
              hardwareProfiles={hardwareProfiles}
              hardwareProfilesLoaded={loaded}
              hardwareProfilesError={error}
              projectScopedHardwareProfiles={
                !project ? [[], true, undefined] : projectScopedHardwareProfiles
              }
              isHardwareProfileSupported={isHardwareProfileSupported}
              initialHardwareProfile={initialHardwareProfile}
              onChange={onProfileSelect}
              allowExistingSettings={isEditing && !initialHardwareProfile}
              project={project}
            />
            <ZodErrorHelperText zodIssue={validation.getAllValidationIssues()} showAllErrors />
          </FormGroup>
        </StackItem>
        {formData.selectedProfile?.spec.identifiers &&
          formData.selectedProfile.spec.identifiers.length > 0 &&
          formData.resources && (
            <StackItem>
              <ExpandableSection
                isIndented
                toggleText="Customize resource requests and limits"
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
                data-testid="hardware-profile-customize"
              >
                <HardwareProfileCustomize
                  identifiers={formData.selectedProfile.spec.identifiers}
                  data={formData.resources}
                  setData={(newData: ContainerResources) => setFormData('resources', newData)}
                />
              </ExpandableSection>
            </StackItem>
          )}
      </Stack>
    </ValidationContext.Provider>
  );
};

export default HardwareProfileFormSection;
