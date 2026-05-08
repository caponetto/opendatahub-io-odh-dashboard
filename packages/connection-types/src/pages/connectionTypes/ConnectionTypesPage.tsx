import React from 'react';
import { PageSection } from '@patternfly/react-core';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { useWatchConnectionTypes } from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/useWatchConnectionTypes';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import EmptyConnectionTypes from '@odh-dashboard/connection-types/pages/connectionTypes/EmptyConnectionTypes';
import ConnectionTypesTable from '@odh-dashboard/connection-types/pages/connectionTypes/ConnectionTypesTable';

const ConnectionTypesPage: React.FC = () => {
  const [connectionTypes, loaded, loadError, refresh] = useWatchConnectionTypes();

  return (
    <ApplicationsPage
      loaded={loaded}
      loadError={loadError}
      empty={loaded && !connectionTypes.length}
      emptyStatePage={<EmptyConnectionTypes />}
      title={
        <TitleWithIcon title="Connection types" objectType={ProjectObjectType.dataConnection} />
      }
      description="Create and manage connection types for users in your organization. Connection types include customizable fields and optional default values to decrease the time required to add connections to data sources and sinks."
      errorMessage="Unable to load connection types"
    >
      <PageSection isFilled>
        <ConnectionTypesTable connectionTypes={connectionTypes} onUpdate={refresh} />
      </PageSection>
    </ApplicationsPage>
  );
};

export default ConnectionTypesPage;
