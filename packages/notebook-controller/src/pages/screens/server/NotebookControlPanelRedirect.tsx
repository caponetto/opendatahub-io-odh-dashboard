import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useUser } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { usernameTranslate } from '@odh-dashboard/dashboard-foundation-frontend/utilities/notebookUtils';
import { useCheckJupyterEnabled } from '@odh-dashboard/workbenches-shared/concepts/notebooks/useCheckJupyterEnabled';
import { NotebookControllerContext } from '../../NotebookControllerContext';
import { NotebookControllerTabTypes } from '../../const';

const NotebookControlPanelRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { username: translatedUsername } = useParams<{ username: string }>();
  const { username: loggedInUser, isAdmin } = useUser();
  const translatedLoggedInUsername = usernameTranslate(loggedInUser);
  const { setImpersonating, setCurrentAdminTab } = React.useContext(NotebookControllerContext);
  const isJupyterEnabled = useCheckJupyterEnabled();

  React.useEffect(() => {
    if (translatedLoggedInUsername && translatedUsername && isJupyterEnabled) {
      const notActiveUser = translatedLoggedInUsername !== translatedUsername;
      if (notActiveUser) {
        if (isAdmin) {
          // TODO: we need to worry about this case -- how to manage it?
          // setImpersonating(undefined, translatedUsername);
          setCurrentAdminTab(NotebookControllerTabTypes.ADMIN);
          navigate('/notebook-controller', { replace: true });
          return;
        }

        // Invalid state -- cannot view others notebook as not admin
        navigate('/not-found');
        return;
      }

      // Logged in user -- just redirect and it will load the state normally
      navigate('/notebook-controller', { replace: true });
    }
  }, [
    translatedUsername,
    isJupyterEnabled,
    navigate,
    translatedLoggedInUsername,
    isAdmin,
    setImpersonating,
    setCurrentAdminTab,
  ]);
  return (
    <ApplicationsPage title="Redirecting..." description={null} loaded={false} empty={false} />
  );
};

export default NotebookControlPanelRedirect;
