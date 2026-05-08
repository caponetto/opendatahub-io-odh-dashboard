import * as React from 'react';
import { Flex, FlexItem, Radio } from '@patternfly/react-core';
import { ImageInfo, ImageTagInfo } from '@odh-dashboard/dashboard-foundation-frontend/types';
import {
  getDescriptionForTag,
  getImageTagVersion,
  getTagForImage,
  isImageTagBuildValid,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageUtils';
import { useAppContext } from '@odh-dashboard/dashboard-foundation-frontend/app/AppContext';
import ImageVersions from './ImageVersions';
import ImageTagPopover from './ImageTagPopover';
import '#~/pages/NotebookController.scss';

type ImageSelectorProps = {
  image: ImageInfo;
  selectedImage?: ImageInfo;
  selectedTag?: ImageTagInfo;
  handleSelection: (image: ImageInfo, tag: ImageTagInfo, checked: boolean) => void;
};

const ImageSelector: React.FC<ImageSelectorProps> = ({
  image,
  selectedImage,
  selectedTag,
  handleSelection,
}) => {
  const { buildStatuses } = useAppContext();
  const currentTag = getTagForImage(buildStatuses, image, selectedImage?.name, selectedTag?.name);
  const { tags } = image;
  const getImagePopover = (currentImage: ImageInfo) => {
    if (!currentImage.description && !currentTag?.content.dependencies.length) {
      return null;
    }
    return <ImageTagPopover tag={currentTag} description={currentImage.description} />;
  };

  const disabled = tags.every((tag) => !isImageTagBuildValid(buildStatuses, image, tag));

  return (
    <>
      <Radio
        id={image.name}
        data-testid={`radio ${image.name}`}
        data-id={image.name}
        name={image.display_name}
        className="odh-notebook-controller__notebook-image-option"
        isDisabled={disabled}
        label={
          <Flex spaceItems={{ default: 'spaceItemsXs' }}>
            <FlexItem>{image.display_name}</FlexItem>
            {tags.length > 1 ? (
              <FlexItem>
                {getImageTagVersion(buildStatuses, image, selectedImage?.name, selectedTag?.name)}
              </FlexItem>
            ) : null}
            <FlexItem>{getImagePopover(image)}</FlexItem>
          </Flex>
        }
        description={getDescriptionForTag(currentTag)}
        isChecked={image.name === selectedImage?.name}
        onChange={(e, checked: boolean) => {
          if (currentTag) {
            handleSelection(image, currentTag, checked);
          }
        }}
      />
      <ImageVersions
        image={image}
        tags={tags}
        selectedTag={image.name === selectedImage?.name ? selectedTag : undefined}
        onSelect={(tag, checked) => handleSelection(image, tag, checked)}
      />
    </>
  );
};

export default ImageSelector;
