import * as _ from 'lodash';
import { V1ConfigMap, V1Role, V1RoleBinding, V1RoleBindingList } from '@kubernetes/client-node';
import { FastifyRequest } from 'fastify';
import {
  BuildPhase,
  BuildKind,
  BuildStatus,
  ConsoleLinkKind,
  CSVKind,
  DashboardConfig,
  K8sResourceCommon,
  KubeFastifyInstance,
  OdhApplication,
  OdhDocument,
  QuickStart,
  SubscriptionKind,
  SubscriptionStatusData,
  Template,
  DataScienceClusterKindStatus,
  KnownLabels,
  AuthKind,
  OdhPlatformType,
} from './backendTypes';
import {
  DEFAULT_ACTIVE_TIMEOUT,
  DEFAULT_INACTIVE_TIMEOUT,
  ResourceWatcher,
  ResourceWatcherTimeUpdate,
} from './resourceWatcher';
import { getComponentFeatureFlags } from './features';
import { blankDashboardCR } from './constants';
import { getLink, getRouteForClusterId, getServiceLink } from './componentUtils';
import { isHttpError, errorHandler } from './backendUtils';
import { fetchClusterStatus } from './dsc';

const kubeErrorStatusCode = (e: unknown): number | undefined => {
  if (typeof e !== 'object' || e === null) {
    return undefined;
  }
  const sc = Reflect.get(e, 'statusCode');
  return typeof sc === 'number' ? sc : undefined;
};

const dashboardConfigMapName = 'odh-dashboard-config';
const consoleLinksGroup = 'console.openshift.io';
const consoleLinksVersion = 'v1';
const consoleLinksPlural = 'consolelinks';
const enabledAppsConfigMapName = process.env.ENABLED_APPS_CM ?? 'odh-enabled-applications-config';
const dashboardGroup = 'dashboard.opendatahub.io';
const dashboardVersion = 'v1';
const applicationsPlural = 'odhapplications';
const documentationsPlural = 'odhdocuments';
const quickStartsGroup = 'console.openshift.io';
const quickStartsVersion = 'v1';
const quickStartsPlural = 'odhquickstarts';

let dashboardConfigWatcher: ResourceWatcher<DashboardConfig>;
let authWatcher: ResourceWatcher<AuthKind>;
let clusterStatusWatcher: ResourceWatcher<DataScienceClusterKindStatus>;
let subscriptionWatcher: ResourceWatcher<SubscriptionStatusData>;
let appWatcher: ResourceWatcher<OdhApplication>;
let docWatcher: ResourceWatcher<OdhDocument>;
let buildsWatcher: ResourceWatcher<BuildStatus>;
let consoleLinksWatcher: ResourceWatcher<ConsoleLinkKind>;
let quickStartWatcher: ResourceWatcher<QuickStart>;

const DASHBOARD_CONFIG = {
  group: 'opendatahub.io',
  version: 'v1alpha',
  plural: 'odhdashboardconfigs',
  dashboardName: process.env.DASHBOARD_CONFIG || dashboardConfigMapName,
};

const fetchDashboardCR = async (fastify: KubeFastifyInstance): Promise<DashboardConfig[]> => {
  return fetchOrCreateDashboardCR(fastify).then((dashboardCR) => [dashboardCR]);
};

const fetchWatchedClusterStatus = async (
  fastify: KubeFastifyInstance,
): Promise<DataScienceClusterKindStatus[]> => {
  return fetchClusterStatus(fastify).then((clusterStatus) => [clusterStatus]);
};

const fetchOrCreateDashboardCR = async (fastify: KubeFastifyInstance): Promise<DashboardConfig> => {
  return fastify.kube.customObjectsApi
    .getNamespacedCustomObject(
      DASHBOARD_CONFIG.group,
      DASHBOARD_CONFIG.version,
      fastify.kube.namespace,
      DASHBOARD_CONFIG.plural,
      DASHBOARD_CONFIG.dashboardName,
    )
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s custom object body is loosely typed
      const dashboardCR = res.body as DashboardConfig;
      return _.merge({}, blankDashboardCR, dashboardCR); // merge with blank CR to prevent any missing values
    })
    .catch((e) => {
      fastify.log.warn(
        `Received error (${e.body.message}) fetching OdhDashboardConfig, creating new.`,
      );
      return createDashboardCR(fastify);
    });
};

// Do not contain any feature flags -- code overrides will do their trick until managed by users
const defaultDashboardCR = _.omit(blankDashboardCR, 'spec.dashboardConfig');
const createDashboardCR = (fastify: KubeFastifyInstance): Promise<DashboardConfig> => {
  return fastify.kube.customObjectsApi
    .createNamespacedCustomObject(
      DASHBOARD_CONFIG.group,
      DASHBOARD_CONFIG.version,
      fastify.kube.namespace,
      DASHBOARD_CONFIG.plural,
      defaultDashboardCR,
    )
    .then((result) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s create response body
      return result.body as DashboardConfig;
    })
    .catch((e) => {
      fastify.log.error(e, 'Error creating Dashboard CR: ');
      return defaultDashboardCR;
    });
};

const fetchSubscriptions = (fastify: KubeFastifyInstance): Promise<SubscriptionStatusData[]> => {
  const fetchAll = async (): Promise<SubscriptionStatusData[]> => {
    const installedCSVs: SubscriptionStatusData[] = [];
    let continueToken: string | undefined;
    let remainingItemCount: number | undefined = 1;
    try {
      while (remainingItemCount) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
        const res = (await fastify.kube.customObjectsApi.listNamespacedCustomObject(
          'operators.coreos.com',
          'v1alpha1',
          '',
          'subscriptions',
          undefined,
          continueToken,
          undefined,
          undefined,
          250,
        )) as {
          body: {
            items: SubscriptionKind[];
            metadata: { continue: string; remainingItemCount: number };
          };
        };
        const subs = res.body.items.map((sub) => ({
          channel: sub.spec.channel,
          installedCSV: sub.status?.installedCSV,
          installPlanRefNamespace: sub.status?.installPlanRef?.namespace,
          lastUpdated: sub.status?.lastUpdated ?? '',
        }));
        remainingItemCount = res.body.metadata.remainingItemCount;
        continueToken = res.body.metadata.continue;
        if (subs.length) {
          installedCSVs.push(...subs);
        }
      }
    } catch (e: unknown) {
      console.error(`ERROR: `, errorHandler(e));
    }
    return installedCSVs;
  };
  return fetchAll();
};

const fetchQuickStarts = async (fastify: KubeFastifyInstance): Promise<QuickStart[]> => {
  const fetchAll = async (): Promise<QuickStart[]> => {
    const installedQuickStarts: QuickStart[] = [];
    const appDefs = await fetchApplicationDefs(fastify);
    let continueToken: string | undefined;
    let remainingItemCount: number | undefined = 1;
    const featureFlags = getComponentFeatureFlags();

    const { customObjectsApi } = fastify.kube;
    try {
      while (remainingItemCount) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
        const res = (await customObjectsApi.listNamespacedCustomObject(
          quickStartsGroup,
          quickStartsVersion,
          fastify.kube.namespace,
          quickStartsPlural,
          undefined,
          continueToken,
          undefined,
          undefined,
          250,
        )) as {
          body: {
            items: QuickStart[];
            metadata: { _continue: string; remainingItemCount: number };
          };
        };
        const qStarts = res.body.items;
        remainingItemCount = res.body.metadata.remainingItemCount;
        continueToken = res.body.metadata._continue;

        qStarts.forEach((qStart) => {
          if (qStart.spec.featureFlag) {
            if (
              featureFlags[qStart.spec.featureFlag] &&
              appDefs.find((def) => def.metadata.name === qStart.spec.appName)
            ) {
              installedQuickStarts.push(qStart);
            }
            return;
          }
          if (appDefs.find((def) => def.metadata.name === qStart.spec.appName)) {
            installedQuickStarts.push(qStart);
          }
        });
      }
    } catch (e: unknown) {
      fastify.log.error(`Error fetching quick starts: ${errorHandler(e)}`);
    }

    return installedQuickStarts;
  };
  return fetchAll();
};

const fetchApplicationDefs = async (fastify: KubeFastifyInstance): Promise<OdhApplication[]> => {
  const fetchAll = async (): Promise<OdhApplication[]> => {
    const applicationDefs: OdhApplication[] = [];
    const featureFlags = getComponentFeatureFlags();
    const { customObjectsApi } = fastify.kube;
    let continueToken: string | undefined;
    let remainingItemCount: number | undefined = 1;
    try {
      while (remainingItemCount) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
        const res = (await customObjectsApi.listNamespacedCustomObject(
          dashboardGroup,
          dashboardVersion,
          fastify.kube.namespace,
          applicationsPlural,
          undefined,
          continueToken,
          undefined,
          undefined,
          250,
        )) as {
          body: {
            items: OdhApplication[];
            metadata: { _continue: string; remainingItemCount: number };
          };
        };
        const apps = res.body.items;
        remainingItemCount = res.body.metadata.remainingItemCount;
        continueToken = res.body.metadata._continue;
        apps.forEach((app) => {
          if (!app.spec.featureFlag || featureFlags[app.spec.featureFlag]) {
            applicationDefs.push(app);
          }
        });
      }
    } catch (e: unknown) {
      fastify.log.error(`Error fetching applications: ${errorHandler(e)}`);
    }
    return Promise.resolve(applicationDefs);
  };
  return fetchAll();
};

export const fetchApplications = async (
  fastify: KubeFastifyInstance,
): Promise<OdhApplication[]> => {
  const applicationDefs = await fetchApplicationDefs(fastify);
  const applications: OdhApplication[] = [];
  let changed = false;
  const enabledAppsCMData: { [key: string]: string } = {};

  const { coreV1Api } = fastify.kube;
  const { namespace } = fastify.kube;
  const enabledAppsCM: V1ConfigMap | null = await coreV1Api
    .readNamespacedConfigMap(enabledAppsConfigMapName, namespace)
    .then((result) => result.body)
    .catch((): null => null);
  for (const appDef of applicationDefs) {
    if (isIntegrationApp(appDef)) {
      // Ignore logic for apps that use internal routes for status information
      applications.push(appDef);
    } else {
      appDef.spec.shownOnEnabledPage = enabledAppsCM?.data?.[appDef.metadata.name] === 'true';
      appDef.spec.isEnabled = await getIsAppEnabled(fastify, appDef).catch((e: unknown) => {
        fastify.log.warn(
          `"${
            appDef.metadata.name
          }" OdhApplication is being disabled due to an error determining if it's enabled. ${errorHandler(
            e,
          )}`,
        );

        return false;
      });
      if (appDef.spec.isEnabled) {
        if (!appDef.spec.shownOnEnabledPage) {
          changed = true;
          enabledAppsCMData[appDef.metadata.name] = 'true';
          appDef.spec.shownOnEnabledPage = true;
        }
      }
      applications.push({
        ...appDef,
        spec: {
          ...appDef.spec,
          getStartedLink: getRouteForClusterId(fastify, appDef.spec.getStartedLink),
          link: appDef.spec.isEnabled ? await getRouteForApplication(fastify, appDef) : null,
        },
      });
    }
  }
  if (changed) {
    // write enabled apps configmap
    const cmBody: V1ConfigMap = {
      metadata: {
        name: enabledAppsConfigMapName,
        namespace,
      },
      data: enabledAppsCMData,
    };
    if (!enabledAppsCM) {
      await coreV1Api.createNamespacedConfigMap(namespace, cmBody);
    } else {
      cmBody.data = { ...(enabledAppsCM.data ?? {}), ...enabledAppsCMData };
      await coreV1Api.replaceNamespacedConfigMap(enabledAppsConfigMapName, namespace, cmBody);
    }
  }
  return Promise.resolve(applications);
};

const fetchDocs = async (fastify: KubeFastifyInstance): Promise<OdhDocument[]> => {
  const fetchAll = async (): Promise<OdhDocument[]> => {
    const docs: OdhDocument[] = [];
    const featureFlags = getComponentFeatureFlags();
    const appDefs = await fetchApplicationDefs(fastify);
    let continueToken: string | undefined;
    let remainingItemCount: number | undefined = 1;
    const { customObjectsApi } = fastify.kube;
    try {
      while (remainingItemCount) {
        // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
        const res = (await customObjectsApi.listNamespacedCustomObject(
          dashboardGroup,
          dashboardVersion,
          fastify.kube.namespace,
          documentationsPlural,
          undefined,
          continueToken,
          undefined,
          undefined,
          250,
        )) as {
          body: {
            items: OdhDocument[];
            metadata: { _continue: string; remainingItemCount: number };
          };
        };
        const odhDocuments = res.body.items;
        remainingItemCount = res.body.metadata.remainingItemCount;
        continueToken = res.body.metadata._continue;

        odhDocuments.forEach((doc) => {
          if (doc.spec.featureFlag) {
            if (
              featureFlags[doc.spec.featureFlag] &&
              appDefs.find((def) => def.metadata.name === doc.spec.appName)
            ) {
              docs.push(doc);
            }
            return;
          }
          docs.push(doc);
        });
      }
    } catch (e: unknown) {
      fastify.log.error(`Error fetching documentation resources: ${errorHandler(e)}`);
    }

    return Promise.resolve(docs);
  };
  return fetchAll();
};

const getBuildNumber = (build: BuildKind): number => {
  const buildNumber = build.metadata?.annotations?.['openshift.io/build.number'];
  if (!buildNumber) {
    return 0;
  }
  const n = parseInt(buildNumber, 10);
  return Number.isFinite(n) ? n : 0;
};

const PENDING_PHASES = [BuildPhase.new, BuildPhase.pending, BuildPhase.cancelled];

const compareBuilds = (b1: BuildKind, b2: BuildKind) => {
  const b1Pending = PENDING_PHASES.includes(b1.status.phase);
  const b2Pending = PENDING_PHASES.includes(b2.status.phase);

  if (b1Pending && !b2Pending) {
    return -1;
  }
  if (b2Pending && !b1Pending) {
    return 1;
  }
  return getBuildNumber(b1) - getBuildNumber(b2);
};

const getBuildConfigStatus = (
  fastify: KubeFastifyInstance,
  buildConfig: K8sResourceCommon,
): Promise<BuildStatus> => {
  const bcName = buildConfig.metadata?.name ?? '';
  const notebookName = buildConfig.metadata?.labels?.['opendatahub.io/notebook-name'] || bcName;
  return fastify.kube.customObjectsApi
    .listNamespacedCustomObject(
      'build.openshift.io',
      'v1',
      fastify.kube.namespace,
      'builds',
      undefined,
      undefined,
      undefined,
      `buildconfig=${bcName}`,
    )
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
      const bcBuilds = (res.body as { items: BuildKind[] }).items;
      if (!bcBuilds.length) {
        return {
          name: notebookName,
          status: BuildPhase.none,
        };
      }
      const mostRecent = bcBuilds.toSorted(compareBuilds).pop();
      if (!mostRecent) {
        return {
          name: notebookName,
          status: BuildPhase.none,
        };
      }
      return {
        name: notebookName,
        status: mostRecent.status.phase,
        timestamp: mostRecent.status.completionTimestamp || mostRecent.status.startTimestamp,
      };
    })
    .catch((e: unknown) => {
      fastify.log.error(`failed to get build configs: ${errorHandler(e)}`);
      return {
        name: notebookName,
        status: BuildPhase.pending,
      };
    });
};

export const fetchBuilds = async (fastify: KubeFastifyInstance): Promise<BuildStatus[]> => {
  const buildConfigs: K8sResourceCommon[] = await fastify.kube.customObjectsApi
    .listNamespacedCustomObject(
      'build.openshift.io',
      'v1',
      fastify.kube.namespace,
      'buildconfigs',
      undefined,
      undefined,
      undefined,
      'opendatahub.io/build_type=notebook_image',
    )
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
      return (res.body as { items: K8sResourceCommon[] }).items;
    })
    .catch(() => {
      return [];
    });

  const getters = buildConfigs.map(async (buildConfig) => {
    return getBuildConfigStatus(fastify, buildConfig);
  });

  return Promise.all(getters);
};

const getRefreshTimeForBuilds = (buildStatuses: BuildStatus[]): ResourceWatcherTimeUpdate => {
  const runningStatuses = ['pending', 'running', 'cancelled'];
  const building = buildStatuses.filter((buildStatus) =>
    runningStatuses.includes(buildStatus.status.toLowerCase()),
  );
  if (building.length) {
    return { activeWatchInterval: 30 * 1000, inactiveWatchInterval: DEFAULT_INACTIVE_TIMEOUT };
  }

  return {
    activeWatchInterval: DEFAULT_ACTIVE_TIMEOUT,
    inactiveWatchInterval: DEFAULT_INACTIVE_TIMEOUT,
  };
};

const fetchConsoleLinks = async (fastify: KubeFastifyInstance) => {
  return fastify.kube.customObjectsApi
    .listClusterCustomObject(consoleLinksGroup, consoleLinksVersion, consoleLinksPlural)
    .then((res) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s list response shape
      return (res.body as { items: ConsoleLinkKind[] }).items;
    })
    .catch((e) => {
      fastify.log.error(e, 'failed to get ConsoleLinks');
      return [];
    });
};

const fetchAuthKind = (fastify: KubeFastifyInstance): Promise<AuthKind[]> => {
  return fastify.kube.customObjectsApi
    .getClusterCustomObject('services.platform.opendatahub.io', 'v1alpha1', 'auths', 'auth')
    .then((response) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s get response shape
      return response.body as AuthKind;
    })
    .then((auth) => [auth]);
};

export const initializeWatchedResources = (fastify: KubeFastifyInstance): void => {
  dashboardConfigWatcher = new ResourceWatcher<DashboardConfig>(fastify, fetchDashboardCR);
  authWatcher = new ResourceWatcher<AuthKind>(fastify, fetchAuthKind);
  clusterStatusWatcher = new ResourceWatcher<DataScienceClusterKindStatus>(
    fastify,
    fetchWatchedClusterStatus,
  );
  subscriptionWatcher = new ResourceWatcher<SubscriptionStatusData>(fastify, fetchSubscriptions);
  appWatcher = new ResourceWatcher<OdhApplication>(fastify, fetchApplications);
  docWatcher = new ResourceWatcher<OdhDocument>(fastify, fetchDocs);
  quickStartWatcher = new ResourceWatcher<QuickStart>(fastify, fetchQuickStarts);
  buildsWatcher = new ResourceWatcher<BuildStatus>(fastify, fetchBuilds, getRefreshTimeForBuilds);
  consoleLinksWatcher = new ResourceWatcher<ConsoleLinkKind>(fastify, fetchConsoleLinks);
};

/**
 * Sometimes we need to lockout a feature while we look to remove it more properly. This function
 * can help align the feature to being disabled.
 */
const applyFeatureLockouts = (config: DashboardConfig): DashboardConfig => ({
  ...config,
  spec: {
    ...config.spec,
    dashboardConfig: {
      ...config.spec.dashboardConfig,
      // Apply Feature Lockouts Directly below
      // Feature flags noted below are removable from the CRD at the earliest convenience
      // Do note, update the CRD is a backwards incompatible step and needs an up-version
      //---------------------------------------

      /**
       * Fine Tuning feature is no longer supported
       */
      disableFineTuning: true,

      /**
       * MLflow is now always enabled when the operator component is present
       */
      mlflow: true,
    },
  },
});

const FEATURE_FLAGS_HEADER = 'x-odh-feature-flags';

// if inspecting feature flags, provide the request to ensure overridden feature flags are considered
export const getDashboardConfig = (request?: FastifyRequest): DashboardConfig => {
  const dashboardConfig = dashboardConfigWatcher.getResources()[0];
  if (request) {
    const flagsHeader = request.headers[FEATURE_FLAGS_HEADER];
    if (typeof flagsHeader === 'string') {
      try {
        const featureFlags = JSON.parse(flagsHeader);
        return applyFeatureLockouts({
          ...dashboardConfig,
          spec: {
            ...dashboardConfig.spec,
            dashboardConfig: {
              ...dashboardConfig.spec.dashboardConfig,
              ...featureFlags,
            },
          },
        });
      } catch {
        // ignore
      }
    }
  }
  return applyFeatureLockouts(dashboardConfig);
};

export const getClusterStatus = (
  fastify: KubeFastifyInstance,
): DataScienceClusterKindStatus | undefined => {
  const clusterStatus = clusterStatusWatcher.getResources().at(0);
  if (!clusterStatus) {
    fastify.log.error('Tried to use DSC before ResourceWatcher could successfully fetch it');
  }
  return clusterStatus;
};

export const updateDashboardConfig = (): Promise<void> => {
  return dashboardConfigWatcher.updateResults();
};

export const getSubscriptions = (): SubscriptionStatusData[] => {
  return subscriptionWatcher.getResources();
};

export const getApplications = (): OdhApplication[] => {
  return appWatcher.getResources();
};

export const updateApplications = (): Promise<void> => {
  return appWatcher.updateResults();
};

export const getApplication = (appName: string): OdhApplication | undefined => {
  const apps = getApplications();
  return apps.find((app) => app.metadata.name === appName);
};

export const getAuth = (): AuthKind => {
  return authWatcher.getResources()[0];
};

export const getDocs = (): OdhDocument[] => {
  return docWatcher.getResources();
};

export const getQuickStarts = (): QuickStart[] => {
  return quickStartWatcher.getResources();
};

export const getBuildStatuses = (): BuildStatus[] => {
  return buildsWatcher.getResources();
};

export const getConsoleLinks = (): ConsoleLinkKind[] => {
  return consoleLinksWatcher.getResources();
};

const getConsoleLinkRoute = (appDef: OdhApplication): string | null => {
  if (!appDef.spec.consoleLink) {
    return null;
  }
  const consoleLink = getConsoleLinks().find((cl) => cl.metadata?.name === appDef.spec.consoleLink);
  return consoleLink ? consoleLink.spec.href : null;
};

export const checkJupyterEnabled = (): boolean =>
  getDashboardConfig().spec.notebookController?.enabled !== false;

export const getApplicationEnabledConfigMap = async (
  fastify: KubeFastifyInstance,
  appDef: OdhApplication,
): Promise<boolean> => {
  const { namespace } = fastify.kube;
  const name = appDef.spec.enable?.validationConfigMap;
  if (!name) {
    return false;
  }
  const { coreV1Api } = fastify.kube;
  const enabledCM = await coreV1Api
    .readNamespacedConfigMap(name, namespace)
    .then((result) => result.body)
    .catch(() => null);
  if (!enabledCM) {
    return false;
  }
  return enabledCM.data?.validation_result === 'true';
};

const getField = (obj: unknown, path: string, defaultValue?: string): string => {
  const travel = (regexp: RegExp): unknown =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res: unknown, key: string) => {
        if (res === null || res === undefined) {
          return res;
        }
        if (typeof res !== 'object' && typeof res !== 'function') {
          return res;
        }
        return Reflect.get(res, key);
      }, obj);
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/);
  if (result === undefined || result === obj) {
    return defaultValue ?? '';
  }
  if (typeof result === 'string') {
    return result;
  }
  return String(result);
};

const getCREnabledForApp = (
  fastify: KubeFastifyInstance,
  appDef: OdhApplication,
): Promise<boolean> => {
  const { enableCR } = appDef.spec;
  // Typed as required; real CRs may omit it—keep runtime guard
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- K8s manifests may omit nested fields despite types
  if (!enableCR) {
    return Promise.resolve(false);
  }

  const { customObjectsApi } = fastify.kube;
  const namespace = enableCR.namespace || fastify.kube.namespace;
  const { group, version, plural, name } = enableCR;
  return customObjectsApi
    .getNamespacedCustomObject(group, version, namespace, plural, name)
    .then((res) => getField(res.body, enableCR.field ?? '') === enableCR.value)
    .catch(() => false);
};

const getCSVForApp = (
  fastify: KubeFastifyInstance,
  app: OdhApplication,
): Promise<K8sResourceCommon | undefined> => {
  if (!app.spec.csvName) {
    return Promise.resolve(undefined);
  }

  const { csvName } = app.spec;

  const subsStatus = getSubscriptions();
  const subStatus = subsStatus.find((st) => st.installedCSV?.startsWith(csvName));

  if (!subStatus) {
    return Promise.resolve(undefined);
  }

  const { installedCSV } = subStatus;

  if (!installedCSV) {
    return Promise.resolve(undefined);
  }

  const namespace = subStatus.installPlanRefNamespace;
  if (!namespace) {
    return Promise.resolve(undefined);
  }

  return fastify.kube.customObjectsApi
    .getNamespacedCustomObject(
      'operators.coreos.com',
      'v1alpha1',
      namespace,
      'clusterserviceversions',
      installedCSV,
    )
    .then((response) => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- k8s get response shape
      const csv = response.body as CSVKind;
      if (csv.status.phase === 'Succeeded') {
        return csv;
      }
      return undefined;
    })
    .catch((e) => {
      if (isHttpError(e) && e.statusCode === 404) {
        // eslint-disable-next-line no-console
        console.error(e);
        return undefined;
      }
      throw e;
    });
};

export const getIsAppEnabled = async (
  fastify: KubeFastifyInstance,
  appDef: OdhApplication,
): Promise<boolean> => {
  if (appDef.spec.category === 'Red Hat managed') {
    return true;
  }

  const enabledCM = await getApplicationEnabledConfigMap(fastify, appDef);
  if (enabledCM) {
    return true;
  }
  const crEnabled = await getCREnabledForApp(fastify, appDef);
  if (crEnabled) {
    return true;
  }

  if (await getCSVForApp(fastify, appDef)) {
    return true;
  }

  return false;
};

export const getRouteForApplication = async (
  fastify: KubeFastifyInstance,
  app: OdhApplication,
): Promise<string | null> => {
  const endpointRoute = getRouteForClusterId(fastify, app.spec.endpoint ?? '');
  if (endpointRoute) {
    return endpointRoute;
  }

  let route = await getLink(fastify, app.spec.route ?? '');
  if (route) {
    return route;
  }

  const operatorCSV = await getCSVForApp(fastify, app);
  route = await getLink(
    fastify,
    app.spec.route ?? '',
    app.spec.routeNamespace || operatorCSV?.metadata?.namespace || '',
    app.spec.routeSuffix ?? '',
  );
  if (route) {
    return route;
  }

  const consoleRoute = getConsoleLinkRoute(app);
  if (consoleRoute) {
    return consoleRoute;
  }

  return getServiceLink(fastify, app.spec.serviceName ?? '', app.spec.routeSuffix ?? '');
};

const shouldMigrationContinue = async (
  fastify: KubeFastifyInstance,
  configMapName: string,
  description: string,
): Promise<boolean> =>
  fastify.kube.coreV1Api
    .readNamespacedConfigMap(configMapName, fastify.kube.namespace)
    .then(() => {
      // Found configmap, not continuing
      fastify.log.info(`${description} migration already completed, skipping`);
      return false;
    })
    .catch((e: unknown) => {
      if (kubeErrorStatusCode(e) === 404) {
        // No config saying we have already migrated, continue
        return true;
      }
      throw `fetching ${description} migration configmap had a ${
        kubeErrorStatusCode(e) ?? 'unknown'
      } error: ${errorHandler(e)}`;
    });

const createSuccessfulMigrationConfigMap = async (
  fastify: KubeFastifyInstance,
  configMapName: string,
  description: string,
): Promise<void> => {
  // Create configmap to flag operation as successful
  const configMap: V1ConfigMap = {
    metadata: {
      name: configMapName,
      namespace: fastify.kube.namespace,
    },
    data: {
      migratedCompleted: 'true',
    },
  };
  return fastify.kube.coreV1Api
    .createNamespacedConfigMap(fastify.kube.namespace, configMap)
    .then(() => fastify.log.info(`Successfully migrated ${description}`))
    .catch((e: unknown) => {
      throw `A ${
        kubeErrorStatusCode(e) ?? 'unknown'
      } error occurred when trying to create configmap for ${description} migration: ${errorHandler(
        e,
      )}`;
    });
};

export const cleanupKserveRoleBindings = async (fastify: KubeFastifyInstance): Promise<void> => {
  // When we startup — in kube.ts we can handle a migration (catch ALL promise errors — exit gracefully and use fastify logging)
  // Check for migration-kserve-inferenceservices-role configmap in dashboard namespace — if found, exit early
  const CONFIG_MAP_NAME = 'migration-kserve-inferenceservices-role';
  const DESCRIPTION = 'KServe secure rolebindings';

  const continueProcessing = await shouldMigrationContinue(fastify, CONFIG_MAP_NAME, DESCRIPTION);

  if (continueProcessing) {
    const roleBindings = await fastify.kube.customObjectsApi.listClusterCustomObject(
      'rbac.authorization.k8s.io',
      'v1',
      'rolebindings',
      undefined,
      undefined,
      undefined,
      `${KnownLabels.DASHBOARD_RESOURCE} = true`,
    );
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- customObjects cluster list raw body
    const kserveSARoleBindings = (roleBindings.body as V1RoleBindingList).items.filter(
      ({ roleRef, subjects, metadata }) =>
        roleRef.kind === 'ClusterRole' &&
        roleRef.name === 'view' &&
        subjects?.length === 1 &&
        subjects[0].kind === 'ServiceAccount' &&
        metadata?.ownerReferences?.length === 1 &&
        metadata.ownerReferences[0].kind === 'InferenceService',
    );

    const replaceRoleBinding = async (existingRoleBinding: V1RoleBinding) => {
      const inferenceServiceName = existingRoleBinding.metadata?.ownerReferences?.[0]?.name ?? '';
      const namespace = existingRoleBinding.metadata?.namespace ?? '';
      const newRoleBindingName = `${inferenceServiceName}-view`;
      const newRoleName = `${inferenceServiceName}-view-role`;

      const newRole: V1Role = {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'Role',
        metadata: {
          name: newRoleName,
          namespace,
          labels: {
            [KnownLabels.DASHBOARD_RESOURCE]: 'true',
          },
        },
        rules: [
          {
            verbs: ['get'],
            apiGroups: ['serving.kserve.io'],
            resources: ['inferenceservices'],
            resourceNames: [inferenceServiceName],
          },
        ],
      };

      const newRoleBinding: V1RoleBinding = {
        kind: 'RoleBinding',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        metadata: {
          name: newRoleBindingName,
          namespace,
          labels: existingRoleBinding.metadata?.labels,
          ownerReferences: existingRoleBinding.metadata?.ownerReferences,
        },
        subjects: existingRoleBinding.subjects,
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Role',
          name: newRoleName,
        },
      };

      // Create new role if it doesn't already exist
      await fastify.kube.customObjectsApi
        .getNamespacedCustomObject(
          'rbac.authorization.k8s.io',
          'v1',
          namespace,
          'roles',
          newRoleName,
        )
        .catch((e: unknown) => {
          if (kubeErrorStatusCode(e) === 404) {
            return fastify.kube.customObjectsApi.createNamespacedCustomObject(
              'rbac.authorization.k8s.io',
              'v1',
              namespace,
              'roles',
              newRole,
            );
          }
          return undefined;
        });

      // Delete and replace old RB because we can't patch rolebindings
      await fastify.kube.customObjectsApi.deleteNamespacedCustomObject(
        'rbac.authorization.k8s.io',
        'v1',
        namespace,
        'rolebindings',
        existingRoleBinding.metadata?.name ?? '',
      );
      await fastify.kube.customObjectsApi.createNamespacedCustomObject(
        'rbac.authorization.k8s.io',
        'v1',
        namespace,
        'rolebindings',
        newRoleBinding,
      );
    };

    await Promise.all(kserveSARoleBindings.map(replaceRoleBinding));

    await createSuccessfulMigrationConfigMap(fastify, CONFIG_MAP_NAME, DESCRIPTION);
  }
};

export const isRHOAI = (fastify: KubeFastifyInstance): boolean => {
  const releaseName = getClusterStatus(fastify)?.release?.name;
  return (
    releaseName === OdhPlatformType.SELF_MANAGED_RHOAI ||
    releaseName === OdhPlatformType.MANAGED_RHOAI
  );
};

export const getServingRuntimeNameFromTemplate = (template: Template): string =>
  template.objects[0].metadata.name;

export const translateDisplayNameForK8s = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/\s/g, '-')
    .replace(/[^A-Za-z0-9-]/g, '');
export const isIntegrationApp = (app: OdhApplication): boolean =>
  Boolean(app.spec.internalRoute?.startsWith('/api/'));
