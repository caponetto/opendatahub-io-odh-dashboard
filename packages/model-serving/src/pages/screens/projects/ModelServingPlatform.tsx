import * as React from 'react';
import { OutlinedQuestionCircleIcon } from '@patternfly/react-icons';
import {
  Alert,
  Content,
  Flex,
  FlexItem,
  Gallery,
  GalleryItem,
  Label,
  Popover,
  Stack,
  StackItem,
} from '@patternfly/react-core';
import { ProjectSectionID } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionId';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { ProjectSectionTitles } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/projectSectionTitles';
import { ServingRuntimePlatform } from '@odh-dashboard/dashboard-foundation-frontend/types';
import DashboardPopupIconButton from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardPopupIconButton';
import DetailsSection from '@odh-dashboard/dashboard-foundation-frontend/components/DetailsSection';
import EmptyDetailsView from '@odh-dashboard/dashboard-foundation-frontend/components/EmptyDetailsView';
import {
  ProjectObjectType,
  typedEmptyImage,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import { NamespaceApplicationCase } from '@odh-dashboard/dashboard-foundation-frontend/concepts/projects/types';
import { getProjectModelServingPlatform, isCurrentServingPlatformEnabled } from './utils';
import KServeInferenceServiceTable from './KServeSection/KServeInferenceServiceTable';
import EmptySingleModelServingCard from './EmptySingleModelServingCard';
import EmptyModelServingPlatform from './EmptyModelServingPlatform';
import EmptyNIMModelServingCard from './nim/EmptyNIMModelServingCard';
import { isProjectNIMSupported } from './nim/nimUtils';
import ManageNIMServingModal from './nim/NIMServiceModal/ManageNIMServingModal';
import ModelServingPlatformSelectButton from './ModelServingPlatformSelectButton';
import ModelServingPlatformButtonAction from './ModelServingPlatformButtonAction';
import ManageKServeModal from './kServeModal/ManageKServeModal';
import ModelServingPlatformSelectErrorAlert from '../../../concepts/Platforms/ModelServingPlatformSelectErrorAlert';
import useServingPlatformStatuses from '../../useServingPlatformStatuses';
import {
  getSortedTemplates,
  getTemplateEnabled,
  getTemplateEnabledForPlatform,
} from '../../customServingRuntimes/utils';

const ModelServingPlatform: React.FC = () => {
  const [platformSelected, setPlatformSelected] = React.useState<
    ServingRuntimePlatform | undefined
  >(undefined);

  const [errorSelectingPlatform, setErrorSelectingPlatform] = React.useState<Error>();

  const servingPlatformStatuses = useServingPlatformStatuses();
  const kServeEnabled = servingPlatformStatuses.kServe.enabled;
  const isNIMAvailable = servingPlatformStatuses.kServeNIM.enabled;

  const {
    servingRuntimes: {
      loaded: servingRuntimesLoaded,
      error: servingRuntimeError,
      refresh: refreshServingRuntime,
    },
    servingRuntimeTemplates: [templates, templatesLoaded, templateError],
    servingRuntimeTemplateOrder: { data: templateOrder },
    servingRuntimeTemplateDisablement: { data: templateDisablement },
    connections: { data: connections },
    serverSecrets: { refresh: refreshTokens },
    inferenceServices: {
      data: { items: inferenceServices },
      refresh: refreshInferenceServices,
    },
    currentProject,
  } = React.useContext(ProjectDetailsContext);
  const safeTemplates = React.useMemo(() => templates ?? [], [templates]);

  const isKServeNIMEnabled = isProjectNIMSupported(currentProject);

  const templatesSorted = getSortedTemplates(safeTemplates, templateOrder);
  const templatesEnabled = templatesSorted.filter((template) =>
    getTemplateEnabled(template, templateDisablement),
  );

  const emptyTemplates = templatesEnabled.length === 0;

  const { platform: currentProjectServingPlatform, error: platformError } =
    getProjectModelServingPlatform(currentProject, servingPlatformStatuses);

  const shouldShowPlatformSelection =
    servingPlatformStatuses.platformEnabledCount !== 1 && !currentProjectServingPlatform;

  const emptyModelServer = inferenceServices.length === 0;

  const isCurrentPlatformEnabled = isCurrentServingPlatformEnabled(
    currentProjectServingPlatform,
    servingPlatformStatuses,
  );

  const onSubmit = (submit: boolean) => {
    setPlatformSelected(undefined);
    if (submit) {
      refreshServingRuntime();
      refreshInferenceServices();
      setTimeout(refreshTokens, 500); // need a timeout to wait for tokens creation
    }
  };

  const renderPlatformEmptyState = () => {
    if (kServeEnabled) {
      return (
        <EmptyDetailsView
          allowCreate
          iconImage={typedEmptyImage(ProjectObjectType.modelServer)}
          imageAlt="No deployed models"
          title="Start by deploying a model"
          description={
            <Stack hasGutter>
              {errorSelectingPlatform && (
                <ModelServingPlatformSelectErrorAlert
                  error={errorSelectingPlatform}
                  clearError={() => setErrorSelectingPlatform(undefined)}
                />
              )}
              <StackItem>Each model is deployed on its own model server.</StackItem>
            </Stack>
          }
          createButton={
            <ModelServingPlatformButtonAction
              testId="deploy-button"
              emptyTemplates={emptyTemplates}
              variant="primary"
              onClick={() => {
                setPlatformSelected(ServingRuntimePlatform.SINGLE);
              }}
            />
          }
        />
      );
    }

    return <EmptyModelServingPlatform />;
  };

  const renderSelectedPlatformModal = () => {
    if (!platformSelected) {
      return null;
    }

    // Now KServe-only

    if (isKServeNIMEnabled) {
      return <ManageNIMServingModal projectContext={{ currentProject }} onClose={onSubmit} />;
    }

    return (
      <ManageKServeModal
        projectContext={{ currentProject, connections }}
        servingRuntimeTemplates={templatesEnabled.filter((template) =>
          getTemplateEnabledForPlatform(template, ServingRuntimePlatform.SINGLE),
        )}
        onClose={onSubmit}
      />
    );
  };

  return (
    <>
      <DetailsSection
        objectType={!emptyModelServer ? ProjectObjectType.model : undefined}
        id={ProjectSectionID.MODEL_SERVER}
        title={!emptyModelServer ? ProjectSectionTitles[ProjectSectionID.MODEL_SERVER] : undefined}
        actions={
          shouldShowPlatformSelection || platformError || emptyModelServer
            ? undefined
            : [
                <ModelServingPlatformButtonAction
                  testId="deploy-button"
                  emptyTemplates={emptyTemplates}
                  onClick={() => {
                    setPlatformSelected(ServingRuntimePlatform.SINGLE);
                  }}
                  key="serving-runtime-actions"
                />,
              ]
        }
        description={
          shouldShowPlatformSelection && emptyModelServer
            ? 'Select the model serving type to be used when deploying models from this project.'
            : undefined
        }
        popover={
          !emptyModelServer ? (
            <Popover
              headerContent="About deployments"
              bodyContent="Deploy models to test them and integrate them into applications. Deploying a model makes it accessible via an API, enabling you to return predictions based on data inputs."
            >
              <DashboardPopupIconButton
                icon={<OutlinedQuestionCircleIcon />}
                aria-label="More info"
              />
            </Popover>
          ) : null
        }
        isLoading={!servingRuntimesLoaded && !templatesLoaded}
        isEmpty={shouldShowPlatformSelection}
        loadError={platformError || servingRuntimeError || templateError}
        emptyState={
          servingPlatformStatuses.platformEnabledCount > 1 ? (
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapLg' }}>
              <FlexItem
                flex={{ default: 'flex_1' }}
                style={{ borderRight: '1px solid var(--pf-t--global--border--color--default)' }}
              >
                <EmptyDetailsView
                  iconImage={typedEmptyImage(ProjectObjectType.modelServer)}
                  imageAlt="add a model server"
                />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }}>
                <Stack hasGutter>
                  <StackItem>
                    <Content>
                      <Content component="p">
                        Select the model serving type to be used when deploying from this project.
                      </Content>
                    </Content>
                  </StackItem>
                  <StackItem>
                    <Gallery hasGutter>
                      {kServeEnabled && (
                        <GalleryItem>
                          <EmptySingleModelServingCard
                            setErrorSelectingPlatform={setErrorSelectingPlatform}
                          />
                        </GalleryItem>
                      )}
                      {isNIMAvailable && (
                        <GalleryItem>
                          <EmptyNIMModelServingCard
                            setErrorSelectingPlatform={setErrorSelectingPlatform}
                          />
                        </GalleryItem>
                      )}
                    </Gallery>
                  </StackItem>
                  {errorSelectingPlatform && (
                    <ModelServingPlatformSelectErrorAlert
                      error={errorSelectingPlatform}
                      clearError={() => setErrorSelectingPlatform(undefined)}
                    />
                  )}
                  <StackItem>
                    <Alert
                      variant="info"
                      isInline
                      isPlain
                      title="You can change the model serving type before the first model is deployed from this project. After deployment, switching types requires deleting all models and servers."
                    />
                  </StackItem>
                </Stack>
              </FlexItem>
            </Flex>
          ) : (
            <EmptyModelServingPlatform />
          )
        }
        labels={
          currentProjectServingPlatform
            ? [
                <Flex gap={{ default: 'gapSm' }} key="serving-platform-label">
                  <Label data-testid="serving-platform-label">
                    {isKServeNIMEnabled
                      ? 'NVIDIA NIM serving enabled'
                      : isCurrentPlatformEnabled
                      ? 'Single-model serving enabled'
                      : 'Current platform disabled'}
                  </Label>

                  {emptyModelServer &&
                    (servingPlatformStatuses.platformEnabledCount > 1 ||
                      !isCurrentPlatformEnabled ||
                      platformError) && (
                      <ModelServingPlatformSelectButton
                        namespace={currentProject.metadata.name}
                        servingPlatform={NamespaceApplicationCase.RESET_MODEL_SERVING_PLATFORM}
                        setError={setErrorSelectingPlatform}
                        variant="link"
                        isInline
                        data-testid="change-serving-platform-button"
                      />
                    )}
                </Flex>,
              ]
            : undefined
        }
      >
        {emptyModelServer ? renderPlatformEmptyState() : <KServeInferenceServiceTable />}
      </DetailsSection>
      {renderSelectedPlatformModal()}
    </>
  );
};

export default ModelServingPlatform;
