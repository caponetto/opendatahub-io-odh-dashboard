import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { OdhDocument } from '@odh-dashboard/dashboard-foundation-frontend/types';
import FilterSidePanelCategoryItem from '@odh-dashboard/dashboard-foundation-frontend/components/FilterSidePanelCategoryItem';
import {
  removeQueryArgument,
  setQueryArgument,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/router';
import { APPLICATION_FILTER_KEY } from './const';
import { useQueryFilters } from './useQueryFilters';
import FilterSidePanelCategory from './FilterSidePanelCategory';

type ApplicationFiltersProps = {
  docApps: OdhDocument[];
  categoryApps: OdhDocument[];
};

const ApplicationFilters: React.FC<ApplicationFiltersProps> = ({ docApps, categoryApps }) => {
  const navigate = useNavigate();
  const providerFilters = useQueryFilters(APPLICATION_FILTER_KEY);
  const [showAll, setShowAll] = React.useState(false);

  const applications = React.useMemo(() => {
    const allApplications: Record<string, number> = {};
    docApps.forEach((docApp) => {
      if (!docApp.spec.appDisplayName) {
        return;
      }
      allApplications[docApp.spec.appDisplayName] = 0;
    });
    categoryApps.forEach((categoryApp) => {
      if (!categoryApp.spec.appDisplayName) {
        return;
      }
      allApplications[categoryApp.spec.appDisplayName]++;
    });
    return allApplications;
  }, [categoryApps, docApps]);

  const onFilterChange = (docType: string, checked: boolean): void => {
    const updatedQuery = [...providerFilters];
    const index = updatedQuery.indexOf(docType);
    if (checked && index === -1) {
      updatedQuery.push(docType);
    }
    if (!checked && index !== -1) {
      updatedQuery.splice(index, 1);
    }

    if (!updatedQuery.length) {
      removeQueryArgument(navigate, APPLICATION_FILTER_KEY);
      return;
    }
    setQueryArgument(navigate, APPLICATION_FILTER_KEY, JSON.stringify(updatedQuery));
  };

  if (!Object.keys(applications).length) {
    return null;
  }

  return (
    <FilterSidePanelCategory
      key="enabled-filter"
      title="Provider"
      onShowAllToggle={() => setShowAll(!showAll)}
      showAll={showAll}
    >
      {Object.keys(applications)
        .toSorted((a, b) => a.localeCompare(b))
        .map((application) => (
          <FilterSidePanelCategoryItem
            data-id={application}
            id={application}
            key={application}
            checked={providerFilters.includes(application)}
            onChange={(_, checked) => onFilterChange(application, checked)}
            title={application}
          >
            {`${application} (${applications[application]})`}
          </FilterSidePanelCategoryItem>
        ))}
    </FilterSidePanelCategory>
  );
};

export default ApplicationFilters;
