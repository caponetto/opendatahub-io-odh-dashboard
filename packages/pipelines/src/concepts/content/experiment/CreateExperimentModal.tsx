import * as React from 'react';
import {
  Alert,
  Button,
  Form,
  FormGroup,
  HelperText,
  HelperTextItem,
  Stack,
  StackItem,
  TextInput,
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
} from '@patternfly/react-core';
import { getDisplayNameFromK8sResource } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/utils';
import { CharLimitHelperText } from '@odh-dashboard/dashboard-foundation-frontend/components/CharLimitHelperText';
import { fireFormTrackingEvent } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/segmentIOUtils';
import { TrackingOutcome } from '@odh-dashboard/dashboard-foundation-frontend/concepts/analyticsTracking/trackingProperties';
import { usePipelinesAPI } from '@odh-dashboard/pipelines/concepts/context';
import useCreateExperimentData from '@odh-dashboard/pipelines/concepts/content/experiment/useCreateExperimentData';
import { ExperimentKF } from '@odh-dashboard/pipelines/concepts/kfTypes';
import {
  DESCRIPTION_CHARACTER_LIMIT,
  NAME_CHARACTER_LIMIT,
} from '@odh-dashboard/pipelines/concepts/content/const';

type CreateExperimentModalProps = {
  onClose: (experiment?: ExperimentKF) => void;
  existingNames?: string[];
};

const eventName = 'Run Group Created';
const CreateExperimentModal: React.FC<CreateExperimentModalProps> = ({
  onClose,
  existingNames = [],
}) => {
  const { project, api, apiAvailable } = usePipelinesAPI();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();
  const [{ name, description }, setData, resetData] = useCreateExperimentData();

  const isDuplicate = existingNames.some(
    (existing) => existing.toLowerCase() === name.trim().toLowerCase(),
  );
  const haveEnoughData = !!name && !isDuplicate;

  const onBeforeClose = (experiment?: ExperimentKF) => {
    onClose(experiment);
    if (!experiment) {
      fireFormTrackingEvent(eventName, { outcome: TrackingOutcome.cancel });
    }
    setSubmitting(false);
    setError(undefined);
    resetData();
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        onBeforeClose();
      }}
      variant="small"
    >
      <ModalHeader title="Create run group" />
      <ModalBody>
        <Form>
          <Stack hasGutter>
            <StackItem>
              <FormGroup label="Project" fieldId="project-name">
                {getDisplayNameFromK8sResource(project)}
              </FormGroup>
            </StackItem>
            <StackItem>
              <FormGroup label="Run group name" isRequired fieldId="experiment-name">
                <TextInput
                  isRequired
                  type="text"
                  id="experiment-name"
                  name="experiment-name"
                  value={name}
                  validated={isDuplicate ? 'error' : 'default'}
                  onChange={(_, value) => setData('name', value)}
                  maxLength={NAME_CHARACTER_LIMIT}
                />
                {isDuplicate ? (
                  <HelperText>
                    <HelperTextItem variant="error">
                      A run group with this name already exists.
                    </HelperTextItem>
                  </HelperText>
                ) : (
                  <CharLimitHelperText limit={NAME_CHARACTER_LIMIT} currentLength={name.length} />
                )}
              </FormGroup>
            </StackItem>
            <StackItem>
              <FormGroup label="Description" fieldId="experiment-description">
                <TextInput
                  isRequired
                  type="text"
                  id="experiment-description"
                  name="experiment-description"
                  value={description}
                  onChange={(_, value) => setData('description', value)}
                  maxLength={DESCRIPTION_CHARACTER_LIMIT}
                />

                <CharLimitHelperText
                  limit={DESCRIPTION_CHARACTER_LIMIT}
                  currentLength={description.length}
                />
              </FormGroup>
            </StackItem>
            {error && (
              <StackItem>
                <Alert title="Error creating run group" isInline variant="danger">
                  {error.message}
                </Alert>
              </StackItem>
            )}
          </Stack>
        </Form>
      </ModalBody>
      <ModalFooter>
        <Button
          key="create-button"
          variant="primary"
          isDisabled={!apiAvailable || submitting || !haveEnoughData}
          onClick={() => {
            setSubmitting(true);
            setError(undefined);
            api
              // eslint-disable-next-line camelcase
              .createExperiment({}, { display_name: name, description })
              .then((experiment) => {
                fireFormTrackingEvent(eventName, {
                  outcome: TrackingOutcome.submit,
                  success: true,
                });
                onBeforeClose(experiment);
              })
              .catch((e) => {
                setSubmitting(false);
                setError(e);
                fireFormTrackingEvent(eventName, {
                  outcome: TrackingOutcome.submit,
                  success: false,
                  error: e,
                });
              });
          }}
        >
          Create run group
        </Button>
        <Button key="cancel-button" variant="secondary" onClick={() => onBeforeClose()}>
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CreateExperimentModal;
