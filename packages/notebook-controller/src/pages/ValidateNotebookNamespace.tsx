import * as React from 'react';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import useNamespaces from './useNamespaces';
import { validateNotebookNamespaceRoleBinding } from '../utilities/notebookControllerUtils';

type ValidateNotebookNamespaceProps = {
  children: React.ReactNode;
};

const ValidateNotebookNamespace: React.FC<ValidateNotebookNamespaceProps> = ({ children }) => {
  const { workbenchNamespace, dashboardNamespace } = useNamespaces();
  const [loaded, setLoaded] = React.useState(false);
  const [loadError, setLoadError] = React.useState<Error | undefined>();

  React.useEffect(() => {
    if (workbenchNamespace && dashboardNamespace) {
      validateNotebookNamespaceRoleBinding(workbenchNamespace, dashboardNamespace)
        .then(() => {
          setLoaded(true);
        })
        .catch((e) => {
          const error = new Error(
            `Error validating the role binding of your notebookNamespace; ${
              e.response?.data?.message || e.message
            }`,
          );
          setLoadError(error);
        });
    }
  }, [workbenchNamespace, dashboardNamespace]);

  return loaded ? (
    <>{children}</>
  ) : (
    <ApplicationsPage
      title="Loading..."
      description=""
      loaded={false}
      empty={false}
      loadError={loadError}
    />
  );
};

export default ValidateNotebookNamespace;
