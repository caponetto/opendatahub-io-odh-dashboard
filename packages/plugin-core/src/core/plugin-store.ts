import { isEqual, pickBy } from 'lodash-es';
import type { AnyObject, Extension, FeatureFlags, LoadedExtension } from './types';
import { EXTENSION_OVERRIDE_TYPE } from '../extension-points/override';
import { ROUTE_REDIRECT_TYPE } from '../extension-points/routes';

export type PluginInfoEntry = Record<string, unknown>;

export enum PluginEventType {
  ExtensionsChanged = 'ExtensionsChanged',
  FeatureFlagsChanged = 'FeatureFlagsChanged',
}

const uuidv4 = () =>
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16),
  );

export class PluginStore {
  /** All extensions. */
  private allExtensions: LoadedExtension[] = [];

  /** Extensions which are currently in use. */
  private extensions: LoadedExtension[] = [];

  /** Subscribed event listeners. */
  private readonly listeners = new Map<PluginEventType, Set<VoidFunction>>();

  /** Feature flags used to determine the availability of extensions. */
  private featureFlags: FeatureFlags = {};

  constructor(extensions: Record<string, Extension[]>) {
    this.allExtensions = [];
    Object.entries(extensions).forEach(([pluginName, pluginExtensions]) => {
      pluginExtensions.forEach((e: Extension) => {
        this.allExtensions.push({
          ...e,
          pluginName,
          uid: uuidv4(),
        });
      });
    });

    if (process.env.NODE_ENV === 'development') {
      const keyToPlugins = new Map<string, string[]>();
      for (const ext of this.allExtensions) {
        const key = this.extensionKey(ext);
        if (!keyToPlugins.has(key)) {
          keyToPlugins.set(key, []);
        }
        keyToPlugins.get(key)?.push(ext.pluginName);
      }
      for (const [key, plugins] of keyToPlugins) {
        const unique = [...new Set(plugins)];
        if (unique.length > 1) {
          // eslint-disable-next-line no-console
          console.warn(`Duplicate extension "${key}" loaded from plugins: ${unique.join(', ')}`);
        }
      }
    }

    Object.values(PluginEventType).forEach((t) => {
      this.listeners.set(t, new Set());
    });

    this.updateExtensions();
  }

  get sdkVersion(): string {
    return '0.1';
  }

  private invokeListeners(eventType: PluginEventType) {
    this.listeners.get(eventType)?.forEach((listener) => {
      listener();
    });
  }

  private updateExtensions() {
    const prevExtensions = this.extensions;

    const flagFiltered = this.allExtensions.filter((e) => this.isExtensionInUse(e));
    this.extensions = this.applyOverrides(flagFiltered);

    if (!isEqual(prevExtensions, this.extensions)) {
      this.invokeListeners(PluginEventType.ExtensionsChanged);
    }
  }

  private extensionKey(e: LoadedExtension): string {
    const id = typeof e.properties.id === 'string' ? e.properties.id : '';
    return `${e.type}::${id}`;
  }

  private applyOverrides(extensions: LoadedExtension[]): LoadedExtension[] {
    const overrides = extensions.filter((e) => e.type === EXTENSION_OVERRIDE_TYPE);
    if (overrides.length === 0) {
      return extensions;
    }

    const hiddenIds = new Set<string>();
    const patchMap = new Map<string, Record<string, unknown>>();

    for (const override of overrides) {
      const { targetType, targetId, hide, patch } = override.properties;
      if (typeof targetType !== 'string' || typeof targetId !== 'string') {
        continue;
      }
      const key = `${targetType}::${targetId}`;

      if (hide === true) {
        hiddenIds.add(key);
      }
      if (typeof patch === 'object' && patch !== null) {
        patchMap.set(key, {
          ...(patchMap.get(key) ?? {}),
          ...Object.fromEntries(Object.entries(patch)),
        });
      }
    }

    // Collect href/path rewrites: oldPath -> newPath
    const pathRewrites = new Map<string, string>();

    const visible = extensions.filter((e) => {
      if (e.type === EXTENSION_OVERRIDE_TYPE) {
        return false;
      }
      return !hiddenIds.has(this.extensionKey(e));
    });

    const patched = visible.map((e) => {
      const patch = patchMap.get(this.extensionKey(e));
      if (!patch) {
        return e;
      }

      const oldHref = typeof e.properties.href === 'string' ? e.properties.href : undefined;
      const oldPath = typeof e.properties.path === 'string' ? e.properties.path : undefined;

      const patchedProps: Record<string, unknown> = { ...e.properties };
      for (const [k, v] of Object.entries(patch)) {
        if (v === null) {
          delete patchedProps[k];
        } else {
          patchedProps[k] = v;
        }
      }

      const newHref = typeof patchedProps.href === 'string' ? patchedProps.href : undefined;
      const newPath = typeof patchedProps.path === 'string' ? patchedProps.path : undefined;

      if (oldHref && newHref && oldHref !== newHref) {
        pathRewrites.set(oldHref, newHref);
      }
      if (oldPath && newPath && oldPath !== newPath) {
        pathRewrites.set(oldPath, newPath);
      }

      return { ...e, properties: patchedProps };
    });

    if (pathRewrites.size === 0) {
      return patched;
    }

    // Rewrite matching app.route paths and collect synthetic redirects
    const redirects: LoadedExtension[] = [];
    const rewritten = patched.map((e) => {
      if (e.type !== 'app.route' || typeof e.properties.path !== 'string') {
        return e;
      }
      const routePath = e.properties.path;
      const newPath = this.resolveRewrite(routePath, pathRewrites);
      if (!newPath) {
        return e;
      }
      return { ...e, properties: { ...e.properties, path: newPath } };
    });

    for (const [oldPath, newPath] of pathRewrites) {
      redirects.push({
        type: ROUTE_REDIRECT_TYPE,
        pluginName: '__auto_redirect__',
        uid: uuidv4(),
        properties: { from: oldPath, to: newPath },
      });
      // Also redirect the wildcard variant, unless the rewrite map already covers it
      const wildcardKey = `${oldPath}/*`;
      if (!oldPath.endsWith('/*') && !pathRewrites.has(wildcardKey)) {
        redirects.push({
          type: ROUTE_REDIRECT_TYPE,
          pluginName: '__auto_redirect__',
          uid: uuidv4(),
          properties: { from: wildcardKey, to: `${newPath}/*` },
        });
      }
    }

    return [...rewritten, ...redirects];
  }

  /**
   * Given a route path, check if any rewrite rule applies.
   * Matches exact paths and paths that start with a rewrite key prefix.
   */
  private resolveRewrite(routePath: string, rewrites: Map<string, string>): string | undefined {
    // Exact match
    if (rewrites.has(routePath)) {
      return rewrites.get(routePath);
    }

    // Prefix match: route "/old/path/*" matches rewrite "/old/path" -> "/new/path"
    for (const [oldPrefix, newPrefix] of rewrites) {
      if (routePath.startsWith(`${oldPrefix}/`) || routePath.startsWith(`${oldPrefix}/*`)) {
        return routePath.replace(oldPrefix, newPrefix);
      }
    }

    return undefined;
  }

  private isExtensionInUse(extension: LoadedExtension) {
    return (
      (extension.flags?.required?.every((f) => this.featureFlags[f] === true) ?? true) &&
      (extension.flags?.disallowed?.every((f) => this.featureFlags[f] === false) ?? true)
    );
  }

  subscribe(eventTypes: PluginEventType[], listener: VoidFunction): VoidFunction {
    let isSubscribed = true;

    if (eventTypes.length === 0) {
      // eslint-disable-next-line no-console
      console.warn('subscribe method called with empty eventTypes');
      return () => {
        // noop
      };
    }

    eventTypes.forEach((t) => {
      this.listeners.get(t)?.add(listener);
    });

    return () => {
      if (isSubscribed) {
        isSubscribed = false;

        eventTypes.forEach((t) => {
          this.listeners.get(t)?.delete(listener);
        });
      }
    };
  }

  getExtensions(): LoadedExtension[] {
    return [...this.extensions];
  }

  getFeatureFlags(): FeatureFlags {
    return { ...this.featureFlags };
  }

  setFeatureFlags(newFlags: FeatureFlags): void {
    const prevFeatureFlags = this.featureFlags;

    this.featureFlags = {
      ...this.featureFlags,
      ...pickBy(newFlags, (value) => typeof value === 'boolean'),
    };

    if (!isEqual(prevFeatureFlags, this.featureFlags)) {
      this.updateExtensions();
      this.invokeListeners(PluginEventType.FeatureFlagsChanged);
    }
  }

  getPluginInfo(): PluginInfoEntry[] {
    throw new Error('Not implemented');
  }

  loadPlugin(): Promise<void> {
    throw new Error('Not implemented');
  }

  enablePlugins(): void {
    throw new Error('Not implemented');
  }

  disablePlugins(): void {
    throw new Error('Not implemented');
  }

  getExposedModule<TModule extends AnyObject>(): Promise<TModule> {
    throw new Error('Not implemented');
  }
}
