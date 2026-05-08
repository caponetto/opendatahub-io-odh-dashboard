import React from 'react';
import { init, loadRemote } from '@module-federation/runtime';
import type { Extension } from '@odh-dashboard/plugin-core';
import { allSettledPromises } from '@odh-dashboard/dashboard-foundation-frontend/utilities/allSettledPromises';
import { MF_REMOTES } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import pluginExtensions from './plugin-extensions';

type MFRemoteConfig = {
  name: string;
  remoteEntry: string;
  packageName?: string;
};

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const isMfRemoteConfig = (value: unknown): value is MFRemoteConfig => {
  if (!isPlainRecord(value)) {
    return false;
  }
  const { name, remoteEntry, packageName } = value;
  if (typeof name !== 'string' || typeof remoteEntry !== 'string') {
    return false;
  }
  if (packageName !== undefined && typeof packageName !== 'string') {
    return false;
  }
  return true;
};

const parseMfRemoteConfigs = (): MFRemoteConfig[] => {
  if (!MF_REMOTES) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(MF_REMOTES);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isMfRemoteConfig);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.warn('Error with module federation setup:', error);
    return [];
  }
};

const initRemotes = (remotes: MFRemoteConfig[]) => {
  init({
    name: 'app',
    remotes: remotes.map(({ name, remoteEntry }) => ({
      name,
      entry: `/_mf/${name}${remoteEntry}`,
    })),
  });
};

const loadModuleExtensions = (moduleName: string): Promise<Record<string, Extension[]>> =>
  loadRemote<{ default: Extension[] }>(`${moduleName}/extensions`)
    .then((result) => ({
      [moduleName]: result ? result.default : [],
    }))
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.warn(`Failed to load module extensions for ${moduleName}:`, error);
      return { [moduleName]: [] };
    });

export const useAppExtensions = (): [Record<string, Extension[]>, boolean] => {
  const [appExtensions, setAppExtensions] = React.useState<Record<string, Extension[]>>({});
  const [loaded, setLoaded] = React.useState(!MF_REMOTES);

  const mfRemoteConfigs = React.useMemo(() => parseMfRemoteConfigs(), []);

  React.useEffect(() => {
    if (!MF_REMOTES || mfRemoteConfigs.length === 0) {
      if (MF_REMOTES) {
        setLoaded(true);
      }
      return undefined;
    }

    initRemotes(mfRemoteConfigs);
    allSettledPromises(mfRemoteConfigs.map((r) => loadModuleExtensions(r.name)))
      .then(([results]) => {
        if (results.length > 0) {
          setAppExtensions((prev) =>
            results.reduce((acc, r) => ({ ...acc, ...r.value }), { ...prev }),
          );
        }
      })
      .catch((error) => {
        // eslint-disable-next-line no-console
        console.warn('Error loading module federation extensions:', error);
      })
      .finally(() => setLoaded(true));
    return undefined;
  }, [mfRemoteConfigs]);

  const normalizedAppExtensions = React.useMemo(() => {
    const pluginKeys = new Set(Object.keys(pluginExtensions));
    const mfNameToPackage = new Map<string, string>();
    for (const r of mfRemoteConfigs) {
      if (r.packageName && pluginKeys.has(r.packageName)) {
        mfNameToPackage.set(r.name, r.packageName);
      }
    }
    const out: Record<string, Extension[]> = {};
    for (const [mfName, exts] of Object.entries(appExtensions)) {
      const key = mfNameToPackage.get(mfName) ?? mfName;
      out[key] = exts;
    }
    return out;
  }, [appExtensions, mfRemoteConfigs]);

  const allExtensions = React.useMemo(
    () => ({ ...pluginExtensions, ...normalizedAppExtensions }),
    [normalizedAppExtensions],
  );

  return [allExtensions, loaded];
};
