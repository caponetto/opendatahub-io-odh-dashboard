import React, { useState, type FC } from 'react';
import { Dropdown, DropdownItem, DropdownList, MenuToggle } from '@patternfly/react-core';

export type UserMenuProps = {
  /** The authenticated user's display name; falls back to a generic label when absent. */
  userName?: string;
  /** Called when the user selects the sign-out action; the host owns the navigation. */
  onSignOut: () => void;
};

/** Generic label when no user name is provided. */
const FALLBACK_USER_NAME = 'User';

/**
 * Presentational user menu: shows the resolved identity and a sign-out action.
 * Callers provide the identity source and the sign-out behavior.
 */
const UserMenu: FC<UserMenuProps> = ({ userName, onSignOut }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dropdown
      popperProps={{ position: 'right' }}
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="User menu"
          data-testid="user-menu-toggle"
          onClick={() => setIsOpen((prev) => !prev)}
          isExpanded={isOpen}
        >
          {userName ?? FALLBACK_USER_NAME}
        </MenuToggle>
      )}
    >
      <DropdownList>
        <DropdownItem key="logout" data-testid="user-menu-logout" onClick={onSignOut}>
          Log out
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

export default UserMenu;
