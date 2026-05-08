import * as React from 'react';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import CustomServingRuntimeListView from './CustomServingRuntimeListView';
import CustomServingRuntimeHeaderLabels from './CustomServingRuntimeHeaderLabels';
import EmptyCustomServingRuntime from './EmptyCustomServingRuntime';
import { CustomServingRuntimeContext } from './CustomServingRuntimeContext';

const CustomServingRuntimeView: React.FC = () => {
  const {
    servingRuntimeTemplates: [servingRuntimeTemplates],
  } = React.useContext(CustomServingRuntimeContext);
  const safeServingRuntimeTemplates = React.useMemo(
    () => servingRuntimeTemplates ?? [],
    [servingRuntimeTemplates],
  );

  return (
    <ApplicationsPage
      title={
        <TitleWithIcon title="Serving runtimes" objectType={ProjectObjectType.servingRuntime} />
      }
      description="Manage your model serving runtimes."
      loaded
      empty={safeServingRuntimeTemplates.length === 0}
      emptyStatePage={<EmptyCustomServingRuntime />}
      provideChildrenPadding
      headerContent={<CustomServingRuntimeHeaderLabels />}
    >
      <CustomServingRuntimeListView />
    </ApplicationsPage>
  );
};

export default CustomServingRuntimeView;
