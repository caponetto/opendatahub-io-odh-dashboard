import React from 'react';
import { render, screen } from '@testing-library/react';
import { mockConnectionTypeConfigMapObj } from '@odh-dashboard/test-mocks/mockConnectionType';
import { mockConnection } from '@odh-dashboard/test-mocks/mockConnection';
import { mockNotebookK8sResource } from '@odh-dashboard/test-mocks/mockNotebookK8sResource';
import { mockInferenceServiceK8sResource } from '@odh-dashboard/test-mocks/mockInferenceServiceK8sResource';
import { useRelatedNotebooks } from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';
import { useInferenceServicesForConnection } from '@odh-dashboard/workbenches/pages/useInferenceServicesForConnection';
import ConnectionsTable from '@odh-dashboard/workbenches/pages/screens/detail/connections/ConnectionsTable';

jest.mock('@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks', () => ({
  ...jest.requireActual('@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks'),
  useRelatedNotebooks: jest.fn(),
}));

jest.mock('@odh-dashboard/workbenches/pages/useInferenceServicesForConnection', () => ({
  useInferenceServicesForConnection: jest.fn(),
}));

const useRelatedNotebooksMock = useRelatedNotebooks as jest.Mock;
const useInferenceServicesForConnectionMock = useInferenceServicesForConnection as jest.Mock;

const mockInferenceServices = [
  mockInferenceServiceK8sResource({ name: 'deployed-model-1', displayName: 'Deployed model 1' }),
  mockInferenceServiceK8sResource({ name: 'deployed-model-2', displayName: 'Deployed model 2' }),
];

describe('ConnectionsTable', () => {
  beforeEach(() => {
    useRelatedNotebooksMock.mockReturnValue({ notebooks: [], loaded: true });
    useInferenceServicesForConnectionMock.mockReturnValue([]);
  });

  it('should render table', () => {
    const connection = mockConnection({ displayName: 'connection1', description: 'desc1' });
    render(
      <ConnectionsTable
        namespace={connection.metadata.namespace}
        connections={[connection]}
        refreshConnections={() => undefined}
        setManageConnectionModal={() => undefined}
      />,
    );

    expect(screen.getByTestId('connection-table')).toBeTruthy();
    expect(screen.getByText('connection1')).toBeTruthy();
    expect(screen.getByText('desc1')).toBeTruthy();
    expect(screen.getByText('s3')).toBeTruthy();
  });

  it('should show display name of connection type if available', () => {
    const connection = mockConnection({ displayName: 'connection1', description: 'desc1' });
    render(
      <ConnectionsTable
        namespace={connection.metadata.namespace}
        connections={[connection]}
        connectionTypes={[
          mockConnectionTypeConfigMapObj({ name: 's3', displayName: 'S3 Buckets' }),
        ]}
        refreshConnections={() => undefined}
        setManageConnectionModal={() => undefined}
      />,
    );

    expect(screen.getByTestId('connection-table')).toBeTruthy();
    expect(screen.getByText('connection1')).toBeTruthy();
    expect(screen.getByText('desc1')).toBeTruthy();
    expect(screen.queryByText('s3')).toBeFalsy();
    expect(screen.getByText('S3 Buckets')).toBeTruthy();
  });

  it('should show connected resources', () => {
    useRelatedNotebooksMock.mockReturnValue({
      notebooks: [mockNotebookK8sResource({ displayName: 'Connected notebook' })],
      loaded: true,
    });
    useInferenceServicesForConnectionMock.mockReturnValue(mockInferenceServices);

    const connection = mockConnection({ displayName: 'connection1', description: 'desc1' });
    render(
      <ConnectionsTable
        namespace={connection.metadata.namespace}
        connections={[connection]}
        connectionTypes={[
          mockConnectionTypeConfigMapObj({ name: 's3', displayName: 'S3 Buckets' }),
        ]}
        refreshConnections={() => undefined}
        setManageConnectionModal={() => undefined}
      />,
    );

    expect(screen.getByTestId('connection-table')).toBeTruthy();
    expect(screen.getByText('connection1')).toBeTruthy();
    expect(screen.getByText('desc1')).toBeTruthy();
    expect(screen.queryByText('s3')).toBeFalsy();
    expect(screen.getByText('S3 Buckets')).toBeTruthy();
    expect(screen.getByText('Connected notebook')).toBeTruthy();
    expect(screen.getByText('Deployed model 1')).toBeTruthy();
    expect(screen.getByText('Deployed model 2')).toBeTruthy();
  });
});
