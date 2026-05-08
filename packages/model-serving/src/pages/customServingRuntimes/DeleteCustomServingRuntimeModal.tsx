import * as React from 'react';
import DeleteModal from '@odh-dashboard/dashboard-foundation-frontend/components/DeleteModal';
import { TemplateKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useDashboardNamespace } from '@odh-dashboard/dashboard-foundation-frontend/redux/selectors';
import { patchDashboardConfigTemplateDisablementBackend } from '@odh-dashboard/model-serving-shared/services/dashboardService';
import {
  getServingRuntimeDisplayNameFromTemplate,
  getTemplateEnabled,
  setListDisabled,
} from './utils';
import { CustomServingRuntimeContext } from './CustomServingRuntimeContext';
import { deleteTemplateBackend } from '../../services/templateService';

type DeleteCustomServingRuntimeModalProps = {
  template: TemplateKind;
  onClose: (deleted: boolean) => void;
};

const DeleteCustomServingRuntimeModal: React.FC<DeleteCustomServingRuntimeModalProps> = ({
  template,
  onClose,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState<Error | undefined>();

  const {
    servingRuntimeTemplateDisablement: { data: templateDisablement },
    servingRuntimeTemplates: [templates],
  } = React.useContext(CustomServingRuntimeContext);
  const safeTemplates = React.useMemo(() => templates ?? [], [templates]);

  const { dashboardNamespace } = useDashboardNamespace();

  const onBeforeClose = (deleted: boolean) => {
    onClose(deleted);
    setIsDeleting(false);
    setError(undefined);
  };

  const deleteName = getServingRuntimeDisplayNameFromTemplate(template);

  return (
    <DeleteModal
      title="Delete serving runtime?"
      onClose={() => onBeforeClose(false)}
      submitButtonLabel="Delete serving runtime"
      onDelete={() => {
        setIsDeleting(true);
        // TODO: Revert back to pass through api once we migrate admin panel
        const templateDisablemetUpdated = setListDisabled(
          template,
          safeTemplates,
          templateDisablement,
          false,
        );
        Promise.all([
          ...(!getTemplateEnabled(template, templateDisablement)
            ? [
                patchDashboardConfigTemplateDisablementBackend(
                  templateDisablemetUpdated,
                  dashboardNamespace,
                ),
              ]
            : []),
          deleteTemplateBackend(template.metadata.name, template.metadata.namespace),
        ])
          .then(() => {
            onBeforeClose(true);
          })
          .catch((e) => {
            setError(e);
            setIsDeleting(false);
          });
      }}
      deleting={isDeleting}
      error={error}
      deleteName={deleteName}
    >
      This action cannot be undone. Models already deployed using this runtime will not be affected
      by this action.
    </DeleteModal>
  );
};

export default DeleteCustomServingRuntimeModal;
