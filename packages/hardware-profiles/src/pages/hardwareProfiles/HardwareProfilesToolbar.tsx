import React from 'react';
import { Button, SearchInput, ToolbarGroup, ToolbarItem } from '@patternfly/react-core';
import { Link } from 'react-router-dom';
import FilterToolbar from '@odh-dashboard/dashboard-foundation-frontend/components/FilterToolbar';
import SimpleSelect, {
  SimpleSelectOption,
} from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleSelect';
import {
  AccessAllowed,
  verbModelAccess,
} from '@odh-dashboard/dashboard-foundation-frontend/concepts/userSSAR';
import { HardwareProfileModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/odh';
import { HardwareProfileFeatureVisibility } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import {
  HardwareProfileEnableType,
  HardwareProfileFilterDataType,
  HardwareProfileFilterOptions,
  hardwareProfileFilterOptions,
} from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/const';
import { HardwareProfileFeatureVisibilityTitles } from './manage/const';

type HardwareProfilesToolbarProps = {
  filterData: HardwareProfileFilterDataType;
  onFilterUpdate: (key: string, value?: string | { label: string; value: string }) => void;
};

const HardwareProfilesToolbar: React.FC<HardwareProfilesToolbarProps> = ({
  filterData,
  onFilterUpdate,
}) => {
  return (
    <FilterToolbar<keyof typeof hardwareProfileFilterOptions>
      data-testid="hardware-profiles-table-toolbar"
      filterOptions={hardwareProfileFilterOptions}
      filterOptionRenders={{
        [HardwareProfileFilterOptions.name]: ({ onChange, ...props }) => (
          <SearchInput
            {...props}
            aria-label="Filter by name"
            placeholder="Filter by name"
            onChange={(_event, value) => onChange(value)}
          />
        ),
        [HardwareProfileFilterOptions.enabled]: ({ value, onChange, ...props }) => (
          <SimpleSelect
            {...props}
            dataTestId="hardware-profile-filter-enable-select"
            value={value}
            aria-label="Hardware profile enablement"
            options={Object.values(HardwareProfileEnableType).map((v) => ({
              key: v,
              label: v,
            }))}
            onChange={(v) => onChange(v)}
            popperProps={{ maxWidth: undefined }}
          />
        ),
        [HardwareProfileFilterOptions.visibility]: ({ value, onChange, ...props }) => (
          <SimpleSelect
            {...props}
            dataTestId="hardware-profile-filter-use-cases-select"
            value={value}
            aria-label="Hardware profile use cases"
            options={Object.values(HardwareProfileFeatureVisibility).map(
              (v): SimpleSelectOption => ({
                key: v,
                label: HardwareProfileFeatureVisibilityTitles[v],
              }),
            )}
            onChange={(v) => onChange(v)}
            popperProps={{ maxWidth: undefined }}
          />
        ),
      }}
      filterData={filterData}
      onFilterUpdate={onFilterUpdate}
    >
      <AccessAllowed resourceAttributes={verbModelAccess('create', HardwareProfileModel)}>
        {() => (
          <ToolbarGroup>
            <ToolbarItem>
              <Button
                data-testid="create-hardware-profile"
                component={(props: React.ComponentProps<'a'>) => (
                  <Link {...props} to="/settings/environment-setup/hardware-profiles/create" />
                )}
              >
                Create hardware profile
              </Button>
            </ToolbarItem>
          </ToolbarGroup>
        )}
      </AccessAllowed>
    </FilterToolbar>
  );
};

export default HardwareProfilesToolbar;
