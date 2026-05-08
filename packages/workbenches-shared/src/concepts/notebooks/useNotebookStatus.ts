import * as React from 'react';
import {
  AssociatedSteps,
  EventStatus,
  Notebook,
  NotebookProgressStep,
  NotebookStatus,
  OptionalSteps,
  ProgressionStep,
  ProgressionStepTitles,
} from '@odh-dashboard/dashboard-foundation-frontend/types';
import { EventKind, NotebookKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { useWatchNotebookEvents } from '@odh-dashboard/dashboard-foundation-frontend/api/k8s/events';
import { getEventTimestamp } from '@odh-dashboard/dashboard-foundation-frontend/concepts/k8s/EventLog/eventUtils';

const filterEvents = (
  allEvents: EventKind[],
  lastActivity: Date,
): [filterEvents: EventKind[], thisInstanceEvents: EventKind[], gracePeriod: boolean] => {
  const thisInstanceEvents = allEvents.toSorted((a, b) =>
    getEventTimestamp(a).localeCompare(getEventTimestamp(b)),
  );
  if (thisInstanceEvents.length === 0) {
    return [[], [], false];
  }

  let filteredEvents = thisInstanceEvents;

  const now = Date.now();
  let gracePeriod = false;

  const maxCap = new Date(lastActivity).setMinutes(lastActivity.getMinutes() + 20);
  if (now <= maxCap) {
    const infoEvents = filteredEvents.filter((event) => event.type === 'Normal');
    const idleTime = new Date(lastActivity).setSeconds(lastActivity.getSeconds() + 30);
    gracePeriod = idleTime - now > 0;

    if (gracePeriod) {
      filteredEvents = infoEvents;
    }

    const hasScaleUp = infoEvents.some((event) => event.reason === 'TriggeredScaleUp');
    if (hasScaleUp) {
      const hasScaleUpIssueIndex = thisInstanceEvents.findIndex(
        (event) => event.reason === 'NotTriggerScaleUp',
      );
      if (hasScaleUpIssueIndex >= 0) {
        filteredEvents = [thisInstanceEvents[hasScaleUpIssueIndex]];
      } else {
        filteredEvents = infoEvents;
      }
    }
  }

  return [filteredEvents, thisInstanceEvents, gracePeriod];
};

const useLastActivity = (annotationValue?: string): Date | null => {
  const lastOpenActivity = React.useRef<Date | null>(null);

  if (annotationValue && !lastOpenActivity.current) {
    lastOpenActivity.current = new Date(annotationValue);
  }

  return lastOpenActivity.current;
};

export const getNotebookEventStatus = (
  event: EventKind,
  gracePeriod?: boolean,
): NotebookProgressStep => {
  const timestamp = new Date(getEventTimestamp(event)).getTime();

  const isAuthProxyEvent =
    event.message.includes('oauth-proxy') ||
    event.message.includes('ose-oauth-proxy') ||
    event.message.includes('kube-rbac-proxy');

  if (isAuthProxyEvent) {
    switch (event.reason) {
      case 'Pulling':
        return {
          step: ProgressionStep.PULLING_AUTH_PROXY,
          status: EventStatus.SUCCESS,
          timestamp,
        };
      case 'Pulled':
        return {
          step: ProgressionStep.AUTH_PROXY_PULLED,
          status: EventStatus.SUCCESS,
          timestamp,
        };
      case 'Created':
        return {
          step: ProgressionStep.AUTH_PROXY_CONTAINER_CREATED,
          status: EventStatus.SUCCESS,
          timestamp,
        };
      case 'Started':
        return {
          step: ProgressionStep.AUTH_PROXY_CONTAINER_STARTED,
          status: EventStatus.SUCCESS,
          timestamp,
        };
      case 'Killing':
        return {
          step: ProgressionStep.AUTH_PROXY_CONTAINER_STARTED,
          status: EventStatus.WARNING,
          timestamp,
        };
      default:
        if (event.type === 'Warning') {
          return {
            step: ProgressionStep.AUTH_PROXY_CONTAINER_CREATED,
            status: EventStatus.WARNING,
            timestamp,
          };
        }
        return {
          step: ProgressionStep.AUTH_PROXY_CONTAINER_PROBLEM,
          status: EventStatus.WARNING,
          timestamp,
        };
    }
  }

  switch (event.reason) {
    case 'SuccessfulCreate':
      return {
        step: ProgressionStep.POD_CREATED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'Scheduled':
      return {
        step: ProgressionStep.POD_ASSIGNED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'SuccessfulAttachVolume':
      return {
        step: ProgressionStep.PVC_ATTACHED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'AddedInterface':
      return {
        step: ProgressionStep.INTERFACE_ADDED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'Pulling':
      return {
        step: ProgressionStep.PULLING_NOTEBOOK_IMAGE,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'Pulled':
      return {
        step: ProgressionStep.NOTEBOOK_IMAGE_PULLED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'Created':
      return {
        step: ProgressionStep.NOTEBOOK_CONTAINER_CREATED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'Started':
      return {
        step: ProgressionStep.NOTEBOOK_CONTAINER_STARTED,
        status: EventStatus.SUCCESS,
        timestamp,
      };
    case 'NotTriggerScaleUp':
      return {
        step: ProgressionStep.POD_PROBLEM,
        description: 'Failed to scale-up',
        status: EventStatus.ERROR,
        timestamp,
      };
    case 'TriggeredScaleUp':
      return {
        step: ProgressionStep.POD_PROBLEM,
        description: 'Pod triggered scale-up',
        status: EventStatus.INFO,
        timestamp,
      };
    case 'FailedCreate':
      return {
        step: ProgressionStep.POD_PROBLEM,
        description: 'Failed to create pod',
        status: EventStatus.ERROR,
        timestamp,
      };
    default: {
      if (!gracePeriod && event.reason === 'FailedScheduling') {
        return {
          step: ProgressionStep.POD_PROBLEM,
          description: 'Insufficient resources to start',
          status: EventStatus.ERROR,
          timestamp,
        };
      }
      if (!gracePeriod && event.reason === 'BackOff') {
        return {
          step: ProgressionStep.NOTEBOOK_CONTAINER_PROBLEM,
          description: 'ImagePullBackOff',
          status: EventStatus.ERROR,
          timestamp,
        };
      }
      if (event.type === 'Warning') {
        return {
          step: ProgressionStep.NOTEBOOK_CONTAINER_PROBLEM,
          description: 'Issue creating workbench container',
          status: EventStatus.WARNING,
          timestamp,
        };
      }
      return {
        step: ProgressionStep.NOTEBOOK_CONTAINER_PROBLEM,
        description: '',
        status: EventStatus.WARNING,
        timestamp,
      };
    }
  }
};

export const useNotebookStatus = (
  spawnInProgress: boolean,
  notebook: Notebook | NotebookKind | null,
  isNotebookRunning: boolean,
  currentUserNotebookPodUID: string,
): [status: NotebookStatus | null, events: EventKind[]] => {
  const [events] = useWatchNotebookEvents(
    notebook?.metadata.namespace ?? '',
    notebook?.metadata.name ?? '',
    currentUserNotebookPodUID,
  );
  const safeEvents = React.useMemo(() => events ?? [], [events]);

  const lastActivity =
    useLastActivity(notebook?.metadata.annotations?.['notebooks.kubeflow.org/last-activity']) ||
    (notebook && (spawnInProgress || isNotebookRunning)
      ? new Date(notebook.metadata.creationTimestamp ?? 0)
      : null);

  if (!notebook || !lastActivity) {
    return [null, []];
  }

  const [filteredEvents, thisInstanceEvents, gracePeriod] = filterEvents(safeEvents, lastActivity);
  if (filteredEvents.length === 0) {
    return [null, thisInstanceEvents];
  }

  const lastItem = filteredEvents[filteredEvents.length - 1];
  const { step, description, status } = getNotebookEventStatus(lastItem, gracePeriod);

  return [
    {
      currentEvent: description || ProgressionStepTitles[step],
      currentEventReason: lastItem.reason,
      currentEventDescription: lastItem.message,
      currentStatus: status,
    },
    thisInstanceEvents,
  ];
};

const progressionValue = (progressionStep?: ProgressionStep): number => {
  if (!progressionStep) {
    return 0;
  }
  return Object.values(ProgressionStep).indexOf(progressionStep);
};

export const compareProgressSteps = (a: NotebookProgressStep, b: NotebookProgressStep): number => {
  const val = a.timestamp - b.timestamp;
  return val !== 0 ? val : progressionValue(a.step) - progressionValue(b.step);
};

export const useNotebookProgress = (
  notebook: NotebookKind | null,
  isRunning: boolean,
  isStopping: boolean,
  isStopped: boolean,
  events: EventKind[],
): NotebookProgressStep[] => {
  const progressSteps: NotebookProgressStep[] = Object.values(ProgressionStep).map((step) => ({
    step: ProgressionStep[step],
    percentile: 0,
    status: EventStatus.PENDING,
    timestamp: 0,
  }));
  progressSteps[0].status = isStopped || isStopping ? EventStatus.PENDING : EventStatus.SUCCESS;

  let progressEvents = events;
  let gracePeriod = false;

  if (notebook) {
    const annotationTime = notebook.metadata.annotations?.['notebooks.kubeflow.org/last-activity'];
    const lastActivity = annotationTime
      ? new Date(annotationTime)
      : new Date(notebook.metadata.creationTimestamp ?? 0);

    const [filteredEvents, , period] = filterEvents(events, lastActivity);
    progressEvents = filteredEvents;
    gracePeriod = period;
  }

  const currentProgress = progressEvents
    .map((event) => getNotebookEventStatus(event, gracePeriod))
    .toSorted(compareProgressSteps);

  currentProgress.forEach((currentStep) => {
    const progressStep = progressSteps.find((step) => step.step === currentStep.step);
    if (progressStep) {
      progressStep.status = currentStep.status;
      progressStep.timestamp = currentStep.timestamp;
    }
  });

  if (
    isRunning &&
    progressSteps.find((p) => p.step === ProgressionStep.AUTH_PROXY_CONTAINER_STARTED)?.status ===
      EventStatus.SUCCESS
  ) {
    const startedStep = progressSteps.find((p) => p.step === ProgressionStep.WORKBENCH_STARTED);
    if (startedStep) {
      startedStep.status = EventStatus.SUCCESS;
    }
  }

  Object.entries(AssociatedSteps).forEach(([key, values]) => {
    if (progressSteps.find((p) => p.step === key)?.status === EventStatus.SUCCESS) {
      const filteredValues = values.filter((step) => !OptionalSteps.includes(step));
      filteredValues.forEach((value) => {
        const currentStep = progressSteps.find((p) => p.step === value);
        if (currentStep) {
          currentStep.status = EventStatus.SUCCESS;
        }
      });
    }
  });

  return progressSteps.filter(
    (notebookProgressStep) =>
      !(
        OptionalSteps.includes(notebookProgressStep.step) &&
        progressSteps.find((p) => p.step === notebookProgressStep.step)?.status ===
          EventStatus.PENDING
      ),
  );
};
