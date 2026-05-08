export const getWindowLocation = (): Location => globalThis.window.location;

export const assignWindowLocation = (url: string): void => {
  globalThis.window.location.assign(url);
};

export const reloadWindow = (): void => {
  globalThis.window.location.reload();
};
