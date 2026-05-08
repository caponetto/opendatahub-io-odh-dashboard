import * as React from 'react';
import GlobalIcon from '@odh-dashboard/dashboard-foundation-frontend/images/icons/GlobalIcon';
import TypedObjectIcon from '#~/concepts/design/TypedObjectIcon';
import { ProjectObjectType } from '#~/concepts/design/utils';

export type ProjectScopedIconProps = {
  isProject: boolean;
  style?: React.CSSProperties;
  alt?: string;
};

const ProjectScopedIcon: React.FC<ProjectScopedIconProps> = ({ isProject, style, alt }) =>
  isProject ? (
    <TypedObjectIcon alt={alt ?? ''} resourceType={ProjectObjectType.project} style={style} />
  ) : (
    <GlobalIcon style={style} />
  );

export default ProjectScopedIcon;
