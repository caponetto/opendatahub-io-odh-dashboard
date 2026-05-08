import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { NotebookImageStatus } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookImageConst';
import {
  getImageStreamDisplayName,
  getImageVersionDependencies,
  getImageVersionSoftwareString,
} from '@odh-dashboard/workbenches/pages/screens/spawner/spawnerUtils';
import useNotebookImageData from './useNotebookImageData';
import { NotebookImage } from './types';

const useNotebookImage = (
  notebook: NotebookKind | undefined,
):
  | [notebookImage: null, loaded: false, loadError?: Error]
  | [notebookImage: NotebookImage, loaded: true, loadError: undefined] => {
  const [data, loaded, loadError] = useNotebookImageData(notebook);

  if (!notebook || !loaded) {
    return [null, false, loadError];
  }

  const { imageDisplayName, imageStatus } = data;

  // if the image is deleted, return the image name if it is available (based on notebook annotations)
  if (imageStatus === NotebookImageStatus.DELETED) {
    return [
      {
        imageDisplayName,
        imageStatus,
      },
      true,
      undefined,
    ];
  }

  const { imageStream, imageAvailability, imageVersion, latestImageVersion } = data;

  return [
    {
      imageDisplayName: getImageStreamDisplayName(imageStream),
      tagSoftware: getImageVersionSoftwareString(imageVersion),
      dependencies: getImageVersionDependencies(imageVersion, false),
      imageAvailability,
      imageStatus,
      imageStream,
      imageVersion,
      latestImageVersion,
    },
    true,
    undefined,
  ];
};

export default useNotebookImage;
