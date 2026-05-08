import {
  Breadcrumb,
  BreadcrumbItem,
  Drawer,
  DrawerContent,
  DrawerContentBody,
  PageSection,
} from '@patternfly/react-core';
import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import GenericSidebar from '@odh-dashboard/dashboard-foundation-frontend/components/GenericSidebar';
import {
  useValidation,
  ValidationContext,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/useValidation';
import useGenericObjectState from '@odh-dashboard/dashboard-foundation-frontend/utilities/useGenericObjectState';
import {
  registeredModelRoute,
  modelVersionRoute,
  modelRegistryRoute,
} from '@odh-dashboard/model-serving-shared/routes/modelRegistry';
import { InferenceServiceStorageType } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useDefaultStorageClass } from '@odh-dashboard/storage-classes-shared/concepts/storageClasses/useDefaultStorageClass';
import {
  globalPipelineRecurringRunDetailsRoute,
  globalPipelineRunDetailsRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import {
  modelCustomizationRootPath,
  ModelCustomizationRouterState,
} from '@odh-dashboard/pipelines/routes/modelCustomization';
import EnsureAPIAvailability from '@odh-dashboard/pipelines/concepts/EnsureAPIAvailability';
import {
  ModelCustomizationFormData,
  modelCustomizationFormSchema,
  pipelineParameterSchema,
} from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/validationUtils';
import { useIlabPipeline } from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/useIlabPipeline';
import {
  ModelCustomizationEndpointType,
  FineTuneTaxonomyType,
} from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/types';
import { createHyperParametersSchema } from '@odh-dashboard/pipelines/concepts/content/modelCustomizationForm/modelCustomizationFormSchema/hyperparameterValidationUtils';
import { getInputDefinitionParams } from '@odh-dashboard/pipelines/concepts/content/createRun/utils';
import { RunTypeOption } from '@odh-dashboard/pipelines/concepts/content/createRun/types';
import ModelCustomizationDrawerContent, {
  ModelCustomizationDrawerContentArgs,
  ModelCustomizationDrawerContentRef,
} from '@odh-dashboard/pipelines/pages/pipelines/global/modelCustomization/landingPage/ModelCustomizationDrawerContent';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import FineTunePage from './FineTunePage';
import {
  FineTunePageSections,
  fineTunePageSectionTitles,
  SCROLLABLE_SELECTOR_ID,
  KnownFineTuningPipelineParameters,
} from './const';
import { filterHyperparameters, getParamsValueFromPipelineInput } from './utils';

const ModelCustomizationForm: React.FC = () => {
  const {
    ilabPipeline,
    ilabPipelineVersion,
    loaded: ilabPipelineLoaded,
    loadError: ilabPipelineLoadError,
  } = useIlabPipeline();

  const { state }: { state?: ModelCustomizationRouterState } = useLocation();
  const { namespace } = usePipelinesAPI();

  const [data, setData] = useGenericObjectState<ModelCustomizationFormData>({
    outputModel: {
      addToRegistryEnabled: false,
      outputModelRegistryName: state?.modelRegistryName,
      outputModelName: state?.registeredModelName,
      outputModelRegistryApiUrl: state?.outputModelRegistryApiUrl,
      connectionData: {
        type: InferenceServiceStorageType.EXISTING_STORAGE,
      },
    },
    baseModel: {
      sdgBaseModel: state?.inputModelLocationUri ?? '',
    },
    taxonomy: {
      url: '',

      secret: {
        type: FineTuneTaxonomyType.SSH_KEY,
        sshKey: '',
      },
    },
    teacher: {
      endpointType: ModelCustomizationEndpointType.PUBLIC,
      apiToken: '',
      endpoint: '',
      modelName: '',
    },
    judge: {
      endpointType: ModelCustomizationEndpointType.PUBLIC,
      apiToken: '',
      endpoint: '',
      modelName: '',
    },
    trainingNode: 1,
    storageClass: '',
    hardware: {
      podSpecOptions: {
        cpuCount: 0,
        memoryCount: '0',
        gpuCount: 0,
        gpuIdentifier: '',
        tolerations: [],
        nodeSelector: {},
      },
    },
    hyperparameters: {},
  });

  const { hyperparameters } = filterHyperparameters(ilabPipelineVersion);

  // set default values for pipeline inputs
  React.useEffect(() => {
    if (ilabPipelineVersion) {
      // set default hyperparameters
      const { hyperparameterFormData } = filterHyperparameters(ilabPipelineVersion);
      setData('hyperparameters', {
        ...hyperparameterFormData,
      });

      // set default training node
      const trainingNodeDefaultValue = getParamsValueFromPipelineInput(
        ilabPipelineVersion,
        KnownFineTuningPipelineParameters.TRAIN_NUM_WORKERS,
      )?.defaultValue;
      if (trainingNodeDefaultValue) {
        setData('trainingNode', Number(trainingNodeDefaultValue));
      }
    }
  }, [ilabPipelineVersion, setData]);

  const formValidation = useValidation(
    data,
    modelCustomizationFormSchema.extend({
      hyperparameters: createHyperParametersSchema(hyperparameters),
    }),
  );

  const [defaultStorageClass, defaultStorageClassLoaded, defaultStorageClassError] =
    useDefaultStorageClass();

  // set default storage class
  React.useEffect(() => {
    //  not ready if ilabPipelineVersion is not loaded or defaultStorageClass is not loaded or had an error
    if (!ilabPipelineVersion || !(defaultStorageClassLoaded || defaultStorageClassError)) {
      return;
    }

    // if defaultStorageClass is not null, use it
    if (defaultStorageClass) {
      setData('storageClass', defaultStorageClass.metadata.name);
    }
    // if defaultStorageClass is null, use the default value from the pipeline input
    else {
      const storageClassDefaultValue = getParamsValueFromPipelineInput(
        ilabPipelineVersion,
        KnownFineTuningPipelineParameters.K8S_STORAGE_CLASS_NAME,
      )?.defaultValue;
      if (storageClassDefaultValue) {
        setData('storageClass', String(storageClassDefaultValue));
      }
    }
  }, [
    defaultStorageClass,
    defaultStorageClassError,
    defaultStorageClassLoaded,
    ilabPipelineVersion,
    setData,
  ]);

  const navigate = useNavigate();

  const hasInvalidParameters = React.useMemo(() => {
    const parameters = getInputDefinitionParams(ilabPipelineVersion);
    const result = pipelineParameterSchema.safeParse(parameters ?? {});
    return !result.success;
  }, [ilabPipelineVersion]);

  const filteredFineTunePageSections = React.useMemo(
    () =>
      hasInvalidParameters
        ? Object.values(FineTunePageSections).filter(
            (section) =>
              section === FineTunePageSections.PROJECT_DETAILS ||
              section === FineTunePageSections.PIPELINE_DETAILS,
          )
        : FineTunePageSections,
    [hasInvalidParameters],
  );

  const drawerContentRef = React.useRef<ModelCustomizationDrawerContentRef>(null);
  const [isDrawerExpanded, setIsDrawerExpanded] = React.useState(false);

  const handleCloseDrawer = () => {
    setIsDrawerExpanded(false);
  };

  const handleOpenDrawer = (contentArgs: ModelCustomizationDrawerContentArgs) => {
    drawerContentRef.current?.update(contentArgs);
    setIsDrawerExpanded(true);
  };

  return (
    <ValidationContext.Provider value={formValidation}>
      <Drawer isExpanded={isDrawerExpanded} data-testid="drawer-model-customization" isInline>
        <DrawerContent
          panelContent={
            <ModelCustomizationDrawerContent
              ref={drawerContentRef}
              handleCloseDrawer={handleCloseDrawer}
            />
          }
          id={SCROLLABLE_SELECTOR_ID}
        >
          <DrawerContentBody>
            <ApplicationsPage
              title="Start a LAB-tuning run"
              description={
                <>
                  InstructLab fine-tuning is a method which uses synthetic data generation (SDG)
                  techniques and a structured taxonomy to create diverse, high-quality training
                  datasets.{' '}
                  <Link to={modelCustomizationRootPath}>Learn more about the LAB method</Link>
                </>
              }
              breadcrumb={
                <Breadcrumb>
                  {state?.modelRegistryName && (
                    <BreadcrumbItem to={modelRegistryRoute(state.modelRegistryName)}>
                      {state.modelRegistryDisplayName}
                    </BreadcrumbItem>
                  )}
                  {state?.registeredModelId && state.modelRegistryName && (
                    <BreadcrumbItem
                      to={registeredModelRoute(state.registeredModelId, state.modelRegistryName)}
                    >
                      {state.registeredModelName}
                    </BreadcrumbItem>
                  )}
                  {state?.modelVersionId && state.registeredModelId && state.modelRegistryName && (
                    <BreadcrumbItem
                      to={modelVersionRoute(
                        state.modelVersionId,
                        state.registeredModelId,
                        state.modelRegistryName,
                      )}
                    >
                      {state.modelVersionName}
                    </BreadcrumbItem>
                  )}
                  <BreadcrumbItem>Start an InstructLab run</BreadcrumbItem>
                </Breadcrumb>
              }
              loaded={ilabPipelineLoaded}
              errorMessage={ilabPipelineLoadError?.message}
              loadError={ilabPipelineLoadError}
              empty={false}
            >
              <EnsureAPIAvailability>
                <PageSection hasBodyWrapper={false} isFilled>
                  <GenericSidebar
                    sections={Object.values(filteredFineTunePageSections)}
                    titles={fineTunePageSectionTitles}
                    maxWidth={200}
                    scrollableSelector={`#${SCROLLABLE_SELECTOR_ID}`}
                    onJumpLinksItemClick={(section) =>
                      // Passing the location state when clicking on jump links
                      // So that we can keep it when URL changes
                      navigate(`#${section}`, { state, replace: true })
                    }
                  >
                    <FineTunePage
                      canSubmit={!ilabPipelineLoadError}
                      onSuccess={(id, runType) => {
                        if (
                          state?.registeredModelId &&
                          state.modelVersionId &&
                          state.modelRegistryName
                        ) {
                          navigate(
                            modelVersionRoute(
                              state.modelVersionId,
                              state.registeredModelId,
                              state.modelRegistryName,
                            ),
                          );
                        } else if (runType === RunTypeOption.ONE_TRIGGER) {
                          navigate(globalPipelineRunDetailsRoute(namespace, id));
                        } else {
                          navigate(globalPipelineRecurringRunDetailsRoute(namespace, id));
                        }
                      }}
                      data={data}
                      setData={setData}
                      ilabPipeline={ilabPipeline}
                      ilabPipelineVersion={ilabPipelineVersion}
                      ilabPipelineLoaded={ilabPipelineLoaded}
                      handleOpenDrawer={handleOpenDrawer}
                    />
                  </GenericSidebar>
                </PageSection>
              </EnsureAPIAvailability>
            </ApplicationsPage>
          </DrawerContentBody>
        </DrawerContent>
      </Drawer>
    </ValidationContext.Provider>
  );
};

export default ModelCustomizationForm;
