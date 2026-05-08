import React from 'react';
import { Button, FormGroup } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { NodeSelector } from '@odh-dashboard/dashboard-foundation-frontend/types';
import DashboardHelpTooltip from '@odh-dashboard/dashboard-foundation-frontend/concepts/dashboard/DashboardHelpTooltip.tsx';
import ManageNodeSelectorModal from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeSelector/ManageNodeSelectorModal';
import NodeSelectorTable from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeSelector/NodeSelectorTable';
import { ManageHardwareProfileSectionTitles } from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/const';
import { ManageHardwareProfileSectionID } from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/manage/types';
import { HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP } from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeResource/const.ts';

type ManageNodeSelectorSectionProps = {
  nodeSelector: NodeSelector;
  setNodeSelector: (nodeSelector: NodeSelector) => void;
};

const ManageNodeSelectorSection: React.FC<ManageNodeSelectorSectionProps> = ({
  nodeSelector,
  setNodeSelector,
}) => {
  const [isNodeSelectorModalOpen, setIsNodeSelectorModalOpen] = React.useState<boolean>(false);
  const isEmpty = Object.keys(nodeSelector).length === 0;
  return (
    <>
      <FormGroup
        isInline
        label={ManageHardwareProfileSectionTitles[ManageHardwareProfileSectionID.NODE_SELECTORS]}
        fieldId={ManageHardwareProfileSectionID.NODE_SELECTORS}
        labelHelp={
          <DashboardHelpTooltip content={HARDWARE_PROFILE_RESOURCE_ALLOCATION_HELP.nodeSelectors} />
        }
      >
        {!isEmpty && (
          <Button
            variant="secondary"
            onClick={() => setIsNodeSelectorModalOpen(true)}
            data-testid="add-node-selector-button"
          >
            Add node selector
          </Button>
        )}
        {!isEmpty && (
          <NodeSelectorTable
            nodeSelector={nodeSelector}
            onUpdate={(newNodeSelector) => setNodeSelector(newNodeSelector)}
          />
        )}
        {isNodeSelectorModalOpen && (
          <ManageNodeSelectorModal
            onClose={() => setIsNodeSelectorModalOpen(false)}
            onSave={(ns) => setNodeSelector({ ...nodeSelector, [ns.key]: ns.value })}
          />
        )}
        {isEmpty && (
          <Button
            isInline
            icon={<AddCircleOIcon />}
            variant="link"
            onClick={() => setIsNodeSelectorModalOpen(true)}
            data-testid="add-node-selector-button"
          >
            Add node selector
          </Button>
        )}
      </FormGroup>
    </>
  );
};

export default ManageNodeSelectorSection;
