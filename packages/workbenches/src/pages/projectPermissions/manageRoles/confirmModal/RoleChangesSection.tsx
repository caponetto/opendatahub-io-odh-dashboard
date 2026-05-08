import * as React from 'react';
import {
  ExpandableSection,
  Flex,
  FlexItem,
  Icon,
  List,
  ListItem,
  Tooltip,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { getRoleRefKey } from '@odh-dashboard/dashboard-foundation-frontend/concepts/permissions/utils';
import { ODH_PRODUCT_NAME } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import type { ManageRolesRow } from '@odh-dashboard/workbenches/pages/projectPermissions/manageRoles/columns';
import { isAiRole } from '@odh-dashboard/workbenches/pages/projectPermissions/utils';
import RoleLabel from '@odh-dashboard/workbenches/pages/projectPermissions/components/RoleLabel';

type RoleChangesSectionProps = {
  label: string;
  rows: ManageRolesRow[];
  testId: string;
};

const RoleChangesSection: React.FC<RoleChangesSectionProps> = ({ label, rows, testId }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  return (
    <ExpandableSection
      toggleContent={label}
      isExpanded={isExpanded}
      onToggle={(_event, expanded) => setIsExpanded(expanded)}
      data-testid={testId}
      isIndented
    >
      <List>
        {rows.map((row) => (
          <ListItem key={getRoleRefKey(row.roleRef)}>
            <Flex
              alignItems={{ default: 'alignItemsCenter' }}
              spaceItems={{ default: 'spaceItemsSm' }}
            >
              <FlexItem>{row.displayName}</FlexItem>
              <FlexItem>
                <RoleLabel roleRef={row.roleRef} role={row.role} isCompact />
              </FlexItem>
              {!isAiRole(row.roleRef, row.role) && (
                <FlexItem>
                  <Tooltip content={`Cannot be reassigned in ${ODH_PRODUCT_NAME}`}>
                    <Icon status="danger" size="sm">
                      <ExclamationCircleIcon />
                    </Icon>
                  </Tooltip>
                </FlexItem>
              )}
            </Flex>
          </ListItem>
        ))}
      </List>
    </ExpandableSection>
  );
};

export default RoleChangesSection;
