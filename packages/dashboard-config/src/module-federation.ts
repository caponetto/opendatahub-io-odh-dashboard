import type { ModuleFederationConfig, ModuleFederationConfigOld, ProxyService } from './types';

interface ManifestPackage {
  name: string;
  path: string;
  moduleFederation?: ModuleFederationConfig | ModuleFederationConfigOld;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const loadManifestModule: typeof import('@odh-dashboard/dashboard-build/loadManifest') = require('@odh-dashboard/dashboard-build/loadManifest');

const { loadManifest: loadManifestPackages, getWorkspacePackages } = loadManifestModule;

// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  resolveSelectedPackages,
}: typeof import('@odh-dashboard/dashboard-build/resolveSelectedPackages') = require('@odh-dashboard/dashboard-build/resolveSelectedPackages');

/**
 * Type guard to check if a config is the old format by checking for `remoteEntry` at the top level.
 * The old format has `remoteEntry` as a required top-level property, while the new format
 * has it nested under `backend.remoteEntry`.
 */
const isOldConfig = (
  config: ModuleFederationConfig | ModuleFederationConfigOld,
): config is ModuleFederationConfigOld => {
  return 'remoteEntry' in config;
};

/**
 * Converts a deprecated ModuleFederationConfigOld to the newer ModuleFederationConfig format.
 *
 * The old format had top-level properties (remoteEntry, tls, authorize, local, service, proxy)
 * that are now organized into `backend` and `proxyService` structures.
 *
 * @param oldConfig - The deprecated config format
 * @returns The converted config in the new format
 */
const convertModuleFederationConfig = (
  oldConfig: ModuleFederationConfigOld,
): ModuleFederationConfig => {
  const { name, remoteEntry, authorize, local, service, proxy, tls } = oldConfig;

  // Normalize service with required namespace (empty string as default)
  const normalizedService = {
    name: service.name,
    namespace: service.namespace ?? process.env.OC_PROJECT ?? '',
    port: service.port,
  };

  return {
    name,
    backend: {
      remoteEntry,
      service: normalizedService,
      ...(authorize !== undefined && { authorize }),
      ...(tls !== undefined && { tls }),
      ...(local && {
        localService: {
          host: local.host,
          port: local.port,
        },
      }),
    },
    proxyService: (proxy ?? []).map((p) => ({
      path: p.path,
      ...(p.pathRewrite && { pathRewrite: p.pathRewrite }),
      service: normalizedService,
      ...(authorize !== undefined && { authorize }),
      ...(tls !== undefined && { tls }),
      ...(local && {
        localService: {
          host: local.host,
          port: local.port,
        },
      }),
    })),
  };
};

/**
 * Filter MF configs to only include packages selected by the assembler.
 *
 * Fail-open: remotes from MODULE_FEDERATION_CONFIG that cannot be mapped to a
 * workspace package pass through unconditionally. This is intentional — runtime-injected
 * MF configs describe deployed federation targets outside the monorepo.
 *
 * Set MF_STRICT_FILTER=true to reject unmapped remotes (for CI/test builds).
 */
const filterByAssembler = (
  configs: ModuleFederationConfig[],
  assemblerDir: string,
): ModuleFederationConfig[] => {
  const mfNameToPackageName = new Map<string, string>();
  const manifestPackages = loadManifestPackages();
  if (manifestPackages) {
    for (const pkg of manifestPackages) {
      if (pkg.moduleFederation && 'name' in pkg.moduleFederation) {
        mfNameToPackageName.set(String(pkg.moduleFederation.name), pkg.name);
      }
    }
  } else {
    for (const pkg of getWorkspacePackages()) {
      const mf = pkg['module-federation'] ?? pkg.moduleFederation;
      if (mf && 'name' in mf) {
        mfNameToPackageName.set(String(mf.name), pkg.name);
      }
    }
  }

  const allPackageNames = manifestPackages
    ? manifestPackages.map((p) => p.name)
    : getWorkspacePackages().map((p) => p.name);
  const selected = resolveSelectedPackages(allPackageNames, assemblerDir);
  const allowedPackages = new Set<string>(selected);

  return configs.filter((c) => {
    const pkgName = mfNameToPackageName.get(c.name);
    if (!pkgName) {
      if (process.env.MF_STRICT_FILTER === 'true') {
        // eslint-disable-next-line no-console
        console.error(`MF_STRICT_FILTER: rejecting unmapped remote "${c.name}"`);
        return false;
      }
      // eslint-disable-next-line no-console
      console.warn(
        `MF remote "${c.name}" has no workspace package mapping — passing through assembler filter.`,
      );
      return true;
    }
    return allowedPackages.has(pkgName);
  });
};

/**
 * Try to load MF configs from the build-time plugin manifest.
 */
const loadManifestMFConfigs = (): ModuleFederationConfig[] | null => {
  const packages = loadManifestPackages();
  if (!packages) {
    return null;
  }
  const configs = packages
    .filter(
      (
        pkg: ManifestPackage,
      ): pkg is ManifestPackage & {
        moduleFederation: NonNullable<ManifestPackage['moduleFederation']>;
      } => !!pkg.moduleFederation,
    )
    .map((pkg) => normalizeConfig(pkg.moduleFederation));
  return configs.length > 0 ? configs : null;
};

/**
 * Normalizes a config to the new format, converting from old format if necessary.
 */
const normalizeConfig = (
  config: ModuleFederationConfig | ModuleFederationConfigOld,
): ModuleFederationConfig => {
  return isOldConfig(config) ? convertModuleFederationConfig(config) : config;
};

export const getModuleFederationConfigs = (
  fallbackToPackages = false,
  assemblerDir?: string,
): ModuleFederationConfig[] => {
  try {
    let configs: ModuleFederationConfig[];
    if (process.env.MODULE_FEDERATION_CONFIG) {
      const raw: (ModuleFederationConfig | ModuleFederationConfigOld)[] = JSON.parse(
        process.env.MODULE_FEDERATION_CONFIG,
      );
      configs = raw.map(normalizeConfig);
    } else if (fallbackToPackages) {
      const manifestConfigs = loadManifestMFConfigs();
      if (manifestConfigs) {
        configs = manifestConfigs;
      } else {
        configs = getWorkspacePackages()
          .map((pkg) => pkg['module-federation'] ?? pkg.moduleFederation)
          .filter((x): x is ModuleFederationConfig | ModuleFederationConfigOld => !!x)
          .map(normalizeConfig);
      }
    } else {
      return [];
    }

    if (assemblerDir) {
      configs = filterByAssembler(configs, assemblerDir);
    }
    return configs;
  } catch (e) {
    throw new Error(
      `Failed to process workspace packages for module federation: ${
        e instanceof Error ? e.message : String(e)
      }`,
    );
  }
};

/**
 * Get the local and remote URLs for a proxy service.
 */
export const getModuleFederationURL = ({
  localService,
  service,
}: ProxyService): { local: string; remote: string } => {
  return {
    local: `http://${localService?.host || 'localhost'}:${localService?.port ?? service.port}`,
    remote: `https://${service.name}.${
      service.namespace || process.env.OC_PROJECT || ''
    }.svc.cluster.local:${service.port}`,
  };
};
