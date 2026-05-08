import type { CodeRef, Extension } from '../core/types';

export type ContextProviderExtension = Extension<
  'app.context-provider',
  {
    id: string;
    provider: CodeRef<React.ComponentType<React.PropsWithChildren>>;
  }
>;

export const isContextProviderExtension = (
  extension: Extension,
): extension is ContextProviderExtension => extension.type === 'app.context-provider';
