import { PluginStore } from '../plugin-store';

describe('PluginStore', () => {
  it('should filter extensions based on feature flags', () => {
    const pluginStore = new PluginStore({
      test: [
        {
          type: 'test',
          flags: {
            required: ['test'],
            disallowed: ['test2'],
          },
          properties: {},
        },
      ],
    });

    expect(pluginStore.getExtensions()).toHaveLength(0);

    pluginStore.setFeatureFlags({
      test: true,
    });

    expect(pluginStore.getExtensions()).toHaveLength(0);

    pluginStore.setFeatureFlags({
      test: true,
      test2: false,
    });

    expect(pluginStore.getExtensions()).toHaveLength(1);

    pluginStore.setFeatureFlags({
      test: true,
      test2: true,
    });

    expect(pluginStore.getExtensions()).toHaveLength(0);

    pluginStore.setFeatureFlags({
      test: false,
      test2: true,
    });

    expect(pluginStore.getExtensions()).toHaveLength(0);
  });

  describe('extension overrides', () => {
    it('should hide a target extension', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.navigation/section',
            properties: { id: 'ai-hub', title: 'AI hub' },
          },
          {
            type: 'app.navigation/href',
            properties: { id: 'home', title: 'Home', href: '/' },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/section',
              targetId: 'ai-hub',
              hide: true,
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].properties).toMatchObject({ id: 'home' });
    });

    it('should patch properties on a target extension', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.tab-route/page',
            properties: {
              id: 'models-tab-page',
              title: 'Models',
              section: 'ai-hub',
              group: '1_models',
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.tab-route/page',
              targetId: 'models-tab-page',
              patch: {
                title: 'Model Serving',
                group: '3_model_serving',
              },
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      expect(extensions).toHaveLength(1);
      expect(extensions[0].properties).toMatchObject({
        id: 'models-tab-page',
        title: 'Model Serving',
        section: 'ai-hub',
        group: '3_model_serving',
      });
    });

    it('should unset a property when patched with null', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.tab-route/page',
            properties: {
              id: 'models-tab-page',
              title: 'Models',
              section: 'ai-hub',
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.tab-route/page',
              targetId: 'models-tab-page',
              patch: { section: null },
            },
          },
        ],
      });

      const ext = store.getExtensions()[0];
      expect(ext.properties).toMatchObject({ id: 'models-tab-page', title: 'Models' });
      expect(ext.properties).not.toHaveProperty('section');
    });

    it('should apply multiple overrides in order (later plugin wins)', () => {
      const store = new PluginStore({
        pluginA: [
          {
            type: 'app.navigation/href',
            properties: { id: 'item', title: 'Original', href: '/a' },
          },
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'item',
              patch: { title: 'From A' },
            },
          },
        ],
        pluginB: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'item',
              patch: { title: 'From B' },
            },
          },
        ],
      });

      const ext = store.getExtensions()[0];
      expect(ext.properties).toMatchObject({ id: 'item', title: 'From B', href: '/a' });
    });

    it('should remove override extensions from the final list', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.navigation/href',
            properties: { id: 'item', title: 'Item', href: '/' },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'item',
              patch: { title: 'Patched' },
            },
          },
        ],
      });

      const types = store.getExtensions().map((e) => e.type);
      expect(types).not.toContain('app.extension/override');
    });

    it('should respect feature flags on override extensions', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.navigation/section',
            properties: { id: 'ai-hub', title: 'AI hub' },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            flags: { required: ['slim-mode'] },
            properties: {
              targetType: 'app.navigation/section',
              targetId: 'ai-hub',
              hide: true,
            },
          },
        ],
      });

      expect(store.getExtensions()).toHaveLength(1);
      expect(store.getExtensions()[0].properties).toMatchObject({ id: 'ai-hub' });

      store.setFeatureFlags({ 'slim-mode': true });
      expect(store.getExtensions()).toHaveLength(0);
    });

    it('should be a no-op when no overrides exist', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.navigation/href',
            properties: { id: 'home', title: 'Home', href: '/' },
          },
          {
            type: 'app.navigation/href',
            properties: { id: 'settings', title: 'Settings', href: '/settings' },
          },
        ],
      });

      expect(store.getExtensions()).toHaveLength(2);
    });
  });

  describe('auto-redirect on href/path override', () => {
    it('should generate a redirect when href is overridden', () => {
      const store = new PluginStore({
        feature: [
          {
            type: 'app.navigation/href',
            properties: {
              id: 'my-item',
              title: 'My Item',
              href: '/old/path',
            },
          },
          {
            type: 'app.route',
            properties: {
              path: '/old/path',
              component: () => Promise.resolve({ default: () => null }),
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'my-item',
              patch: { href: '/new/path' },
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      const redirects = extensions.filter((e) => e.type === 'app.route/redirect');

      expect(redirects).toHaveLength(2);
      expect(redirects[0].properties).toMatchObject({ from: '/old/path', to: '/new/path' });
      expect(redirects[1].properties).toMatchObject({ from: '/old/path/*', to: '/new/path/*' });
    });

    it('should rewrite matching app.route path when href is overridden', () => {
      const store = new PluginStore({
        feature: [
          {
            type: 'app.navigation/href',
            properties: {
              id: 'runtimes',
              title: 'Serving runtimes',
              href: '/settings/model-resources/serving-runtimes',
              path: '/settings/model-resources/serving-runtimes/*',
            },
          },
          {
            type: 'app.route',
            properties: {
              path: '/settings/model-resources/serving-runtimes/*',
              component: () => Promise.resolve({ default: () => null }),
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'runtimes',
              patch: {
                href: '/settings/serving-runtimes',
                path: '/settings/serving-runtimes/*',
              },
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      const route = extensions.find((e) => e.type === 'app.route');
      expect(route?.properties.path).toBe('/settings/serving-runtimes/*');
    });

    it('should generate redirect for tab-route/page path override', () => {
      const store = new PluginStore({
        shell: [
          {
            type: 'app.tab-route/page',
            properties: {
              id: 'models-tab-page',
              title: 'Models',
              href: '/ai-hub/models',
              path: '/ai-hub/models/*',
            },
          },
          {
            type: 'app.route',
            properties: {
              path: '/ai-hub/models/deployments/*',
              component: () => Promise.resolve({ default: () => null }),
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.tab-route/page',
              targetId: 'models-tab-page',
              patch: { href: '/model-serving', path: '/model-serving/*' },
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      const redirects = extensions.filter((e) => e.type === 'app.route/redirect');
      expect(redirects.length).toBeGreaterThanOrEqual(2);

      const fromPaths = redirects.map((r) => r.properties.from);
      expect(fromPaths).toContain('/ai-hub/models');
      expect(fromPaths).toContain('/ai-hub/models/*');

      const route = extensions.find((e) => e.type === 'app.route');
      expect(route?.properties.path).toBe('/model-serving/deployments/*');
    });

    it('should not generate redirects when only non-path properties change', () => {
      const store = new PluginStore({
        feature: [
          {
            type: 'app.navigation/href',
            properties: {
              id: 'runtimes',
              title: 'Serving runtimes',
              href: '/settings/serving-runtimes',
              section: 'model-ops',
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'runtimes',
              patch: { section: 'settings', title: 'Runtimes' },
            },
          },
        ],
      });

      const extensions = store.getExtensions();
      const redirects = extensions.filter((e) => e.type === 'app.route/redirect');
      expect(redirects).toHaveLength(0);
    });

    it('should handle wildcard path overrides without duplicating wildcard redirects', () => {
      const store = new PluginStore({
        feature: [
          {
            type: 'app.navigation/href',
            properties: {
              id: 'item',
              title: 'Item',
              href: '/old',
              path: '/old/*',
            },
          },
        ],
        assembler: [
          {
            type: 'app.extension/override',
            properties: {
              targetType: 'app.navigation/href',
              targetId: 'item',
              patch: { href: '/new', path: '/new/*' },
            },
          },
        ],
      });

      const redirects = store.getExtensions().filter((e) => e.type === 'app.route/redirect');

      const fromPaths = redirects.map((r) => r.properties.from);
      expect(fromPaths).toContain('/old');
      expect(fromPaths).toContain('/old/*');
      expect(fromPaths.filter((p) => p === '/old/*')).toHaveLength(1);
    });
  });
});
