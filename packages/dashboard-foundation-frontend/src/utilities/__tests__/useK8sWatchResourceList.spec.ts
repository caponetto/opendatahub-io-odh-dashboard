import { WatchK8sResource, useK8sWatchResource } from '@odh-dashboard/k8s-browser';
import { testHook } from '@odh-dashboard/jest-config/hooks';
import { TemplateModel } from '#~/api/models/openShift';
import { groupVersionKind } from '#~/api/k8sUtils';
import useK8sWatchResourceList from '#~/utilities/useK8sWatchResourceList';

jest.mock('@odh-dashboard/k8s-browser', () => ({
  useK8sWatchResource: jest.fn(),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;

const namespace = 'opendatahub';

describe('useK8sWatchResourceList', () => {
  it('should wrap useK8sWatchResource', () => {
    const mockReturnValue: ReturnType<typeof useK8sWatchResourceMock> = [[], false, undefined];
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    const initResource: WatchK8sResource | null = {
      isList: true,
      groupVersionKind: groupVersionKind(TemplateModel),
      namespace,
    };
    const renderResult = testHook(useK8sWatchResourceList)(initResource, TemplateModel);
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    expect(renderResult.result.current).toStrictEqual(mockReturnValue);
  });

  it('should return empty array when initResource is null', () => {
    const mockReturnValue: ReturnType<typeof useK8sWatchResourceMock> = [
      undefined,
      false,
      undefined,
    ];
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    const initResource: WatchK8sResource | null = null;
    const renderResult = testHook(useK8sWatchResourceList)(initResource, TemplateModel);
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    expect(renderResult.result.current).toStrictEqual([[], false, undefined]);
  });

  it('should return error when it is instance of error', () => {
    const mockReturnValue: ReturnType<typeof useK8sWatchResourceMock> = [
      [],
      false,
      new Error('error'),
    ];
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    const initResource: WatchK8sResource | null = {
      isList: true,
      groupVersionKind: groupVersionKind(TemplateModel),
      namespace,
    };
    const renderResult = testHook(useK8sWatchResourceList)(initResource, TemplateModel);
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    expect(renderResult.result.current).toStrictEqual(mockReturnValue);
  });

  it('should return error object when it is not instance of error', () => {
    const mockReturnValue: ReturnType<typeof useK8sWatchResourceMock> = [[], false, 'error'];
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    const initResource: WatchK8sResource | null = {
      isList: true,
      groupVersionKind: groupVersionKind(TemplateModel),
      namespace,
    };
    const renderResult = testHook(useK8sWatchResourceList)(initResource, TemplateModel);
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    expect(renderResult.result.current).toStrictEqual([
      [],
      false,
      new Error('Unknown error occured'),
    ]);
  });

  it('should return undefined when error is an empty string', () => {
    const mockReturnValue: ReturnType<typeof useK8sWatchResourceMock> = [[], false, ''];
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    const initResource: WatchK8sResource | null = {
      isList: true,
      groupVersionKind: groupVersionKind(TemplateModel),
      namespace,
    };
    const renderResult = testHook(useK8sWatchResourceList)(initResource, TemplateModel);
    useK8sWatchResourceMock.mockReturnValue(mockReturnValue);
    expect(renderResult.result.current).toStrictEqual([[], false, undefined]);
  });
});
