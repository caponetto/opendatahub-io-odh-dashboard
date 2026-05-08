import * as React from 'react';
import { Button } from '@patternfly/react-core';
import PipelineImportModal from '@odh-dashboard/pipelines/concepts/content/import/PipelineImportModal';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import { PipelineKF } from '@odh-dashboard/pipelines/concepts/kfTypes';

type ImportPipelineButtonProps = {
  onCreate?: (pipeline: PipelineKF) => void;
  redirectAfterImport?: boolean;
} & Omit<React.ComponentProps<typeof Button>, 'onClick'>;

const ImportPipelineButton: React.FC<ImportPipelineButtonProps> = ({
  onCreate,
  children,
  redirectAfterImport,
  ...buttonProps
}) => {
  const { apiAvailable, refreshAllAPI, pipelinesServer } = usePipelinesAPI();
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button
        data-testid="import-pipeline-button"
        {...buttonProps}
        isDisabled={!apiAvailable || buttonProps.isDisabled || !pipelinesServer.compatible}
        onClick={() => setOpen(true)}
      >
        {children || 'Import pipeline'}
      </Button>
      {open ? (
        <PipelineImportModal
          redirectAfterImport={redirectAfterImport}
          onClose={(pipeline) => {
            setOpen(false);
            if (pipeline) {
              if (onCreate) {
                onCreate(pipeline);
              }
              refreshAllAPI();
            }
          }}
        />
      ) : null}
    </>
  );
};

export default ImportPipelineButton;
