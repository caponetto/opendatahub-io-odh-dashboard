import * as React from 'react';
import { Tab, Tabs, TabTitleText } from '@patternfly/react-core';
import { asEnumMember } from '@odh-dashboard/dashboard-foundation-frontend/utilities/utils';
import NotebookAdmin from './NotebookAdmin';
import { NotebookControllerTabTypes } from '../../const';
import NotebookServerRoutes from '../server/NotebookServerRoutes';
import { NotebookControllerContext } from '../../NotebookControllerContext';

const NotebookControllerTabs: React.FC = () => {
  const { setImpersonating, currentTab, setCurrentAdminTab } =
    React.useContext(NotebookControllerContext);

  return (
    <div>
      <Tabs
        activeKey={currentTab}
        unmountOnExit
        onSelect={(e, eventKey) => {
          setImpersonating();
          const enumValue = asEnumMember(eventKey, NotebookControllerTabTypes);
          if (enumValue !== null) {
            setCurrentAdminTab(enumValue);
          }
        }}
      >
        <Tab
          data-id="spawner-tab"
          data-testid="spawner-tab"
          eventKey={NotebookControllerTabTypes.SERVER}
          title={<TabTitleText>Workbench</TabTitleText>}
        >
          <NotebookServerRoutes />
        </Tab>
        <Tab
          data-id="admin-tab"
          data-testid="admin-tab"
          eventKey={NotebookControllerTabTypes.ADMIN}
          title={<TabTitleText>Administration</TabTitleText>}
        >
          <NotebookAdmin />
        </Tab>
      </Tabs>
    </div>
  );
};

export default NotebookControllerTabs;
