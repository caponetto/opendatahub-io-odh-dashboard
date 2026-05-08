import React from 'react';
import { FormSection, Flex, FlexItem, Button, Alert, AlertVariant } from '@patternfly/react-core';
import { AddCircleOIcon } from '@patternfly/react-icons';
import { useSearchParams } from 'react-router-dom';
import { Identifier } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { hasCPUandMemory } from '@odh-dashboard/hardware-profiles-shared/concepts/hardwareProfiles/pages/utils';
import NodeResourceTable from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeResource/NodeResourceTable';
import ManageNodeResourceModal from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeResource/ManageNodeResourceModal';
import {
  ManageHardwareProfileSectionTitles,
  CPU_MEMORY_MISSING_WARNING,
} from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/const';
import { ManageHardwareProfileSectionID } from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/manage/types';
import { EMPTY_IDENTIFIER } from '@odh-dashboard/hardware-profiles/pages/hardwareProfiles/nodeResource/const';

type ManageNodeResourceSectionProps = {
  nodeResources: Identifier[];
  setNodeResources: (identifiers: Identifier[]) => void;
};

const ManageNodeResourceSection: React.FC<ManageNodeResourceSectionProps> = ({
  nodeResources,
  setNodeResources,
}) => {
  const [searchParams] = useSearchParams();
  const identifiersString = searchParams.get('identifiers');

  const nodeResourcesFromSearchURL = React.useMemo(
    () =>
      identifiersString
        ? identifiersString
            .split(',')
            .map((identifier) => ({ ...EMPTY_IDENTIFIER, displayName: identifier, identifier }))
        : [],
    [identifiersString],
  );

  React.useEffect(() => {
    setNodeResources([...nodeResources, ...nodeResourcesFromSearchURL]);
    // we only want this hook to trigger once based on the change in the search params
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeResourcesFromSearchURL]);

  const [isNodeResourceModalOpen, setIsNodeResourceModalOpen] = React.useState<boolean>(false);
  const isEmpty = nodeResources.length === 0;
  return (
    <>
      <FormSection
        title={
          <Flex>
            <FlexItem>
              {ManageHardwareProfileSectionTitles[ManageHardwareProfileSectionID.IDENTIFIERS]}
            </FlexItem>
            {!isEmpty && (
              <FlexItem>
                <Button
                  variant="secondary"
                  onClick={() => setIsNodeResourceModalOpen(true)}
                  data-testid="add-node-resource-button"
                >
                  Add resource
                </Button>
              </FlexItem>
            )}
          </Flex>
        }
      >
        Every hardware profile is highly recommended to include CPU and memory resources. Additional
        resources, such as GPUs, can be added here, too.
        {!hasCPUandMemory(nodeResources) && (
          <Alert
            title="Missing CPU or Memory node resources"
            isInline
            variant={AlertVariant.warning}
            data-testid="node-resource-table-alert"
          >
            {CPU_MEMORY_MISSING_WARNING}
          </Alert>
        )}
        {!isEmpty && (
          <NodeResourceTable
            nodeResources={nodeResources}
            onUpdate={(newResources) => setNodeResources(newResources)}
          />
        )}
      </FormSection>
      {isNodeResourceModalOpen && (
        <ManageNodeResourceModal
          onClose={() => setIsNodeResourceModalOpen(false)}
          onSave={(identifier) => setNodeResources([...nodeResources, identifier])}
          nodeResources={nodeResources}
        />
      )}
      {isEmpty && (
        <Button
          isInline
          icon={<AddCircleOIcon />}
          variant="link"
          onClick={() => setIsNodeResourceModalOpen(true)}
          data-testid="add-node-resource-button"
        >
          Add node resource
        </Button>
      )}
    </>
  );
};

export default ManageNodeResourceSection;
