import type { Extension, CodeRef } from '@odh-dashboard/plugin-core';
import type {
  NavExtension,
  RouteExtension,
  TabRoutePageExtension,
} from '@odh-dashboard/plugin-core/extension-points';
// eslint-disable-next-line no-restricted-syntax
import { SupportedArea } from '@odh-dashboard/dashboard-foundation-frontend/concepts/areas';
import type {
  AutofillConnectionButtonExtension,
  NamespaceSelectorExtension,
} from '@mf/modelRegistry/extension-points';

/** @deprecated Migrate to RBAC. See ADMIN_USER in @odh-dashboard/plugin-core */
const ADMIN_USER = 'ADMIN_USER';

const createRedirectComponent = (args: { from: string; to: string }) => () =>
  import('@odh-dashboard/dashboard-foundation-frontend/utilities/v2Redirect').then((module) => ({
    default: () => module.buildV2RedirectElement(args),
  }));

const CATALOG_SETTINGS_PAGE_TITLE = 'Model catalog settings';
const CATALOG_SETTINGS_URL = '/settings/model-resources-operations/model-catalog';

type ModelCatalogBannerExtension = Extension<
  'model-catalog.page/banner',
  {
    id: string;
    component: CodeRef<React.ComponentType>;
  }
>;

type CatalogSettingsUrlExtension = Extension<
  'model-catalog.settings/url',
  {
    url: string;
    title: string;
  }
>;

const extensions: (
  | AutofillConnectionButtonExtension
  | NamespaceSelectorExtension
  | ModelCatalogBannerExtension
  | CatalogSettingsUrlExtension
  | NavExtension
  | TabRoutePageExtension
  | RouteExtension
  | Extension
)[] = [
  {
    type: 'app.navigation/section',
    properties: {
      id: 'ai-hub',
      title: 'AI hub',
      group: '3_ai_hub',
      iconRef: () =>
        import('@odh-dashboard/dashboard-foundation-frontend/images/icons/AiHubNavIcon'),
    },
  },
  {
    type: 'app.tab-route/page',
    properties: {
      id: 'models-tab-page',
      title: 'Models',
      href: '/ai-hub/models',
      path: '/ai-hub/models/*',
      group: '1_models',
      section: 'ai-hub',
      objectType: 'registered-models',
    },
  },
  {
    type: 'app.tab-route/page',
    properties: {
      id: 'mcp-servers-tab-page',
      title: 'MCP servers',
      href: '/ai-hub/mcp-servers',
      path: '/ai-hub/mcp-servers/*',
      group: '2_mcp_servers',
      section: 'ai-hub',
      objectType: 'mcp-catalog',
    },
  },
  {
    type: 'model-registry.register/autofill-connection',
    properties: {
      component: () => import('./connection/AutofillConnectionButton'),
    },
  },
  {
    type: 'model-catalog.page/banner',
    properties: {
      id: 'validated-models-banner',
      component: () => import('./modelCatalog/ValidatedModelsBanner').then((m) => m.default),
    },
  },
  {
    type: 'model-registry.admin/check',
    properties: {
      component: () => import('../upstream/frontend/src/odh/components/AdminCheck'),
    },
  },
  {
    type: 'model-catalog.settings/url',
    properties: {
      url: CATALOG_SETTINGS_URL,
      title: CATALOG_SETTINGS_PAGE_TITLE,
    },
  },
  {
    type: 'model-registry.namespace/selector',
    properties: {
      component: () => import('./projectSelector/ProjectSelectorField'),
    },
  },
  {
    type: 'app.context-provider',
    properties: {
      id: 'model-registries',
      provider: () =>
        import('./concepts/modelRegistry/context/ModelRegistriesContext').then(
          (m) => m.ModelRegistriesContextProvider,
        ),
    },
  },
  {
    type: 'app.external-redirect',
    properties: {
      path: '/catalog/*',
      component: () => import('./pages/external/CatalogModelRedirects'),
    },
  },
  {
    type: 'app.navigation/href',
    flags: {
      required: [SupportedArea.MODEL_REGISTRY, ADMIN_USER],
    },
    properties: {
      id: 'settings-model-registry',
      title: 'Model registry settings',
      href: '/settings/model-resources-operations/model-registry',
      section: 'settings-model-resources-and-operations',
      path: '/settings/model-resources-operations/model-registry/*',
      group: '3_model-resources',
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/settings/model-resources-operations/model-registry/*',
      component: () => import('./pages/modelRegistrySettings/ModelRegistrySettingsRoutes'),
    },
  },
  {
    type: 'app.route',
    flags: {
      required: [ADMIN_USER],
    },
    properties: {
      path: '/modelRegistrySettings/*',
      component: createRedirectComponent({
        from: '/modelRegistrySettings/*',
        to: '/settings/model-resources-operations/model-registry/*',
      }),
    },
  },
];

export default extensions;
