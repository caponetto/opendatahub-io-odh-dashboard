import type {
  LabeledConnection,
  ConnectionTypeConfigMapObj,
  ConnectionTypeValueType,
} from '@odh-dashboard/connection-types-shared/concepts/connectionTypes/types';

export type PrefilledConnection = {
  initialNewConnectionType: ConnectionTypeConfigMapObj | undefined;
  initialNewConnectionValues: { [key: string]: ConnectionTypeValueType };
  connections: LabeledConnection[];
  connectionsLoaded: boolean;
  connectionsLoadError: Error | undefined;
};
