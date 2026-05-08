import * as React from 'react';
import type {
  HardwareProfileKind,
  SupportedModelFormats,
  TemplateKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { isCompatibleWithIdentifier } from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageStreamUtils';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors/project';
import { useProfileIdentifiers } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/utils';
import type {
  ModelServerOption,
  ModelServerSelectField,
  ModelServerSelectFieldData,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/ModelServerTemplateSelectField';
import { getAcceleratorIdentifierFromHardwareProfile } from '@odh-dashboard/model-serving-shared/concepts/modelServing/ModelServerTemplateSelectField';
import type { ModelTypeFieldData } from './ModelTypeSelectField';
import {
  getModelTypesFromTemplate,
  getServingRuntimeDisplayNameFromTemplate,
  getServingRuntimeFromTemplate,
  getServingRuntimeVersion,
} from '../../../pages/customServingRuntimes/utils';
import { useModelServingClusterSettings } from '../../../concepts/useModelServingClusterSettings';
import { useWizardFieldFromExtension } from '../dynamicFormUtils';
import { isModelServerTemplateField } from '../types';

// Hook — stays in model-serving because it depends on model-serving internals
export const useModelServerSelectField = (
  existingData?: { data: ModelServerSelectFieldData },
  modelServerTemplates?: TemplateKind[],
  modelFormat?: SupportedModelFormats,
  modelType?: ModelTypeFieldData,
  hardwareProfile?: HardwareProfileKind,
): ModelServerSelectField => {
  const { data: modelServingClusterSettings } = useModelServingClusterSettings();

  const modelServerSelectExtension = useWizardFieldFromExtension(isModelServerTemplateField, {
    modelType: { data: modelType },
  });
  const { dashboardNamespace } = useDashboardNamespace();

  const [modelServerState, setModelServerState] = React.useState<
    Omit<ModelServerSelectFieldData, 'suggestion'> | undefined
  >(existingData?.data);

  const profileIdentifiers = useProfileIdentifiers(hardwareProfile);

  const previousModelType = React.useRef(modelType);
  React.useEffect(() => {
    if (previousModelType.current !== modelType) {
      setModelServerState(existingData?.data);
      previousModelType.current = modelType;
    }
  }, [modelType, existingData, setModelServerState]);

  const suggestion = React.useMemo(() => {
    const extensionSuggestion = modelServerSelectExtension?.suggestion?.(
      modelServingClusterSettings,
    );
    if (extensionSuggestion) {
      return extensionSuggestion;
    }

    let filteredTemplates = modelServerTemplates;
    if (modelType) {
      filteredTemplates = filteredTemplates?.filter((template) =>
        getModelTypesFromTemplate(template).includes(modelType.type),
      );
    }
    if (modelFormat) {
      filteredTemplates = filteredTemplates?.filter((template) =>
        getServingRuntimeFromTemplate(template)?.spec.supportedModelFormats?.some(
          (format) => format.name === modelFormat.name && format.version === modelFormat.version,
        ),
      );
    }
    const accelerator = getAcceleratorIdentifierFromHardwareProfile(hardwareProfile);
    if (accelerator) {
      filteredTemplates = filteredTemplates?.filter((template) =>
        isCompatibleWithIdentifier(accelerator, getServingRuntimeFromTemplate(template)),
      );
    }

    if (filteredTemplates?.length === 1) {
      const suggestedTemplate = filteredTemplates[0];
      return {
        name: suggestedTemplate.metadata.name,
        namespace: suggestedTemplate.metadata.namespace,
        label: getServingRuntimeDisplayNameFromTemplate(suggestedTemplate),
        scope: suggestedTemplate.metadata.namespace === dashboardNamespace ? 'global' : 'project',
        template: suggestedTemplate,
      };
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    modelServerTemplates,
    modelFormat,
    hardwareProfile?.spec.identifiers,
    modelType,
    modelServerSelectExtension,
    modelServingClusterSettings,
    dashboardNamespace,
  ]);

  const options = React.useMemo(() => {
    const result: ModelServerOption[] = [];

    result.push(...(modelServerSelectExtension?.extraOptions || []));

    result.push(
      ...(modelServerTemplates?.map(
        (template) =>
          ({
            name: template.metadata.name,
            namespace: template.metadata.namespace,
            label: getServingRuntimeDisplayNameFromTemplate(template),
            version: getServingRuntimeVersion(template),
            compatibleWithHardwareProfile: profileIdentifiers.some((identifier) =>
              isCompatibleWithIdentifier(identifier, getServingRuntimeFromTemplate(template)),
            ),
            scope: template.metadata.namespace === dashboardNamespace ? 'global' : 'project',
            template,
          } satisfies ModelServerOption),
      ) || []),
    );

    return result;
  }, [
    modelServerSelectExtension?.extraOptions,
    modelServerTemplates,
    dashboardNamespace,
    profileIdentifiers,
  ]);

  const isDirty =
    existingData || modelServerState?.selection || modelServerState?.autoSelect !== undefined;
  const autoSelect = (suggestion && !isDirty) || (modelServerState?.autoSelect && !!suggestion);
  return {
    data: {
      selection: autoSelect ? suggestion : modelServerState?.selection,
      autoSelect,
      suggestion,
    },
    setData: setModelServerState,
    options,
  };
};
