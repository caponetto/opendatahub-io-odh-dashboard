import type {
  ImageStreamKind,
  ImageStreamSpecTagType,
  ImageStreamStatusTag,
  K8sDSGResource,
} from '#~/k8sTypes';
import type { BYONImage, BYONImagePackage, ImageInfo, ImageTagInfo, TagContent } from '#~/types';
import {
  DisplayNameAnnotation,
  ImageStreamAnnotation,
  ImageStreamLabel,
  ImageStreamSpecTagAnnotation,
} from '#~/types';
import { kindApiVersion } from '#~/concepts/k8s/utils';
import { ImageStreamModel } from '#~/api';

export type ImageVersionDependencyType = {
  name: string;
  version?: string;
};

export const IMAGE_ANNOTATIONS = {
  DESC: 'opendatahub.io/notebook-image-desc' as const,
  DISP_NAME: 'opendatahub.io/notebook-image-name' as const,
  URL: 'opendatahub.io/notebook-image-url' as const,
  DEFAULT: 'opendatahub.io/default-image' as const,
  SOFTWARE: 'opendatahub.io/notebook-software' as const,
  DEPENDENCIES: 'opendatahub.io/notebook-python-dependencies' as const,
  IMAGE_ORDER: 'opendatahub.io/notebook-image-order' as const,
  RECOMMENDED: 'opendatahub.io/workbench-image-recommended' as const,
  OUTDATED: 'opendatahub.io/image-tag-outdated' as const,
};

export const getImageStreamDisplayName = (imageStream: ImageStreamKind): string =>
  imageStream.metadata.annotations?.[IMAGE_ANNOTATIONS.DISP_NAME] || imageStream.metadata.name;

export const getCompatibleIdentifiers = (object: ImageStreamKind | K8sDSGResource): string[] => {
  try {
    const annotation = object.metadata.annotations?.['opendatahub.io/recommended-accelerators'];
    if (annotation) {
      const identifiers = JSON.parse(annotation);
      if (Array.isArray(identifiers)) {
        return identifiers;
      }
    }
  } catch (error) {
    // catch invalid json in metadata
  }
  return [];
};

export const isCompatibleWithIdentifier = (
  identifier?: string,
  obj?: ImageStreamKind | K8sDSGResource,
): boolean => {
  if (!obj || !identifier) {
    return false;
  }

  return getCompatibleIdentifiers(obj).some((cr) => cr === identifier);
};

export const isBYONImageStream = (imageStream: ImageStreamKind): boolean =>
  imageStream.metadata.labels?.['app.kubernetes.io/created-by'] === 'byon';

export const getImageVersionDependencies = (
  imageVersion: ImageStreamSpecTagType,
  isSoftware = false,
): ImageVersionDependencyType[] => {
  const depString = isSoftware
    ? imageVersion.annotations?.[IMAGE_ANNOTATIONS.SOFTWARE] || ''
    : imageVersion.annotations?.[IMAGE_ANNOTATIONS.DEPENDENCIES] || '';
  let dependencies: ImageVersionDependencyType[] | undefined;
  try {
    dependencies = JSON.parse(depString);
  } catch (e) {
    if (depString.includes('[')) {
      /* eslint-disable-next-line no-console */
      console.error(`JSON parse error when parsing ${imageVersion.name}`);
    }
    dependencies = [];
  }
  return dependencies || [];
};

export const buildLabelSelector = (labels: Record<string, string> | string): string =>
  typeof labels === 'string'
    ? labels
    : Object.entries(labels)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');

export const IMAGE_URL_REGEXP =
  /^([\w.\-_]+(?::\d+|)(?=\/[a-z0-9._-]+\/[a-z0-9._-]+)|)(?:\/|)([a-z0-9.\-_]+(?:\/[a-z0-9.\-_]+|))(?::([\w.\-_]{1,127})|)/;

export const parseImageURL = (
  imageString: string,
): {
  fullURL: string;
  host: string | undefined;
  image: string | undefined;
  tag: string | undefined;
} => {
  const trimmedString = imageString.trim();
  const result = trimmedString.match(IMAGE_URL_REGEXP);
  if (!result) {
    return {
      fullURL: trimmedString,
      host: undefined,
      image: undefined,
      tag: undefined,
    };
  }
  return {
    fullURL: trimmedString,
    host: result[1],
    image: result[2],
    tag: result[3],
  };
};

export const hasConflictName = (
  imageStreams: ImageStreamKind[],
  displayName: string,
  excludeName?: string,
): boolean =>
  imageStreams.some(({ metadata }) => {
    const name =
      metadata.annotations?.[ImageStreamAnnotation.DISP_NAME] ??
      metadata.annotations?.[DisplayNameAnnotation.DISP_NAME] ??
      metadata.name;
    return name === displayName && metadata.name !== excludeName;
  });

export const packagesToString = (packages: BYONImagePackage[]): string => {
  if (packages.length > 0) {
    let packageAsString = '[';
    packages.forEach((value, index) => {
      packageAsString = packageAsString + JSON.stringify(value);
      if (index !== packages.length - 1) {
        packageAsString = `${packageAsString},`;
      } else {
        packageAsString = `${packageAsString}]`;
      }
    });
    return packageAsString;
  }
  return '[]';
};

export const mapImageStreamToBYONImage = (image: ImageStreamKind): BYONImage => {
  const { metadata, spec } = image;
  const annotations = metadata.annotations ?? {};
  const labels = metadata.labels ?? {};
  const tag = spec.tags?.[0];
  const tagAnnotations = tag?.annotations ?? {};

  return {
    id: metadata.uid || '',
    name: metadata.name,
    // eslint-disable-next-line camelcase
    display_name:
      annotations[ImageStreamAnnotation.DISP_NAME] ||
      annotations[DisplayNameAnnotation.DISP_NAME] ||
      metadata.name,
    description:
      annotations[ImageStreamAnnotation.DESC] || annotations[DisplayNameAnnotation.DESC] || '',
    visible: labels[ImageStreamLabel.NOTEBOOK] === 'true',
    error: getBYONImageErrorMessage(image) ?? '',
    packages: safeJSONParse<BYONImagePackage>(
      tagAnnotations[ImageStreamSpecTagAnnotation.DEPENDENCIES] || '',
    ),
    software: safeJSONParse<BYONImagePackage>(
      tagAnnotations[ImageStreamSpecTagAnnotation.SOFTWARE] || '',
    ),
    // eslint-disable-next-line camelcase
    imported_time: metadata.creationTimestamp || '',
    url: annotations[ImageStreamAnnotation.URL] || '',
    provider: annotations[ImageStreamAnnotation.CREATOR] ?? '',
    recommendedAcceleratorIdentifiers: safeJSONParse<string>(
      annotations[ImageStreamAnnotation.RECOMMENDED_ACCELERATORS] ?? '',
    ),
  };
};

export const mapImageStreamToImageInfo = (image: ImageStreamKind): ImageInfo => {
  const { metadata, status } = image;
  const annotations = metadata.annotations ?? {};

  return {
    name: metadata.name,
    description: annotations[ImageStreamAnnotation.DESC] || '',
    url: annotations[ImageStreamAnnotation.URL] || '',
    // eslint-disable-next-line camelcase
    display_name: annotations[ImageStreamAnnotation.DISP_NAME] || metadata.name,
    tags: getTagInfo(image),
    order: Number(annotations[ImageStreamAnnotation.IMAGE_ORDER]) || 100,
    dockerImageRepo: status?.dockerImageRepository || '',
    error: isBYONImage(image) ? getBYONImageErrorMessage(image) || '' : '',
  };
};

const getBYONImageErrorMessage = (image: ImageStreamKind) => {
  const activeTag = image.status?.tags?.find(
    (statusTag) => statusTag.tag === image.spec.tags?.[0].name,
  );
  return activeTag?.conditions?.[0]?.message;
};

const isBYONImage = (image: ImageStreamKind) =>
  image.metadata.labels?.['app.kubernetes.io/created-by'] === 'byon';

const getTagInfo = (image: ImageStreamKind): ImageTagInfo[] => {
  const tags = image.spec.tags || [];
  const statusTags: ImageStreamStatusTag[] = image.status?.tags || [];
  const validTags = getValidTags(tags, statusTags);
  return validTags.map((tag) => ({
    content: getTagContent(tag),
    name: tag.name,
    recommended: JSON.parse(tag.annotations?.[ImageStreamSpecTagAnnotation.RECOMMENDED] || 'false'),
    default: JSON.parse(tag.annotations?.[ImageStreamSpecTagAnnotation.DEFAULT] || 'false'),
  }));
};

const getValidTags = (
  specTags: ImageStreamSpecTagType[],
  statusTags: ImageStreamStatusTag[],
): ImageStreamSpecTagType[] => {
  const validTagNames: Set<string> = new Set(statusTags.map((st) => st.tag));
  return specTags.filter(
    (specTag) =>
      validTagNames.has(specTag.name) &&
      !specTag.annotations?.[ImageStreamSpecTagAnnotation.OUTDATED],
  );
};

const getTagContent = (tag: ImageStreamSpecTagType): TagContent => ({
  software: safeJSONParse<BYONImagePackage>(
    tag.annotations?.[ImageStreamSpecTagAnnotation.SOFTWARE] || '',
  ),
  dependencies: safeJSONParse<BYONImagePackage>(
    tag.annotations?.[ImageStreamSpecTagAnnotation.DEPENDENCIES] || '',
  ),
});

const safeJSONParse = <T>(unparsed: string): T[] => {
  try {
    const result = JSON.parse(unparsed);
    return Array.isArray(result) ? result : [];
  } catch {
    return [];
  }
};

export const byonDuplicatedErrorMessage = (
  image: Partial<BYONImage> & Pick<BYONImage, 'url' | 'display_name'>,
): string =>
  `Unable to add notebook image: ${kindApiVersion(ImageStreamModel)} "${
    image.display_name
  }" already exists`;
