import { EventKind } from '#~/k8sTypes';

export const getEventTimestamp = (event: EventKind): string =>
  event.lastTimestamp || event.eventTime;

export const getEventFullMessage = (event: EventKind): string =>
  `${getEventTimestamp(event)} [${event.reason}] [${event.type}] ${event.message}`;
