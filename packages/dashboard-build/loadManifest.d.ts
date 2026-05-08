export type ProxyService = {
  authorize?: boolean;
  tls?: boolean;
  localService?: {
    host?: string;
    port?: number;
  };
  service: {
    name: string;
    namespace: string;
    port: number;
  };
  headers?: Record<string, string>;
};

export type ModuleFederationConfig = {
  name: string;
  workspacePackage?: string;
  backend?: {
    remoteEntry: string;
  } & ProxyService;
  proxyService?: ({
    path: string;
    pathRewrite?: string;
  } & ProxyService)[];
};

export type ModuleFederationConfigOld = {
  name: string;
  remoteEntry: string;
  tls?: boolean;
  authorize?: boolean;
  proxy?: {
    path: string;
    pathRewrite?: string;
  }[];
  local?: {
    host?: string;
    port?: number;
  };
  service: {
    name: string;
    namespace?: string;
    port: number;
  };
};

export interface ManifestPackage {
  name: string;
  path: string;
  extensionsExport?: string;
  routesExport?: string;
  moduleFederation?: ModuleFederationConfig | ModuleFederationConfigOld;
  topology?: {
    tier?: string;
  };
}

export interface WorkspacePackage extends ManifestPackage {
  exports?: Record<string, string>;
  'module-federation'?: ModuleFederationConfig | ModuleFederationConfigOld;
}

export function loadManifest(): ManifestPackage[] | null;
export function getWorkspacePackages(): WorkspacePackage[];
export function resetCache(): void;
export const MANIFEST_FILENAME: string;
export const MANIFEST_PATH: string;
