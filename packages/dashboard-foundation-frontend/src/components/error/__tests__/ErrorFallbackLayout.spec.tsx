import * as React from 'react';
import { act } from 'react';
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import ErrorFallbackLayout from '#~/components/error/ErrorFallbackLayout';
import { reloadWindow } from '#~/utilities/windowUtils';

jest.mock('#~/utilities/windowUtils', () => ({
  reloadWindow: jest.fn(),
}));

describe('ErrorFallbackLayout', () => {
  const reloadMock = jest.mocked(reloadWindow);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should reload the page when reload link is clicked', () => {
    render(<ErrorFallbackLayout />);

    const reloadButton = screen.getByTestId('reload-link');
    act(() => reloadButton.click());

    expect(reloadMock).toHaveBeenCalled();
  });

  it('should render and handle close button when onClose is provided', () => {
    const onClose = jest.fn();

    render(
      <ErrorFallbackLayout onClose={onClose}>
        <div>details</div>
      </ErrorFallbackLayout>,
    );

    expect(screen.getByText('details')).toBeInTheDocument();
    const closeButton = screen.getByTestId('close-error-button');
    act(() => closeButton.click());

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('should not render close button when onClose is not provided', () => {
    render(<ErrorFallbackLayout />);

    expect(screen.queryByTestId('close-error-button')).not.toBeInTheDocument();
  });
});
