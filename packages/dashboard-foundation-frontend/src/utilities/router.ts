import { NavigateFunction } from 'react-router';
import { getWindowLocation } from '#~/utilities/windowUtils';

export const buildQueryArgumentUrl = (k: string, v?: string): string => {
  const location = getWindowLocation();
  const params = new URLSearchParams(location.search);
  if (v === undefined) {
    params.delete(k);
  } else {
    params.set(k, v);
  }
  const url = new URL(location.href);
  const query = params.toString();
  const querySuffix = query ? `?${query}` : '';
  return `${url.pathname}${querySuffix}${url.hash}`;
};

export const setQueryArgument = (navigate: NavigateFunction, k: string, v: string): void => {
  const params = new URLSearchParams(getWindowLocation().search);
  if (params.get(k) !== v) {
    navigate(buildQueryArgumentUrl(k, v), { replace: true });
  }
};

export const removeQueryArgument = (navigate: NavigateFunction, k: string): void => {
  const params = new URLSearchParams(getWindowLocation().search);
  if (params.has(k)) {
    navigate(buildQueryArgumentUrl(k), { replace: true });
  }
};
