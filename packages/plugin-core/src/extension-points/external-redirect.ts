import type { CodeRef, Extension } from '../core/types';

export type ExternalRedirectExtension = Extension<
  'app.external-redirect',
  {
    path: string;
    component: CodeRef<React.ComponentType>;
  }
>;

export const isExternalRedirectExtension = (
  extension: Extension,
): extension is ExternalRedirectExtension => extension.type === 'app.external-redirect';
