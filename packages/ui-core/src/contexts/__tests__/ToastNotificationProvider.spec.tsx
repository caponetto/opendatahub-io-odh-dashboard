import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  NotificationResponseStatus,
  NotificationWatcherContext,
  type NotificationWatcherResponse,
} from '../NotificationWatcherContext';
import { useNotification } from '../NotificationContext';
import ToastNotificationProvider from '../ToastNotificationProvider';

const Emitter: React.FC = () => {
  const notification = useNotification();
  return (
    <>
      <button
        data-testid="emit-error"
        onClick={() =>
          notification.error('Model deployment failed', 'Check the model configuration.', [
            { title: 'View deployment', onClick: () => undefined },
          ])
        }
      >
        emit error
      </button>
      <button data-testid="emit-success" onClick={() => notification.success('Deployed')}>
        emit success
      </button>
    </>
  );
};

const WatcherRegistration: React.FC<{ responses: NotificationWatcherResponse[] }> = ({
  responses,
}) => {
  const { registerNotification } = React.useContext(NotificationWatcherContext);
  React.useEffect(() => {
    let call = 0;
    registerNotification({
      callbackDelay: 10,
      callback: async () => responses[Math.min(call++, responses.length - 1)],
    });
    // Register once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

describe('ToastNotificationProvider', () => {
  it('should render a visible toast for an emitted error with its action', () => {
    render(
      <ToastNotificationProvider>
        <Emitter />
      </ToastNotificationProvider>,
    );

    fireEvent.click(screen.getByTestId('emit-error'));

    expect(screen.getByTestId('toast-notification-group')).toBeInTheDocument();
    const alert = screen.getByTestId('toast-notification-alert');
    expect(alert).toHaveTextContent('Model deployment failed');
    expect(alert).toHaveTextContent('Check the model configuration.');
    expect(screen.getByRole('button', { name: 'View deployment' })).toBeInTheDocument();
  });

  it('should render the success variant for a success emission', () => {
    render(
      <ToastNotificationProvider>
        <Emitter />
      </ToastNotificationProvider>,
    );

    fireEvent.click(screen.getByTestId('emit-success'));

    expect(screen.getByTestId('toast-notification-alert')).toHaveTextContent('Deployed');
  });

  it('should dismiss a toast through its close button', () => {
    render(
      <ToastNotificationProvider>
        <Emitter />
      </ToastNotificationProvider>,
    );

    fireEvent.click(screen.getByTestId('emit-success'));
    fireEvent.click(
      screen.getByTestId('toast-notification-alert').querySelector('button') as HTMLElement,
    );

    expect(screen.queryByTestId('toast-notification-alert')).not.toBeInTheDocument();
  });

  it('should surface a watcher outcome as a visible toast', async () => {
    render(
      <ToastNotificationProvider>
        <WatcherRegistration
          responses={[
            { status: NotificationResponseStatus.SUCCESS, title: 'Model deployment failed' },
          ]}
        />
      </ToastNotificationProvider>,
    );

    await waitFor(() =>
      expect(screen.getByTestId('toast-notification-alert')).toHaveTextContent(
        'Model deployment failed',
      ),
    );
  });

  it('should keep repolling a watcher until it settles', async () => {
    jest.useFakeTimers();
    try {
      render(
        <ToastNotificationProvider>
          <WatcherRegistration
            responses={[
              { status: NotificationResponseStatus.REPOLL },
              { status: NotificationResponseStatus.SUCCESS, title: 'Settled outcome' },
            ]}
          />
        </ToastNotificationProvider>,
      );

      expect(screen.queryByTestId('toast-notification-alert')).not.toBeInTheDocument();
      await act(async () => {
        jest.advanceTimersByTime(20);
      });

      await waitFor(() =>
        expect(screen.getByTestId('toast-notification-alert')).toHaveTextContent('Settled outcome'),
      );
    } finally {
      jest.useRealTimers();
    }
  });

  describe('auto-dismiss', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should auto-dismiss a toast after the timeout', () => {
      render(
        <ToastNotificationProvider>
          <Emitter />
        </ToastNotificationProvider>,
      );

      fireEvent.click(screen.getByTestId('emit-success'));
      expect(screen.getByTestId('toast-notification-alert')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(8_000);
      });

      expect(screen.queryByTestId('toast-notification-alert')).not.toBeInTheDocument();
    });

    it('should keep a hovered toast until the pointer leaves', () => {
      render(
        <ToastNotificationProvider>
          <Emitter />
        </ToastNotificationProvider>,
      );

      fireEvent.click(screen.getByTestId('emit-success'));
      fireEvent.mouseEnter(screen.getByTestId('toast-notification-alert'));
      act(() => {
        jest.advanceTimersByTime(8_000);
      });
      expect(screen.getByTestId('toast-notification-alert')).toBeInTheDocument();

      fireEvent.mouseLeave(screen.getByTestId('toast-notification-alert'));

      expect(screen.queryByTestId('toast-notification-alert')).not.toBeInTheDocument();
    });
  });
});
