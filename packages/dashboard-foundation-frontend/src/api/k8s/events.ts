import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { EventKind } from '#~/k8sTypes';
import { EventModel } from '#~/api/models/k8s';
import useK8sWatchResourceList from '#~/utilities/useK8sWatchResourceList';
import { CustomWatchK8sResult } from '#~/types';
import { groupVersionKind } from '#~/api/k8sUtils';

export const getNotebookEvents = async (
  namespace: string,
  notebookName: string,
  podUid: string | undefined,
): Promise<EventKind[]> =>
  k8sListResourceItems<EventKind>({
    model: EventModel,
    queryOptions: {
      ns: namespace,
      queryParams: {
        fieldSelector: podUid
          ? `involvedObject.kind=Pod,involvedObject.uid=${podUid}`
          : `involvedObject.kind=StatefulSet,involvedObject.name=${notebookName}`,
      },
    },
  });

export const useWatchNotebookEvents = (
  namespace: string,
  name: string,
  podUid?: string,
): CustomWatchK8sResult<EventKind[]> =>
  useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(EventModel),
      namespace,
      fieldSelector: podUid
        ? `involvedObject.kind=Pod,involvedObject.uid=${podUid}`
        : `involvedObject.kind=StatefulSet,involvedObject.name=${name}`,
    },
    EventModel,
  );

// get all the events for all the pods in the namespace
export const useWatchPodEvents = (namespace: string): CustomWatchK8sResult<EventKind[]> =>
  useK8sWatchResourceList(
    {
      isList: true,
      groupVersionKind: groupVersionKind(EventModel),
      namespace,
      fieldSelector: 'involvedObject.kind=Pod',
    },
    EventModel,
  );
