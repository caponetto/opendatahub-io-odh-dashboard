import * as React from 'react';
import { useNavigate } from 'react-router-dom';

import { Divider, Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';

import { getDashboardMainContainer } from '@odh-dashboard/dashboard-foundation-frontend/utilities/utils';
import {
  createRecurringRunRoute,
  createRunRoute,
  globalPipelineRecurringRunsVersionRoute,
  globalPipelineRunsVersionRoute,
} from '@odh-dashboard/pipelines/routes/runs';
import { pipelineVersionDetailsRoute } from '@odh-dashboard/pipelines/routes/global';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import PipelineVersionImportModal from '@odh-dashboard/pipelines/concepts/content/import/PipelineVersionImportModal';
import { PipelineKF, PipelineVersionKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import {
  PIPELINE_CREATE_RUN_TOOLTIP_ARGO_ERROR,
  PIPELINE_CREATE_SCHEDULE_TOOLTIP_ARGO_ERROR,
} from '@odh-dashboard/pipelines/concepts/content/const';

type PipelineDetailsActionsProps = {
  onDelete: () => void;
  isPipelineSupported: boolean;
  pipeline: PipelineKF | null;
  pipelineVersion: PipelineVersionKF | null;
};

const PipelineDetailsActions: React.FC<PipelineDetailsActionsProps> = ({
  onDelete,
  isPipelineSupported,
  pipeline,
  pipelineVersion,
}) => {
  const navigate = useNavigate();
  const { namespace, refreshAllAPI } = usePipelinesAPI();
  const [open, setOpen] = React.useState(false);
  const [isVersionImportModalOpen, setIsVersionImportModalOpen] = React.useState(false);

  return (
    <>
      <Dropdown
        onOpenChange={(isOpenChange) => setOpen(isOpenChange)}
        shouldFocusToggleOnSelect
        onSelect={() => setOpen(false)}
        popperProps={{ appendTo: getDashboardMainContainer, position: 'right' }}
        toggle={(toggleRef) => (
          <MenuToggle
            data-testid="pipeline-version-details-actions"
            ref={toggleRef}
            variant="primary"
            aria-label="Actions"
            onClick={() => setOpen(!open)}
            isExpanded={open}
          >
            Actions
          </MenuToggle>
        )}
        isOpen={open}
      >
        <DropdownList>
          {[
            <DropdownItem key="upload-version" onClick={() => setIsVersionImportModalOpen(true)}>
              Upload new version
            </DropdownItem>,
            <Divider component="li" key="separator-create" />,
            <DropdownItem
              isAriaDisabled={!isPipelineSupported}
              tooltipProps={
                !isPipelineSupported
                  ? { content: PIPELINE_CREATE_RUN_TOOLTIP_ARGO_ERROR }
                  : undefined
              }
              key="create-run"
              onClick={() =>
                navigate(createRunRoute(namespace), {
                  state: {
                    contextData: {
                      pipeline,
                      version: pipelineVersion,
                    },
                  },
                })
              }
            >
              Create run
            </DropdownItem>,
            <DropdownItem
              isAriaDisabled={!isPipelineSupported}
              tooltipProps={
                !isPipelineSupported
                  ? { content: PIPELINE_CREATE_SCHEDULE_TOOLTIP_ARGO_ERROR }
                  : undefined
              }
              key="create-schedule"
              onClick={() =>
                navigate(createRecurringRunRoute(namespace), {
                  state: {
                    contextData: {
                      pipeline,
                      version: pipelineVersion,
                    },
                  },
                })
              }
            >
              Create schedule
            </DropdownItem>,
            ...(pipeline && pipelineVersion
              ? [
                  <Divider component="li" key="separator-view" />,
                  <DropdownItem
                    key="view-runs"
                    onClick={() =>
                      navigate(
                        globalPipelineRunsVersionRoute(
                          namespace,
                          pipelineVersion.pipeline_version_id,
                        ),
                      )
                    }
                  >
                    View runs
                  </DropdownItem>,
                  <DropdownItem
                    key="view-schedules"
                    onClick={() =>
                      navigate(
                        globalPipelineRecurringRunsVersionRoute(
                          namespace,
                          pipelineVersion.pipeline_version_id,
                        ),
                      )
                    }
                  >
                    View schedules
                  </DropdownItem>,
                ]
              : []),
            <Divider component="li" key="separator-delete" />,
            <DropdownItem key="delete-pipeline-version" onClick={() => onDelete()}>
              Delete pipeline version
            </DropdownItem>,
          ]}
        </DropdownList>
      </Dropdown>
      {isVersionImportModalOpen && (
        <PipelineVersionImportModal
          existingPipeline={pipeline}
          onClose={(resource) => {
            setIsVersionImportModalOpen(false);
            if (resource) {
              refreshAllAPI();
              navigate(
                pipelineVersionDetailsRoute(
                  namespace,
                  resource.pipeline_id,
                  resource.pipeline_version_id,
                ),
              );
            }
          }}
        />
      )}
    </>
  );
};

export default PipelineDetailsActions;
