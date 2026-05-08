import * as React from 'react';
import { TextInput, ToolbarItem } from '@patternfly/react-core';
import DashboardDatePicker from '@odh-dashboard/dashboard-foundation-frontend/components/DashboardDatePicker';
import SimpleMenuActions from '@odh-dashboard/dashboard-foundation-frontend/components/SimpleMenuActions';
import PipelineFilterBar from '@odh-dashboard/pipelines/concepts/content/tables/PipelineFilterBar';
import { FilterOptions } from '@odh-dashboard/pipelines/concepts/content/tables/usePipelineFilter';
import ImportPipelineSplitButton from '@odh-dashboard/pipelines/concepts/content/import/ImportPipelineSplitButton';
import DeletePipelinesModal from '@odh-dashboard/pipelines/concepts/content/DeletePipelinesModal';
import { PipelineAndVersionContext } from '@odh-dashboard/pipelines/concepts/content/PipelineAndVersionContext';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';

const options = {
  [FilterOptions.NAME]: 'Pipeline name',
  [FilterOptions.CREATED_AT]: 'Created after',
};

type GlobalPipelinesTableToolbarProps = Pick<
  React.ComponentProps<typeof PipelineFilterBar>,
  'filterData' | 'onFilterUpdate'
>;

const GlobalPipelinesTableToolbar: React.FC<GlobalPipelinesTableToolbarProps> = ({
  filterData,
  onFilterUpdate,
}) => {
  const { refreshAllAPI } = usePipelinesAPI();
  const { getResourcesForDeletion, clearAfterDeletion } =
    React.useContext(PipelineAndVersionContext);
  const { pipelines, versions } = getResourcesForDeletion();
  const [isDeletionOpen, setDeletionOpen] = React.useState(false);

  return (
    <>
      <PipelineFilterBar<keyof typeof options>
        filterOptions={options}
        filterOptionRenders={{
          [FilterOptions.NAME]: ({ onChange, ...props }) => (
            <TextInput
              {...props}
              onChange={(e, value) => onChange(value)}
              aria-label="Search for a pipeline name"
              placeholder="Name"
            />
          ),
          [FilterOptions.CREATED_AT]: ({ onChange, ...props }) => (
            <DashboardDatePicker
              {...props}
              hideError
              aria-label="Select a creation date"
              onChange={(event, value, date) => {
                if (date || !value) {
                  onChange(value);
                }
              }}
            />
          ),
        }}
        filterData={filterData}
        onFilterUpdate={onFilterUpdate}
      >
        <ToolbarItem>
          <ImportPipelineSplitButton />
        </ToolbarItem>
        <ToolbarItem>
          <SimpleMenuActions
            testId="global-pipelines-kebab-actions"
            dropdownItems={[
              {
                key: 'delete',
                label: 'Delete',
                onClick: () => setDeletionOpen(true),
                isDisabled: pipelines.length === 0 && versions.length === 0,
              },
            ]}
          />
        </ToolbarItem>
      </PipelineFilterBar>
      {isDeletionOpen ? (
        <DeletePipelinesModal
          toDeletePipelines={pipelines}
          toDeletePipelineVersions={versions}
          onClose={(deleted) => {
            if (deleted) {
              refreshAllAPI();
              clearAfterDeletion();
            }
            setDeletionOpen(false);
          }}
        />
      ) : null}
    </>
  );
};

export default GlobalPipelinesTableToolbar;
