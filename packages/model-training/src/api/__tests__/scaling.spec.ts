import { k8sPatchResource } from '@odh-dashboard/k8s-browser';
import { TrainJobModel } from '@odh-dashboard/dashboard-foundation-frontend/api/models/kubeflow';
import { updateTrainJobNumNodes } from '../scaling';
import { mockTrainJobK8sResource } from '../../__mocks__/mockTrainJobK8sResource';

jest.mock('@odh-dashboard/k8s-browser');

const mockK8sPatchResource = jest.mocked(k8sPatchResource);

describe('scaling API updateTrainJobNumNodes', () => {
  const mockJob = mockTrainJobK8sResource({
    name: 'test-job',
    namespace: 'test-namespace',
    numNodes: 3,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should use replace operation when numNodes exists', async () => {
    const updatedJob = { ...mockJob, spec: { ...mockJob.spec, trainer: { numNodes: 5 } } };
    mockK8sPatchResource.mockResolvedValue(updatedJob);

    const result = await updateTrainJobNumNodes(mockJob, 5);

    expect(mockK8sPatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        model: TrainJobModel,
        queryOptions: expect.objectContaining({
          name: 'test-job',
          ns: 'test-namespace',
        }),
        patches: [
          {
            op: 'replace',
            path: '/spec/trainer/numNodes',
            value: 5,
          },
        ],
      }),
    );
    expect(result).toEqual(updatedJob);
  });

  it('should handle empty job name gracefully', async () => {
    const jobWithoutName = { ...mockJob, metadata: { ...mockJob.metadata, name: '' } };
    mockK8sPatchResource.mockResolvedValue(jobWithoutName);

    await updateTrainJobNumNodes(jobWithoutName, 5);

    expect(mockK8sPatchResource).toHaveBeenCalledWith(
      expect.objectContaining({
        queryOptions: expect.objectContaining({
          name: '',
          ns: 'test-namespace',
        }),
      }),
    );
  });

  it('should handle API errors', async () => {
    const error = new Error('API error');
    mockK8sPatchResource.mockRejectedValue(error);

    await expect(updateTrainJobNumNodes(mockJob, 5)).rejects.toThrow('API error');
  });
});
