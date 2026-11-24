import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FC,
  type PropsWithChildren,
  type ReactNode,
} from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertActionLink,
  AlertGroup,
  AlertVariant,
} from '@patternfly/react-core';
import {
  NotificationContext,
  type NotificationAction,
  type NotificationAPI,
} from './NotificationContext';
import { NotificationWatcherContextProvider } from './NotificationWatcherContext';

type NotificationVariant = keyof NotificationAPI;

type HostedNotification = {
  id: number;
  variant: NotificationVariant;
  title: string;
  message?: ReactNode;
  actions?: NotificationAction[];
};

/** Mirrors the legacy toast timeout: auto-dismiss after 8s unless hovered. */
const TOAST_TIMEOUT_MS = 8_000;

const variantToAlertVariant: Record<NotificationVariant, AlertVariant> = {
  success: AlertVariant.success,
  error: AlertVariant.danger,
  info: AlertVariant.info,
  warning: AlertVariant.warning,
};

type ToastProps = {
  notification: HostedNotification;
  onDismiss: (id: number) => void;
};

const Toast: FC<ToastProps> = ({ notification, onDismiss }) => {
  const [timedOut, setTimedOut] = useState(false);
  const [mouseOver, setMouseOver] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => setTimedOut(true), TOAST_TIMEOUT_MS);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    if (timedOut && !mouseOver) {
      onDismiss(notification.id);
    }
  }, [timedOut, mouseOver, onDismiss, notification.id]);

  return (
    <Alert
      data-testid="toast-notification-alert"
      variant={variantToAlertVariant[notification.variant]}
      title={notification.title}
      actionClose={<AlertActionCloseButton onClose={() => onDismiss(notification.id)} />}
      actionLinks={
        notification.actions ? (
          <>
            {notification.actions.map((action) => (
              <AlertActionLink key={action.title} onClick={action.onClick}>
                {action.title}
              </AlertActionLink>
            ))}
          </>
        ) : undefined
      }
      onMouseEnter={() => setMouseOver(true)}
      onMouseLeave={() => setMouseOver(false)}
    >
      {notification.message}
    </Alert>
  );
};

/**
 * A visible toast surface implementing the NotificationAPI contract, with the
 * watcher provider mounted so polling consumers can register callbacks.
 * Without a host like this, notifications are silently swallowed.
 */
const ToastNotificationProvider: FC<PropsWithChildren> = ({ children }) => {
  const [notifications, setNotifications] = useState<HostedNotification[]>([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setNotifications((previous) => previous.filter((notification) => notification.id !== id));
  }, []);

  const api = useMemo<NotificationAPI>(() => {
    const emit =
      (variant: NotificationVariant) =>
      (title: string, message?: ReactNode, actions?: NotificationAction[]): void => {
        const id = nextIdRef.current++;
        setNotifications((previous) => [...previous, { id, variant, title, message, actions }]);
      };
    return {
      success: emit('success'),
      error: emit('error'),
      info: emit('info'),
      warning: emit('warning'),
    };
  }, []);

  return (
    <NotificationContext.Provider value={api}>
      <NotificationWatcherContextProvider>
        {children}
        <AlertGroup isToast isLiveRegion data-testid="toast-notification-group">
          {notifications.map((notification) => (
            <Toast key={notification.id} notification={notification} onDismiss={dismiss} />
          ))}
        </AlertGroup>
      </NotificationWatcherContextProvider>
    </NotificationContext.Provider>
  );
};

export default ToastNotificationProvider;
