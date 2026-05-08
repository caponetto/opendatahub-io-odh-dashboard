import * as React from 'react';
import * as _ from 'lodash-es';
import { Gallery, PageSection } from '@patternfly/react-core';
import { useWatchComponents } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useWatchComponents';
import { OdhApplication } from '@odh-dashboard/dashboard-foundation-frontend/types';
import ApplicationsPage from '@odh-dashboard/dashboard-foundation-frontend/components/ApplicationsPage';
import { fireMiscTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { useWatchIntegrationComponents } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useWatchIntegrationComponents';
import TitleWithIcon from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/TitleWithIcon';
import { ProjectObjectType } from '@odh-dashboard/dashboard-foundation-frontend/concepts/design/utils';
import OdhAppCard from '../../components/OdhAppCard';

const description = `Launch your enabled applications, view documentation, or get started with quick start instructions and tasks.`;

type EnabledApplicationsInnerProps = {
  loaded: boolean;
  loadError?: Error;
  components: OdhApplication[];
};

// use to record the current enabled components
let enabledComponents: OdhApplication[] = [];

export const EnabledApplicationsInner: React.FC<EnabledApplicationsInnerProps> = React.memo(
  ({ loaded, loadError, components }) => {
    const isEmpty = components.length === 0;
    const { checkedComponents, isIntegrationComponentsChecked } = useWatchIntegrationComponents(
      loaded ? components : undefined,
    );

    return (
      <ApplicationsPage
        title={<TitleWithIcon title="Enabled" objectType={ProjectObjectType.enabledApplications} />}
        description={description}
        loaded={loaded && isIntegrationComponentsChecked}
        empty={isEmpty}
        loadError={loadError}
      >
        <PageSection
          style={{ height: '100%' }}
          hasBodyWrapper={false}
          isFilled
          data-testid="enabled-application"
        >
          <Gallery maxWidths={{ default: '330px' }} role="list" hasGutter>
            {checkedComponents.map((c) => (
              <OdhAppCard key={c.metadata.name} odhApp={c} />
            ))}
          </Gallery>
        </PageSection>
      </ApplicationsPage>
    );
  },
);
EnabledApplicationsInner.displayName = 'EnabledApplicationsInner';

const EnabledApplications: React.FC = () => {
  const { components, loaded, loadError } = useWatchComponents(true);

  const sortedComponents = React.useMemo(
    () =>
      _.cloneDeep(components)
        .filter((component) => !component.spec.hidden)
        .toSorted((a, b) => a.spec.displayName.localeCompare(b.spec.displayName)),
    [components],
  );

  React.useEffect(() => {
    /*
     * compare the current enabled applications and new fetched enabled applications
     * fire an individual segment.io tracking event for every different enabled application
     */
    if (loaded && components.length) {
      _.difference(
        components.filter((component) => component.spec.isEnabled).map((c) => c.metadata.name),
        enabledComponents
          .filter((component) => component.spec.isEnabled)
          .map((c) => c.metadata.name),
      ).forEach((name) =>
        fireMiscTrackingEvent('Application Enabled', {
          name,
        }),
      );
      enabledComponents = components;
    }
  }, [components, loaded]);

  return (
    <EnabledApplicationsInner loaded={loaded} components={sortedComponents} loadError={loadError} />
  );
};

export default EnabledApplications;
