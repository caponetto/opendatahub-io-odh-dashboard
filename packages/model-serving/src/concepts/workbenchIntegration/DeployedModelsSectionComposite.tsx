import * as React from 'react';
import {
  Alert,
  Bullseye,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Content,
  ContentVariants,
  EmptyState,
  EmptyStateBody,
  EmptyStateFooter,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  Spinner,
  Stack,
  ToggleGroup,
  ToggleGroupItem,
} from '@patternfly/react-core';
import { ExclamationCircleIcon, SearchIcon } from '@patternfly/react-icons';
import { Link } from 'react-router-dom';
import {
  ProjectObjectType,
  SectionType,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import {
  getProjectModelServingPlatform,
  isProjectNIMSupported,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/utils';
import useServingPlatformStatuses from '@odh-dashboard/model-serving-shared/concepts/modelServing/useServingPlatformStatuses';
import CollapsibleSection from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/CollapsibleSection';
import OverviewCard from '@odh-dashboard/dashboard-foundation-frontend/components/OverviewCard';
import HeaderIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/HeaderIcon';
import TypeBorderedCard from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TypeBorderedCard';
import ResourceNameTooltip from '@odh-dashboard/dashboard-foundation-frontend/components/ResourceNameTooltip';
import InferenceServiceServingRuntime from '@odh-dashboard/model-serving-shared/concepts/modelServing/InferenceServiceServingRuntime';
import useModelMetricsEnabled from '@odh-dashboard/model-serving-shared/concepts/modelServing/useModelMetricsEnabled';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import {
  useIsAreaAvailable,
  SupportedArea,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import {
  InferenceServiceKind,
  ServingRuntimeKind,
} from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { getPodsForKserve } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/pods';
import {
  checkModelPodStatus,
  getInferenceServiceModelState,
} from '@odh-dashboard/model-serving-shared/concepts/modelServing/kserveStatusUtils';
import { ModelDeploymentState } from '@odh-dashboard/model-serving-shared/concepts/modelServing/deploymentState';
import type { ModelStatus } from '@odh-dashboard/model-serving-shared/concepts/modelServing/types';
import { NamespaceApplicationCase } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';
import ModelServingPlatformSelectButton from '@odh-dashboard/model-serving-shared/concepts/modelServing/ModelServingPlatformSelectButton';
import ModelServingPlatformSelectErrorAlert from '@odh-dashboard/model-serving-shared/concepts/modelServing/ModelServingPlatformSelectErrorAlert';
import { ServingRuntimePlatform } from '@odh-dashboard/dashboard-foundation-frontend/types';
import ModelServingContextProvider from '@odh-dashboard/model-serving/pages/ModelServingContext';
import InferenceServiceStatus from '@odh-dashboard/model-serving/pages/screens/global/InferenceServiceStatus';
import InferenceServiceEndpoint from '@odh-dashboard/model-serving/pages/screens/global/InferenceServiceEndpoint';
import { useInferenceServiceStatus } from '@odh-dashboard/model-serving/pages/useInferenceServiceStatus';
import ModelServingPlatformButtonAction from '@odh-dashboard/model-serving/pages/screens/projects/ModelServingPlatformButtonAction';
import ManageKServeModal from '@odh-dashboard/model-serving/pages/screens/projects/kServeModal/ManageKServeModal';
import ManageNIMServingModal from '@odh-dashboard/model-serving/pages/screens/projects/nim/NIMServiceModal/ManageNIMServingModal';
import {
  getSortedTemplates,
  getTemplateEnabled,
  getTemplateEnabledForPlatform,
} from '@odh-dashboard/model-serving/pages/customServingRuntimes/utils';

const SUCCESS_STATUSES = new Set([ModelDeploymentState.LOADED, ModelDeploymentState.STANDBY]);
const FAILED_STATUSES = new Set([ModelDeploymentState.FAILED_TO_LOAD]);
type InferenceServiceStates = { [key: string]: ModelDeploymentState };

const DeployedModelCard: React.FC<{
  inferenceService: InferenceServiceKind;
  servingRuntime?: ServingRuntimeKind;
}> = ({ inferenceService, servingRuntime }) => {
  const [modelMetricsEnabled] = useModelMetricsEnabled();
  const kserveMetricsEnabled = useIsAreaAvailable(SupportedArea.K_SERVE_METRICS).status;
  const kserveMetricsSupported = modelMetricsEnabled && kserveMetricsEnabled;
  const displayName = getDisplayNameFromK8sResource(inferenceService);
  const { isStarting, isStopping, isStopped, isRunning, isFailed } =
    useInferenceServiceStatus(inferenceService);

  return (
    <GalleryItem key={inferenceService.metadata.uid}>
      <TypeBorderedCard isFullHeight objectType={ProjectObjectType.modelServer}>
        <CardHeader>
          <Flex gap={{ default: 'gapSm' }} direction={{ default: 'column' }}>
            <FlexItem>
              <InferenceServiceStatus
                inferenceService={inferenceService}
                stoppedStates={{ isStarting, isStopping, isStopped, isRunning }}
              />
            </FlexItem>
            <FlexItem>
              <ResourceNameTooltip resource={inferenceService}>
                {!isStarting && !isFailed && kserveMetricsSupported ? (
                  <Link
                    data-testid={`metrics-link-${displayName}`}
                    to={`/projects/${inferenceService.metadata.namespace}/metrics/model/${inferenceService.metadata.name}`}
                  >
                    {displayName}
                  </Link>
                ) : (
                  displayName
                )}
              </ResourceNameTooltip>
            </FlexItem>
          </Flex>
        </CardHeader>
        <CardBody>
          <Content>
            <Content component={ContentVariants.dl} style={{ display: 'block' }}>
              <Content
                component={ContentVariants.dt}
                style={{ marginBottom: 'var(--pf-t--global--spacer--xs)' }}
              >
                Deployment resource
              </Content>
              <Content
                component={ContentVariants.dd}
                style={{
                  fontSize: 'var(--pf-t--global--font--size--body--sm)',
                  color: servingRuntime ? undefined : 'var(--pf-t--global--text--color--subtle)',
                }}
              >
                <InferenceServiceServingRuntime servingRuntime={servingRuntime} />
              </Content>
            </Content>
          </Content>
        </CardBody>
        <CardFooter>
          <InferenceServiceEndpoint
            inferenceService={inferenceService}
            servingRuntime={servingRuntime}
            isKserve
            modelState={{ isStarting, isStopping, isStopped, isRunning, isFailed }}
          />
        </CardFooter>
      </TypeBorderedCard>
    </GalleryItem>
  );
};

const DeployedModelsGallery: React.FC<{
  deployedModels: InferenceServiceKind[];
  servingRuntimes: ServingRuntimeKind[];
  showFailed: boolean;
  showSuccessful: boolean;
  onClearFilters: () => void;
}> = ({ deployedModels, servingRuntimes, showSuccessful, showFailed, onClearFilters }) => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const namespace = currentProject.metadata.name;
  const [inferenceServiceStates, setInferenceServiceStates] =
    React.useState<InferenceServiceStates>({});

  React.useEffect(() => {
    let canceled = false;

    const updateServiceState = (inferenceService: InferenceServiceKind, status?: ModelStatus) => {
      const state = status?.failedToSchedule
        ? ModelDeploymentState.FAILED_TO_LOAD
        : getInferenceServiceModelState(inferenceService);
      setInferenceServiceStates((prev) => ({
        ...prev,
        [inferenceService.metadata.name]: state,
      }));
    };

    const getServicesForStatus = async () => {
      for (const deployedModel of deployedModels) {
        try {
          const modelPods = await getPodsForKserve(
            namespace,
            deployedModel.spec.predictor.model?.runtime ?? '',
          );
          if (!canceled) {
            updateServiceState(deployedModel, checkModelPodStatus(modelPods[0]));
          }
        } catch {
          updateServiceState(deployedModel);
        }
      }
    };

    getServicesForStatus();
    return () => {
      canceled = true;
    };
  }, [deployedModels, namespace]);

  const filteredServices = React.useMemo(
    () =>
      deployedModels.filter((deployedModel) => {
        const state = inferenceServiceStates[deployedModel.metadata.name];
        return (
          showFailed === showSuccessful ||
          (showSuccessful && SUCCESS_STATUSES.has(state)) ||
          (showFailed && FAILED_STATUSES.has(state))
        );
      }),
    [inferenceServiceStates, deployedModels, showFailed, showSuccessful],
  );

  const shownServices = filteredServices.slice(0, 5);
  const modelServerHref = `/projects/${currentProject.metadata.name}?section=${ProjectSectionID.MODEL_SERVER}`;

  if (filteredServices.length === 0 && deployedModels.length > 0) {
    return (
      <EmptyState icon={SearchIcon} titleText="No results found" variant="sm">
        <EmptyStateBody>Clear the filter or apply a different one.</EmptyStateBody>
        <EmptyStateFooter>
          <Button isInline variant="link" onClick={onClearFilters}>
            Clear filter
          </Button>
        </EmptyStateFooter>
      </EmptyState>
    );
  }

  return (
    <>
      <Gallery
        hasGutter
        minWidths={{ default: '285px' }}
        style={{ marginBottom: 'var(--pf-t--global--spacer--sm)' }}
      >
        {shownServices.map((model) => (
          <DeployedModelCard
            key={model.metadata.uid}
            inferenceService={model}
            servingRuntime={servingRuntimes.find(
              (sr) => sr.metadata.name === model.spec.predictor.model?.runtime,
            )}
          />
        ))}
      </Gallery>
      <Flex gap={{ default: 'gapMd' }}>
        <FlexItem>
          <Content>
            <Content component="small">
              {shownServices.length} of {filteredServices.length} models
            </Content>
          </Content>
        </FlexItem>
        <FlexItem>
          <Button
            variant="link"
            component={(props: React.ComponentProps<'a'>) => (
              <Link {...props} to={modelServerHref} />
            )}
          >
            View all
          </Button>
        </FlexItem>
      </Flex>
    </>
  );
};

enum FilterStates {
  success = 'success',
  failed = 'failed',
}

const DeployedModelsCard: React.FC<{
  deployedModels: InferenceServiceKind[];
  servingRuntimes: ServingRuntimeKind[];
}> = ({ deployedModels, servingRuntimes }) => {
  const [filteredState, setFilteredState] = React.useState<FilterStates | undefined>();
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const isKServeNIMEnabled = isProjectNIMSupported(currentProject);

  return (
    <TypeBorderedCard objectType={ProjectObjectType.deployedModels}>
      <CardHeader>
        <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
          <HeaderIcon type={ProjectObjectType.deployedModels} />
          <FlexItem>
            <Content>
              <Content component="h3">
                <b>Deployed models</b>
              </Content>
            </Content>
          </FlexItem>
          <FlexItem>
            <ToggleGroup
              style={{ marginLeft: 'var(--pf-t--global--spacer--md)' }}
              aria-label="Default with single selectable"
            >
              <ToggleGroupItem
                text="Successful"
                buttonId="successful-filter"
                isSelected={filteredState === FilterStates.success}
                onChange={(_e, selected) =>
                  setFilteredState(selected ? FilterStates.success : undefined)
                }
              />
              <ToggleGroupItem
                text="Failed"
                buttonId="failed-filter"
                isSelected={filteredState === FilterStates.failed}
                onChange={(_e, selected) =>
                  setFilteredState(selected ? FilterStates.failed : undefined)
                }
              />
            </ToggleGroup>
          </FlexItem>
          <FlexItem flex={{ default: 'flex_1' }}>
            <Label style={{ float: 'right' }}>
              {isKServeNIMEnabled ? 'NVIDIA NIM serving enabled' : 'Single-model serving enabled'}
            </Label>
          </FlexItem>
        </Flex>
      </CardHeader>
      <CardBody>
        <DeployedModelsGallery
          deployedModels={deployedModels}
          servingRuntimes={servingRuntimes}
          showSuccessful={!filteredState || filteredState === FilterStates.success}
          showFailed={!filteredState || filteredState === FilterStates.failed}
          onClearFilters={() => setFilteredState(undefined)}
        />
      </CardBody>
    </TypeBorderedCard>
  );
};

const AddModelFooter: React.FC<{ isNIM?: boolean }> = ({ isNIM }) => {
  const [modalShown, setModalShown] = React.useState(false);
  const {
    servingRuntimes: { refresh: refreshServingRuntime },
    servingRuntimeTemplates: [templates],
    servingRuntimeTemplateOrder: { data: templateOrder },
    servingRuntimeTemplateDisablement: { data: templateDisablement },
    connections: { data: connections },
    serverSecrets: { refresh: refreshTokens },
    inferenceServices: { refresh: refreshInferenceServices },
    currentProject,
  } = React.useContext(ProjectDetailsContext);
  const safeTemplates = React.useMemo(() => templates ?? [], [templates]);

  const templatesSorted = getSortedTemplates(safeTemplates, templateOrder);
  const templatesEnabled = templatesSorted.filter((template) =>
    getTemplateEnabled(template, templateDisablement),
  );
  const emptyTemplates = templatesEnabled.length === 0;

  const onSubmit = (submit: boolean) => {
    setModalShown(false);
    if (submit) {
      refreshServingRuntime();
      refreshInferenceServices();
      setTimeout(refreshTokens, 500);
    }
  };

  return (
    <CardFooter>
      <ModelServingPlatformButtonAction
        emptyTemplates={emptyTemplates}
        onClick={() => setModalShown(true)}
        variant="link"
        isInline
        testId="model-serving-platform-button"
      />
      {modalShown && !isNIM ? (
        <ManageKServeModal
          projectContext={{ currentProject, connections }}
          servingRuntimeTemplates={templatesEnabled.filter((template) =>
            getTemplateEnabledForPlatform(template, ServingRuntimePlatform.SINGLE),
          )}
          onClose={onSubmit}
        />
      ) : null}
      {modalShown && isNIM ? (
        <ManageNIMServingModal projectContext={{ currentProject }} onClose={onSubmit} />
      ) : null}
    </CardFooter>
  );
};

const DeployedModelsSectionComposite: React.FC = () => {
  const { currentProject } = React.useContext(ProjectDetailsContext);
  const {
    inferenceServices: {
      data: { items: inferenceServices },
      loaded: inferenceServicesLoaded,
    },
    servingRuntimes: {
      data: { items: modelServers },
      loaded: modelServersLoaded,
    },
  } = React.useContext(ProjectDetailsContext);

  const servingPlatformStatuses = useServingPlatformStatuses();
  const { error: platformError } = getProjectModelServingPlatform(
    currentProject,
    servingPlatformStatuses,
  );
  const [deployedModels, setDeployedModels] = React.useState<InferenceServiceKind[]>([]);
  const isKServeNIMEnabled = isProjectNIMSupported(currentProject);
  const [errorSelectingPlatform, setErrorSelectingPlatform] = React.useState<Error>();

  React.useEffect(() => {
    if (!inferenceServicesLoaded || !modelServersLoaded) {
      return;
    }
    setDeployedModels(inferenceServices);
  }, [inferenceServices, inferenceServicesLoaded, modelServersLoaded]);

  const renderError = (message?: string): React.ReactElement => (
    <Bullseye>
      <EmptyState
        headingLevel="h2"
        icon={ExclamationCircleIcon}
        titleText="Problem loading deployments"
      >
        <EmptyStateBody>{message}</EmptyStateBody>
      </EmptyState>
    </Bullseye>
  );

  const renderContent = () => {
    if (!inferenceServicesLoaded && !modelServersLoaded) {
      return (
        <Card>
          <CardBody>
            <Bullseye>
              <Spinner />
            </Bullseye>
          </CardBody>
        </Card>
      );
    }

    if (deployedModels.length === 0) {
      return (
        <OverviewCard
          objectType={ProjectObjectType.deployedModels}
          sectionType={SectionType.serving}
          title="Deployments"
          headerInfo={
            <Flex gap={{ default: 'gapSm' }}>
              <Label>
                {isKServeNIMEnabled ? 'NVIDIA NIM serving enabled' : 'Single-model serving enabled'}
              </Label>
              {servingPlatformStatuses.platformEnabledCount > 1 && (
                <ModelServingPlatformSelectButton
                  namespace={currentProject.metadata.name}
                  servingPlatform={NamespaceApplicationCase.RESET_MODEL_SERVING_PLATFORM}
                  setError={setErrorSelectingPlatform}
                  variant="link"
                  isInline
                  data-testid="change-serving-platform-button"
                />
              )}
            </Flex>
          }
        >
          <CardBody>
            <Stack hasGutter>
              {errorSelectingPlatform && (
                <ModelServingPlatformSelectErrorAlert
                  error={errorSelectingPlatform}
                  clearError={() => setErrorSelectingPlatform(undefined)}
                />
              )}
              {platformError ? (
                <Alert isInline title="Loading error" variant="danger">
                  {platformError.message}
                </Alert>
              ) : (
                <Content component="small">Each model is deployed on its own model server.</Content>
              )}
            </Stack>
          </CardBody>
          {platformError ? null : <AddModelFooter isNIM={isKServeNIMEnabled} />}
        </OverviewCard>
      );
    }
    return <DeployedModelsCard deployedModels={deployedModels} servingRuntimes={modelServers} />;
  };

  return (
    <CollapsibleSection title="Serve models" data-testid="model-server-section">
      <ModelServingContextProvider
        namespace={currentProject.metadata.name}
        getErrorComponent={renderError}
      >
        {renderContent()}
      </ModelServingContextProvider>
    </CollapsibleSection>
  );
};

export default DeployedModelsSectionComposite;
