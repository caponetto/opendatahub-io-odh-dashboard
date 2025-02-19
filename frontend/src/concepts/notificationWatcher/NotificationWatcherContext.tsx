import * as React from 'react';
import { AppNotification } from '~/redux/types';
import useNotification from '~/utilities/useNotification';
import { POLL_INTERVAL } from '~/utilities/const';

export type NotificationWatcherContextType = {
  registerNotification: (item: NotificationWatcherItem) => void;
};

type NotificationWatcherContextProviderProps = {
  children: React.ReactNode;
};

export type FinalNotificationWatcherResponse =
  | ({ status: 'success' | 'error' } & Pick<AppNotification, 'title' | 'message' | 'actions'>)
  | { status: 'stop' };

export type RepollNotificationWatcherResponse = { status: 'repoll' };

export type NotificationWatcherResponse =
  | FinalNotificationWatcherResponse
  | RepollNotificationWatcherResponse;

export type NotificationWatcherCallback = (
  signal: AbortSignal,
) => Promise<NotificationWatcherResponse>;

export type NotificationWatcherItem = {
  callbackDelay?: number;
  callback: NotificationWatcherCallback;
};

export const NotificationWatcherContext = React.createContext<NotificationWatcherContextType>({
  registerNotification: () => undefined,
});

export const NotificationWatcherContextProvider: React.FC<
  NotificationWatcherContextProviderProps
> = ({ children }) => {
  const notification = useNotification();
  const abortControllersMapRef = React.useRef(new Map<NotificationWatcherItem, AbortController>());
  const timeoutIdsMapRef = React.useRef(
    new Map<NotificationWatcherItem, ReturnType<typeof setTimeout>>(),
  );

  const invoke = React.useCallback(
    async (itemToInvoke: NotificationWatcherItem, signal: AbortSignal) => {
      const callbackDelay = itemToInvoke.callbackDelay ?? POLL_INTERVAL;

      const timeoutId = setTimeout(async () => {
        timeoutIdsMapRef.current.delete(itemToInvoke);
        const response = await itemToInvoke.callback(signal);

        if (response.status !== 'repoll') {
          abortControllersMapRef.current.delete(itemToInvoke);
        }

        if (signal.aborted) {
          return;
        }

        switch (response.status) {
          case 'success':
            notification.success(response.title, response.message, response.actions);
            break;
          case 'error':
            notification.error(response.title, response.message, response.actions);
            break;
          case 'repoll':
            await invoke(itemToInvoke, signal);
            break;
          case 'stop':
            // Do nothing more
            break;
        }
      }, callbackDelay);

      timeoutIdsMapRef.current.set(itemToInvoke, timeoutId);
    },
    [notification],
  );

  React.useEffect(
    () => () => {
      timeoutIdsMapRef.current.forEach(clearTimeout);
      timeoutIdsMapRef.current.clear();

      abortControllersMapRef.current.forEach((abortController) => abortController.abort());
      abortControllersMapRef.current.clear();
    },
    [],
  );

  const registerNotification = React.useCallback(
    (item: NotificationWatcherItem): void => {
      const abortController = new AbortController();
      abortControllersMapRef.current.set(item, abortController);
      invoke(item, abortController.signal);
    },
    [invoke],
  );

  const contextValue = React.useMemo(() => ({ registerNotification }), [registerNotification]);

  return (
    <NotificationWatcherContext.Provider value={contextValue}>
      {children}
    </NotificationWatcherContext.Provider>
  );
};
