import * as React from 'react';
import { ProjectDetailsContext } from '@odh-dashboard/projects-shared/concepts/projects/ProjectDetailsContext';
import { NotebookState } from './types';

const useWillNotebooksRestart = (notebookNames: string[]): NotebookState[] => {
  const {
    notebooks: { data: notebookStates },
  } = React.useContext(ProjectDetailsContext);

  return notebookStates.filter(
    (notebookState) =>
      notebookNames.includes(notebookState.notebook.metadata.name) &&
      (notebookState.isRunning || notebookState.isStarting),
  );
};

export default useWillNotebooksRestart;
