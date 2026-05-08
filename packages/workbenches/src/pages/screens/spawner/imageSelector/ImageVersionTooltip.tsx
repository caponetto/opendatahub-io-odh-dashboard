import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import type { ImageVersionDependencyType } from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageStreamUtils';
import NotebookImagePackageDetails from '@odh-dashboard/workbenches/pages/notebook/NotebookImagePackageDetails';

type ImageVersionTooltipProps = {
  dependencies: ImageVersionDependencyType[];
  children: React.ReactNode;
};

const ImageVersionTooltip: React.FC<ImageVersionTooltipProps> = ({ children, dependencies }) => {
  if (dependencies.length === 0) {
    return null;
  }

  return (
    <Tooltip
      content={
        <NotebookImagePackageDetails title="Packages included" dependencies={dependencies} />
      }
      position="right"
    >
      <div>{children}</div>
    </Tooltip>
  );
};

export default ImageVersionTooltip;
