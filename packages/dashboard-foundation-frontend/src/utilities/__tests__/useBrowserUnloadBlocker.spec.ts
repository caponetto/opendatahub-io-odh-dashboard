import { renderHook } from '@testing-library/react';
import { useBrowserUnloadBlocker } from '#~/utilities/useBrowserUnloadBlocker';

const hookOptions = { reactStrictMode: false } as const;

describe('useBrowserUnloadBlocker', () => {
  let addEventListenerSpy: jest.SpyInstance;
  let removeEventListenerSpy: jest.SpyInstance;
  let preventDefaultSpy: jest.SpyInstance;

  beforeEach(() => {
    addEventListenerSpy = jest.spyOn(window, 'addEventListener');
    removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');
    preventDefaultSpy = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should add beforeunload event listener when shouldBlock is true', () => {
    renderHook(() => useBrowserUnloadBlocker(true), hookOptions);
    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should not add beforeunload event listener when shouldBlock is false', () => {
    renderHook(() => useBrowserUnloadBlocker(false), hookOptions);
    expect(addEventListenerSpy).not.toHaveBeenCalled();
  });

  it('should remove event listener on unmount when shouldBlock is true', () => {
    const { unmount } = renderHook(() => useBrowserUnloadBlocker(true), hookOptions);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function));
  });

  it('should prevent default and set returnValue when beforeunload is triggered', () => {
    renderHook(() => useBrowserUnloadBlocker(true), hookOptions);

    const [[, handler]] = addEventListenerSpy.mock.calls;

    const event = {
      preventDefault: preventDefaultSpy,
      returnValue: '',
    };

    handler(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(event.returnValue).toBe('');
  });

  it('should cleanup properly when shouldBlock changes from true to false', () => {
    const { rerender } = renderHook(
      ({ shouldBlock }: { shouldBlock: boolean }) => useBrowserUnloadBlocker(shouldBlock),
      { initialProps: { shouldBlock: true }, ...hookOptions },
    );

    expect(addEventListenerSpy).toHaveBeenCalledTimes(1);

    rerender({ shouldBlock: false });

    expect(removeEventListenerSpy).toHaveBeenCalledTimes(1);
  });
});
