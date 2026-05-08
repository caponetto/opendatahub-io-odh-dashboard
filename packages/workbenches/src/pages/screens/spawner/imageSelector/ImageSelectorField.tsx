import * as React from 'react';
import { Alert, Skeleton } from '@patternfly/react-core';
import { ImageStreamKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { ImageStreamAndVersion } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import {
  SupportedArea,
  useIsAreaAvailable,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import { useImageStreams } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useImageStreams';
import useBuildStatuses from '@odh-dashboard/workbenches/pages/screens/spawner/useBuildStatuses';
import {
  getDefaultVersionForImageStream,
  getExistingVersionsForImageStream,
  isInvalidBYONImageStream,
} from '@odh-dashboard/workbenches/pages/screens/spawner/spawnerUtils';
import ImageStreamSelector from './ImageStreamSelector';
import ImageVersionSelector from './ImageVersionSelector';
import ImageStreamPopover from './ImageStreamPopover';

type ImageSelectorFieldProps = {
  currentProject: string;
  selectedImage: ImageStreamAndVersion;
  setSelectedImage: React.Dispatch<React.SetStateAction<ImageStreamAndVersion>>;
  compatibleIdentifiers?: string[];
};

const ImageSelectorField: React.FC<ImageSelectorFieldProps> = ({
  currentProject,
  selectedImage,
  setSelectedImage,
  compatibleIdentifiers,
}) => {
  const { dashboardNamespace } = useDashboardNamespace();
  const buildStatuses = useBuildStatuses(dashboardNamespace);
  const [imageStreams, loaded, error] = useImageStreams(dashboardNamespace, { enabled: true });
  const isProjectScopedAvailable = useIsAreaAvailable(SupportedArea.DS_PROJECT_SCOPED).status;
  const [
    currentProjectImageStreams,
    currentProjectImageStreamsLoaded,
    currentProjectImageStreamsError,
  ] = useImageStreams(currentProject);
  const imageStreamsLoaded = isProjectScopedAvailable
    ? loaded && currentProjectImageStreamsLoaded
    : loaded;

  const imageVersionData = React.useMemo(() => {
    const { imageStream } = selectedImage;
    if (
      (!isProjectScopedAvailable && imageStream?.metadata.namespace === currentProject) ||
      !imageStream
    ) {
      return { buildStatuses, imageStream: undefined, imageVersions: [] };
    }
    return {
      buildStatuses,
      imageStream,
      imageVersions: getExistingVersionsForImageStream(imageStream),
    };
  }, [selectedImage, buildStatuses, currentProject, isProjectScopedAvailable]);

  const onImageStreamSelect = (newImageStream: ImageStreamKind) => {
    const version = getDefaultVersionForImageStream(newImageStream, buildStatuses);
    const versions = getExistingVersionsForImageStream(newImageStream);
    const initialVersion = versions.find((v) => v.name === version?.name);

    return setSelectedImage({
      imageStream: newImageStream,
      imageVersion: initialVersion,
    });
  };

  const errorMessage = error?.message || currentProjectImageStreamsError?.message;
  if (errorMessage) {
    return (
      <Alert title="Image loading error" variant="danger">
        {errorMessage}
      </Alert>
    );
  }

  if (!imageStreamsLoaded) {
    return <Skeleton />;
  }

  const safeImageStreams = imageStreams ?? [];

  return (
    <>
      <ImageStreamSelector
        currentProjectStreams={currentProjectImageStreams}
        currentProject={currentProject}
        imageStreams={safeImageStreams.filter(
          (imageStream) => !isInvalidBYONImageStream(imageStream),
        )}
        buildStatuses={buildStatuses}
        onImageStreamSelect={onImageStreamSelect}
        selectedImageStream={selectedImage.imageStream}
        compatibleIdentifiers={compatibleIdentifiers}
      />
      <ImageVersionSelector
        data={imageVersionData}
        setSelectedImageVersion={(selection) =>
          setSelectedImage((oldSelectedImage) => ({
            ...oldSelectedImage,
            imageVersion: selection,
          }))
        }
        selectedImageVersion={selectedImage.imageVersion}
      />
      <ImageStreamPopover
        selectedImage={
          !isProjectScopedAvailable &&
          selectedImage.imageStream?.metadata.namespace === currentProject
            ? {}
            : selectedImage
        }
      />
    </>
  );
};

export default ImageSelectorField;
