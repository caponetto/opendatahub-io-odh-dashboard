import React, { type FC } from 'react';
import UserMenu from '@odh-dashboard/ui-core/components/UserMenu';
import { useBootstrapState } from '../context/AppBootstrapProvider';

/** GET is CSRF-able, but the only impact is an unwanted logout; POST hardening would require oauth2-proxy support. */
export const SIGN_OUT_PATH = `/oauth2/sign_out?rd=${encodeURIComponent('/')}`;

const RhaiiUserMenu: FC = () => {
  const { userName } = useBootstrapState();

  return (
    <UserMenu
      userName={userName}
      onSignOut={() => {
        window.location.href = SIGN_OUT_PATH;
      }}
    />
  );
};

export default RhaiiUserMenu;
