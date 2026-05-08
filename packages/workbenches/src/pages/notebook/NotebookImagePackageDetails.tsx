import * as React from 'react';
import {
  DescriptionList,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Truncate,
} from '@patternfly/react-core';
import type { ImageVersionDependencyType } from '@odh-dashboard/dashboard-foundation-frontend/utilities/imageStreamUtils';
import { getNameVersionString } from '@odh-dashboard/workbenches/pages/screens/spawner/spawnerUtils';

type NotebookPackageDetailsProps = {
  dependencies: ImageVersionDependencyType[];
  title?: React.ReactNode;
};

const NotebookImagePackageDetails: React.FC<NotebookPackageDetailsProps> = ({
  dependencies,
  title,
}) => {
  if (dependencies.length === 0) {
    return null;
  }

  return (
    <DescriptionList>
      <DescriptionListGroup>
        <DescriptionListTerm>{title || 'Packages'}</DescriptionListTerm>
        <DescriptionListDescription>
          {dependencies.map(getNameVersionString).map((pkg) => (
            <div key={pkg}>
              <Truncate content={pkg} />
            </div>
          ))}
        </DescriptionListDescription>
      </DescriptionListGroup>
    </DescriptionList>
  );
};

export default NotebookImagePackageDetails;
