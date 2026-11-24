import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import UserMenu from '../UserMenu';

describe('UserMenu', () => {
  it('should render the provided user name', () => {
    render(<UserMenu userName="dev@redhat.com" onSignOut={jest.fn()} />);

    expect(screen.getByTestId('user-menu-toggle')).toHaveTextContent('dev@redhat.com');
  });

  it('should fall back to a generic label when no user name is provided', () => {
    render(<UserMenu onSignOut={jest.fn()} />);

    expect(screen.getByTestId('user-menu-toggle')).toHaveTextContent('User');
  });

  it('should call onSignOut when the sign-out action is selected', async () => {
    const onSignOut = jest.fn();
    render(<UserMenu userName="dev@redhat.com" onSignOut={onSignOut} />);

    fireEvent.click(screen.getByTestId('user-menu-toggle'));
    fireEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
