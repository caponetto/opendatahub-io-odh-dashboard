import React, { act } from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { mockConnection } from '@odh-dashboard/test-mocks/mockConnection';
import { mockInferenceServiceK8sResource } from '@odh-dashboard/test-mocks/mockInferenceServiceK8sResource';
import { mockNotebookK8sResource } from '@odh-dashboard/test-mocks/mockNotebookK8sResource';
import { mockNotebookState } from '@odh-dashboard/test-mocks/mockNotebookState';
import { useRelatedNotebooks } from '@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks';
import { ConnectionsDeleteModal } from '@odh-dashboard/workbenches/pages/screens/detail/connections/ConnectionsDeleteModal';
import { useNotebooksStates } from '@odh-dashboard/workbenches/pages/notebook/useNotebooksStates';
import { useInferenceServicesForConnection } from '@odh-dashboard/workbenches/pages/useInferenceServicesForConnection';

jest.mock('@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks', () => ({
  ...jest.requireActual('@odh-dashboard/workbenches/pages/notebook/useRelatedNotebooks'),
  useRelatedNotebooks: jest.fn(),
}));

jest.mock('@odh-dashboard/workbenches/pages/notebook/useNotebooksStates', () => ({
  useNotebooksStates: jest.fn(),
}));

jest.mock('@odh-dashboard/workbenches/pages/useInferenceServicesForConnection', () => ({
  useInferenceServicesForConnection: jest.fn(),
}));

const useRelatedNotebooksMock = useRelatedNotebooks as jest.Mock;
const useNotebooksStatesMock = useNotebooksStates as jest.Mock;
const useInferenceServicesForConnectionMock = useInferenceServicesForConnection as jest.Mock;

const mockNotebooks = [
  mockNotebookK8sResource({ name: 'connected-notebook', displayName: 'Connected notebook' }),
  mockNotebookK8sResource({ name: 'another-notebook', displayName: 'Another notebook' }),
];
describe('Delete connection modal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    useRelatedNotebooksMock.mockReturnValue({
      notebooks: mockNotebooks,
      loaded: true,
    });
    useNotebooksStatesMock.mockReturnValue([
      [
        mockNotebookState(mockNotebooks[0], { isRunning: true }),
        mockNotebookState(mockNotebooks[1], { isStopped: true }),
      ],
    ]);
    useInferenceServicesForConnectionMock.mockReturnValue([
      mockInferenceServiceK8sResource({
        name: 'deployed-model-1',
        displayName: 'Deployed model 1',
      }),
      mockInferenceServiceK8sResource({
        name: 'deployed-model-2',
        displayName: 'Deployed model 2',
      }),
    ]);
  });

  it('should show related resources', async () => {
    const deleteConnection = mockConnection({ displayName: 'connection1', description: 'desc1' });

    render(
      <ConnectionsDeleteModal
        namespace={deleteConnection.metadata.namespace}
        deleteConnection={deleteConnection}
        onClose={onClose}
      />,
    );

    const notebooksCountBadge = screen.getByTestId('connections-delete-notebooks-count');
    expect(notebooksCountBadge).toHaveTextContent('2');
    await act(() => fireEvent.click(notebooksCountBadge));

    const notebookItems = screen.getAllByTestId('connections-delete-notebooks-item');
    expect(notebookItems).toHaveLength(2);
    expect(notebookItems[0]).toHaveTextContent('Connected notebook (Running)');
    expect(notebookItems[1]).toHaveTextContent('Another notebook');

    const modelsCountBadge = screen.getByTestId('connections-delete-models-count');
    expect(modelsCountBadge).toHaveTextContent('2');
    await act(() => fireEvent.click(modelsCountBadge));

    const modelsItems = screen.getAllByTestId('connections-delete-models-item');
    expect(modelsItems).toHaveLength(2);
    expect(modelsItems[0]).toHaveTextContent('Deployed model 1');
    expect(modelsItems[1]).toHaveTextContent('Deployed model 2');
  });

  it('should not show empty related resources', async () => {
    const deleteConnection = mockConnection({ displayName: 'connection1', description: 'desc1' });

    useRelatedNotebooksMock.mockReturnValue({
      notebooks: [],
      loaded: true,
    });
    useInferenceServicesForConnectionMock.mockReturnValue([]);
    render(
      <ConnectionsDeleteModal
        namespace={deleteConnection.metadata.namespace}
        deleteConnection={deleteConnection}
        onClose={onClose}
      />,
    );

    const notebooksCountBadge = screen.queryByTestId('connections-delete-notebooks-toggle');
    expect(notebooksCountBadge).toBeFalsy();

    const modelsCountBadge = screen.queryByTestId('connections-delete-models-toggle');
    expect(modelsCountBadge).toBeFalsy();
  });
});
