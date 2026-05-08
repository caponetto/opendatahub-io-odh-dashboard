import { ImageStreamKind, ImageStreamSpecTagType, NotebookKind } from '#~/k8sTypes';
import { PodContainer } from '#~/types';
import { getImageStreamDisplayName, isBYONImageStream } from '#~/utilities/imageStreamUtils';
import { NotebookImageAvailability, NotebookImageStatus } from './notebookImageConst';

export type NotebookImageDataItem =
  | {
      imageAvailability: NotebookImageAvailability;
      imageDisplayName: string;
      imageStream: ImageStreamKind;
      imageVersion: ImageStreamSpecTagType;
      latestImageVersion?: ImageStreamSpecTagType;
      imageStatus?: Exclude<NotebookImageStatus, NotebookImageStatus.DELETED>;
    }
  | {
      imageStatus: NotebookImageStatus.DELETED;
      imageDisplayName?: string;
    };

export type NotebookImageData =
  | [data: null, loaded: false, loadError: undefined]
  | [data: null, loaded: false, loadError: Error]
  | [
      data: {
        imageStatus: NotebookImageStatus.DELETED;
        imageDisplayName?: string;
      },
      loaded: true,
      loadError: undefined,
    ]
  | [
      data: {
        imageAvailability: NotebookImageAvailability;
        imageDisplayName: string;
        imageStream: ImageStreamKind;
        imageVersion: ImageStreamSpecTagType;
        latestImageVersion?: ImageStreamSpecTagType;
        imageStatus?: Exclude<NotebookImageStatus, NotebookImageStatus.DELETED>;
      },
      loaded: true,
      loadError: undefined,
    ];

export const getImageAvailability = (imageStream: ImageStreamKind): NotebookImageAvailability =>
  imageStream.metadata.labels?.['opendatahub.io/notebook-image'] === 'true'
    ? NotebookImageAvailability.ENABLED
    : NotebookImageAvailability.DISABLED;

export const getDeletedImageData = (
  imageDisplayName: string | undefined,
): NotebookImageDataItem => ({
  imageStatus: NotebookImageStatus.DELETED,
  imageDisplayName,
});

const getImageStatus = (
  notebook: NotebookKind,
  imageStream: ImageStreamKind,
  imageVersion: ImageStreamSpecTagType,
): NotebookImageStatus | undefined => {
  if (
    imageVersion.annotations?.['opendatahub.io/image-tag-outdated'] === 'true' ||
    isNotebookImageOutdated(notebook, imageStream)
  ) {
    return NotebookImageStatus.DEPRECATED;
  }
  if (imageVersion.annotations?.['opendatahub.io/workbench-image-recommended'] === 'true') {
    return NotebookImageStatus.LATEST;
  }
  return undefined;
};

const findNoteBookImageTag = (
  _notebook: NotebookKind,
  imageStream: ImageStreamKind,
  imageName: string,
  versionName: string,
) => {
  if (imageStream.metadata.name !== imageName) {
    return false;
  }
  return imageStream.spec.tags?.some((imageTags) => imageTags.name === versionName) ?? false;
};

const findNotebookImageCommit = (notebook: NotebookKind, imageStream: ImageStreamKind) =>
  imageStream.spec.tags?.some(
    (imageTags) =>
      imageTags.annotations?.['opendatahub.io/notebook-build-commit'] ===
      notebook.metadata.annotations?.[
        'notebooks.opendatahub.io/last-image-version-git-commit-selection'
      ],
  );

const isNotebookImageOutdated = (notebook: NotebookKind, imageStream: ImageStreamKind) =>
  !findNotebookImageCommit(notebook, imageStream) && !isBYONImageStream(imageStream);

const isNotebookImageDeleted = (
  notebook: NotebookKind,
  imageStream: ImageStreamKind,
  imageName: string,
  versionName: string,
) =>
  !findNoteBookImageTag(notebook, imageStream, imageName, versionName) &&
  !isBYONImageStream(imageStream);

const getNotebookImageInternalRegistry = (
  notebook: NotebookKind,
  images: ImageStreamKind[],
  imageName: string,
  versionName: string,
): NotebookImageDataItem => {
  const imageStream = images.find((image) => image.metadata.name === imageName);

  if (!imageStream || isNotebookImageDeleted(notebook, imageStream, imageName, versionName)) {
    return getDeletedImageData(
      notebook.metadata.annotations?.['opendatahub.io/image-display-name'],
    );
  }

  const versions = imageStream.spec.tags || [];
  const imageVersion = versions.find((version) => version.name === versionName);
  const imageDisplayName = getImageStreamDisplayName(imageStream);
  if (!imageVersion) {
    return getDeletedImageData(imageDisplayName);
  }
  const imageAvailability = getImageAvailability(imageStream);
  const imageStatus = getImageStatus(notebook, imageStream, imageVersion);
  const latestImageVersion = versions.find(
    (version) => version.annotations?.['opendatahub.io/workbench-image-recommended'] === 'true',
  );
  return {
    imageStream,
    imageVersion,
    imageAvailability,
    imageDisplayName,
    latestImageVersion,
    imageStatus,
  };
};

const getNotebookImageNoInternalRegistry = (
  notebook: NotebookKind,
  images: ImageStreamKind[],
  lastImageSelectionName: string,
  containerImage: string,
): NotebookImageDataItem => {
  const imageStream = images.find(
    (image) =>
      image.metadata.name === lastImageSelectionName &&
      image.spec.tags?.find((version) => version.from?.name === containerImage),
  );

  if (!imageStream) {
    return getDeletedImageData(
      notebook.metadata.annotations?.['opendatahub.io/image-display-name'],
    );
  }

  const versions = imageStream.spec.tags || [];
  const imageVersion = versions.find((version) => version.from?.name === containerImage);
  const imageDisplayName = getImageStreamDisplayName(imageStream);
  if (!imageVersion) {
    return getDeletedImageData(imageDisplayName);
  }
  const imageAvailability = getImageAvailability(imageStream);
  const imageStatus = getImageStatus(notebook, imageStream, imageVersion);
  const latestImageVersion = versions.find(
    (version) => version.annotations?.['opendatahub.io/workbench-image-recommended'] === 'true',
  );
  return {
    imageStream,
    imageVersion,
    imageAvailability,
    imageDisplayName,
    latestImageVersion,
    imageStatus,
  };
};

const getNotebookImageNoInternalRegistryNoSHA = (
  notebook: NotebookKind,
  images: ImageStreamKind[],
  lastImageSelectionTag: string,
  containerImage: string,
): NotebookImageDataItem => {
  const imageStream = images.find((image) =>
    image.status?.tags?.find(
      (version) =>
        version.tag === lastImageSelectionTag &&
        version.items?.find((item) => item.dockerImageReference === containerImage),
    ),
  );

  if (!imageStream) {
    return getDeletedImageData(
      notebook.metadata.annotations?.['opendatahub.io/image-display-name'],
    );
  }

  const versions = imageStream.spec.tags || [];
  const imageVersion = versions.find((version) => version.name === lastImageSelectionTag);
  const imageDisplayName = getImageStreamDisplayName(imageStream);
  if (!imageVersion) {
    return getDeletedImageData(imageDisplayName);
  }
  const imageAvailability = getImageAvailability(imageStream);
  const imageStatus = getImageStatus(notebook, imageStream, imageVersion);
  const latestImageVersion = versions.find(
    (version) => version.annotations?.['opendatahub.io/workbench-image-recommended'] === 'true',
  );
  return {
    imageStream,
    imageVersion,
    imageAvailability,
    imageDisplayName,
    latestImageVersion,
    imageStatus,
  };
};

export const getNotebookImageData = (
  notebook: NotebookKind,
  images: ImageStreamKind[],
): NotebookImageDataItem => {
  const container: PodContainer | undefined = notebook.spec.template.spec.containers.find(
    (currentContainer) => currentContainer.name === notebook.metadata.name,
  );
  const containerImages = container?.image.split('/');
  const imageTag = containerImages?.[containerImages.length - 1]?.split(':');
  if (!imageTag || imageTag.length < 2 || !container) {
    return {
      imageStatus: NotebookImageStatus.DELETED,
    };
  }

  const [imageName, versionName] = imageTag;
  const [lastImageSelectionName, lastImageSelectionTag] =
    notebook.metadata.annotations?.['notebooks.opendatahub.io/last-image-selection']?.split(':') ??
    [];

  const notebookImageInternalRegistry = getNotebookImageInternalRegistry(
    notebook,
    images,
    imageName,
    versionName,
  );

  if (notebookImageInternalRegistry.imageStatus !== NotebookImageStatus.DELETED) {
    return notebookImageInternalRegistry;
  }

  const notebookImageNoInternalRegistry = getNotebookImageNoInternalRegistry(
    notebook,
    images,
    lastImageSelectionName,
    container.image,
  );

  if (notebookImageNoInternalRegistry.imageStatus !== NotebookImageStatus.DELETED) {
    return notebookImageNoInternalRegistry;
  }

  const notebookImageNoInternalRegistryNoSHA = getNotebookImageNoInternalRegistryNoSHA(
    notebook,
    images,
    lastImageSelectionTag,
    container.image,
  );

  if (notebookImageNoInternalRegistryNoSHA.imageStatus !== NotebookImageStatus.DELETED) {
    return notebookImageNoInternalRegistryNoSHA;
  }

  return {
    imageStatus: NotebookImageStatus.DELETED,
    imageDisplayName:
      notebookImageInternalRegistry.imageDisplayName ||
      notebookImageNoInternalRegistry.imageDisplayName ||
      notebookImageNoInternalRegistryNoSHA.imageDisplayName,
  };
};
