import React from 'react';
import { render, screen } from '@testing-library/react';
import { useBootstrapState } from '../../context/AppBootstrapProvider';
import RhaiiUserMenu, { SIGN_OUT_PATH } from '../RhaiiUserMenu';

jest.mock('../../context/AppBootstrapProvider', () => ({
  useBootstrapState: jest.fn(),
}));

const mockUseBootstrapState = jest.mocked(useBootstrapState);

describe('RhaiiUserMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseBootstrapState.mockReturnValue({
      namespace: 'rhaii-operator',
      userName: 'dev@redhat.com',
      capabilities: { llmdServing: true, kServe: true },
    });
  });

  it('should sign out through the gateway-supported endpoint', () => {
    expect(SIGN_OUT_PATH).toBe('/oauth2/sign_out?rd=%2F');
  });

  it('should show the user name resolved by the bootstrap', () => {
    render(<RhaiiUserMenu />);

    expect(screen.getByTestId('user-menu-toggle')).toHaveTextContent('dev@redhat.com');
  });

  it('should fall back to a generic label when the status omitted the user name', () => {
    mockUseBootstrapState.mockReturnValue({
      namespace: 'rhaii-operator',
      userName: undefined,
      capabilities: { llmdServing: true, kServe: true },
    });

    render(<RhaiiUserMenu />);

    expect(screen.getByTestId('user-menu-toggle')).toHaveTextContent('User');
  });

  it('should render the sign-out action', () => {
    render(<RhaiiUserMenu />);

    expect(screen.getByTestId('user-menu-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu-toggle')).toHaveTextContent('dev@redhat.com');
  });
});
