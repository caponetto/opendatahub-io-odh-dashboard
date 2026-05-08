import { mockAxiosError } from '@odh-dashboard/test-mocks/mockAxiosError';
import { mock200Status, mock404Error } from '@odh-dashboard/test-mocks/mockK8sStatus';
import {
  K8sStatusError,
  getGenericErrorCode,
  isK8sStatus,
  throwErrorFromAxios,
} from '../errorUtils';

describe('isK8sStatus', () => {
  it('should return true when data is k8sStatus', () => {
    const data = mock200Status({});
    const result = isK8sStatus(data);
    expect(result).toBe(true);
  });

  it('should return false when data is other than k8sStatus', () => {
    const error = {};
    const result = isK8sStatus(error);
    expect(result).toBe(false);
  });
});

describe('K8sStatusError', () => {
  it('should instantiate with correct status object', () => {
    const statusObject = mock404Error({});

    const error = new K8sStatusError(statusObject);
    expect(error.message).toStrictEqual(statusObject.message);
    expect(error).toMatchObject(new Error('404 Not Found'));
  });
});

describe('throwErrorFromAxios', () => {
  it('should throw axios error response', () => {
    const axiosResponse = mockAxiosError({});
    expect(() => throwErrorFromAxios(axiosResponse)).toThrow('error');
  });

  it('should handle and throw other error', () => {
    const error = {
      name: 'error',
      message: 'Not Found',
    };
    expect(() => throwErrorFromAxios(error)).toThrow('Not Found');
  });
});

describe('getGenericErrorCode', () => {
  it('should return k8sStatusError status code', () => {
    const statusObject = mock404Error({});
    const error = new K8sStatusError(statusObject);
    expect(getGenericErrorCode(error)).toBe(404);
  });

  it('should return axios error status code', () => {
    const axiosResponse = mockAxiosError({ message: 'error' });
    expect(axiosResponse.response?.status).toBe(404);
    expect(getGenericErrorCode(axiosResponse)).toBe(404);
  });

  it('should return undefined when error is not k8sStatusError or axios error', () => {
    const error = 'error';
    expect(getGenericErrorCode(error)).toBeUndefined();
  });
});
