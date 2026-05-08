import * as React from 'react';
import { NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import useNamespaces from '@odh-dashboard/dashboard-foundation-frontend/utilities/useNamespaces';
import { useImageStreams } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useImageStreams';
import { getNotebookImageData } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookImageUtils';
import type { NotebookImageData } from '@odh-dashboard/dashboard-foundation-frontend/concepts/notebook/notebookImageUtils';

const useNotebookImageData = (notebook?: NotebookKind): NotebookImageData => {
  const { dashboardNamespace } = useNamespaces();
  const namespace = notebook?.metadata.annotations?.['opendatahub.io/workbench-image-namespace']
    ? notebook.metadata.annotations['opendatahub.io/workbench-image-namespace']
    : dashboardNamespace;
  const [images, loaded, loadError] = useImageStreams(namespace);

  return React.useMemo(() => {
    if (!notebook || !loaded) {
      return [null, false, loadError];
    }

    const data = getNotebookImageData(notebook, images ?? []);

    return [data, true, undefined];
  }, [notebook, loaded, images, loadError]);
};

export default useNotebookImageData;
