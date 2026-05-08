import type * as React from 'react';

export type AnyObject = Record<string, unknown>;

export type CodeRef<TValue = unknown> = () => Promise<TValue>;

export type ExtensionFlags = Partial<{
  required: string[];
  disallowed: string[];
}>;

export type Extension<TType extends string = string, TProperties extends AnyObject = AnyObject> = {
  type: TType;
  properties: TProperties;
  flags?: ExtensionFlags;
  [customProperty: string]: unknown;
};

export type ExtensionPredicate<TExtension extends Extension> = (e: Extension) => e is TExtension;

export type FeatureFlags = {
  [flagName: string]: boolean;
};

export type LoadedExtension<TExtension extends Extension = Extension> = TExtension & {
  pluginName: string;
  uid: string;
};

export type ExtractExtensionProperties<T> = T extends Extension<string, infer TProperties>
  ? TProperties
  : never;

type ReplaceProperties<T, R> = {
  [K in keyof T]: K extends keyof R ? R[K] : T[K];
};

type MapCodeRefsToValues<T> = {
  [K in keyof T]: T[K] extends CodeRef<infer TValue> ? TValue : MapCodeRefsToValues<T[K]>;
};

export type ResolvedExtension<TExtension extends Extension = Extension> = ReplaceProperties<
  TExtension,
  {
    properties: ReplaceProperties<
      ExtractExtensionProperties<TExtension>,
      MapCodeRefsToValues<ExtractExtensionProperties<TExtension>>
    >;
  }
>;

export type ComponentCodeRef<Props = AnyObject> = CodeRef<{ default: React.ComponentType<Props> }>;
