export enum ProjectsFilterOptions {
  name = 'Name',
  user = 'User',
}

export const aiProjectFilterKey = 'A.I. projects';
export const allProjectFilterKey = 'All';

export const projectsFilterOptions = {
  [ProjectsFilterOptions.name]: 'Name',
  [ProjectsFilterOptions.user]: 'User',
};

export type ProjectsFilterDataType = Record<ProjectsFilterOptions, string | undefined>;

export const initialProjectsFilterData: ProjectsFilterDataType = {
  [ProjectsFilterOptions.name]: '',
  [ProjectsFilterOptions.user]: '',
};
