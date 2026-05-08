import { k8sListResourceItems } from '@odh-dashboard/k8s-browser';
import { mockLocalQueueK8sResource } from '@odh-dashboard/test-mocks/mockLocalQueueK8sResource';
import { LocalQueueKind } from '@odh-dashboard/dashboard-foundation-frontend/k8sTypes';
import { listLocalQueues } from '../localQueues';
import { LocalQueueModel } from '../../models/kueue';

jest.mock('@odh-dashboard/k8s-browser', () => ({
  k8sListResourceItems: jest.fn(),
}));

const k8sListResourceItemsMock = jest.mocked(k8sListResourceItems<LocalQueueKind>);

const mockedLocalQueue = mockLocalQueueK8sResource({
  name: 'test-local-queue',
  namespace: 'test-project',
});

describe('listLocalQueues', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return localqueues', async () => {
    k8sListResourceItemsMock.mockResolvedValue([mockedLocalQueue]);
    const result = await listLocalQueues('test-project');
    expect(k8sListResourceItemsMock).toHaveBeenCalledWith({
      model: LocalQueueModel,
      queryOptions: { ns: 'test-project' },
    });
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(result).toStrictEqual([mockedLocalQueue]);
  });

  it('should handle errors and rethrow', async () => {
    k8sListResourceItemsMock.mockRejectedValue(new Error('error1'));
    await expect(listLocalQueues('test-project')).rejects.toThrow('error1');
    expect(k8sListResourceItemsMock).toHaveBeenCalledTimes(1);
    expect(k8sListResourceItemsMock).toHaveBeenCalledWith({
      model: LocalQueueModel,
      queryOptions: { ns: 'test-project' },
    });
  });
});
