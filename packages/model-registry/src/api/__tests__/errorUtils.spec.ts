import { NotReadyError } from '@odh-dashboard/dashboard-foundation-frontend/utilities/useFetch';
import { mockRegisteredModel } from '@odh-dashboard/test-mocks/mockRegisteredModel';
import { ModelRegistryError } from '@odh-dashboard/model-registry/concepts/modelRegistry/types';
import { handleModelRegistryFailures } from '../errorUtils';

describe('handleModelRegistryFailures', () => {
  it('should successfully return registered models', async () => {
    const modelRegistryMock = mockRegisteredModel({});
    const result = await handleModelRegistryFailures(Promise.resolve(modelRegistryMock));
    expect(result).toStrictEqual(modelRegistryMock);
  });

  it('should handle and throw model registry errors', async () => {
    const statusMock: ModelRegistryError = {
      code: '',
      message: 'error',
    };

    await expect(handleModelRegistryFailures(Promise.resolve(statusMock))).rejects.toThrow('error');
  });

  it('should handle common state errors ', async () => {
    await expect(
      handleModelRegistryFailures(Promise.reject(new NotReadyError('error'))),
    ).rejects.toThrow('error');
  });

  it('should handle other errors', async () => {
    await expect(handleModelRegistryFailures(Promise.reject(new Error('error')))).rejects.toThrow(
      'Error communicating with model registry server',
    );
  });
});
