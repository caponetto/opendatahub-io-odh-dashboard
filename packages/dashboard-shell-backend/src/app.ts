import * as fs from 'fs';
import * as path from 'path';
import staticPlugin from '@fastify/static';
import viewPlugin from '@fastify/view';
import autoloadPlugin from '@fastify/autoload';
import sensiblePlugin from '@fastify/sensible';
import websocketPlugin from '@fastify/websocket';
import acceptsPlugin from '@fastify/accepts';
import type { FastifyPluginAsync } from 'fastify';
import ejs from 'ejs';
import { LOG_DIR } from '@odh-dashboard/dashboard-foundation-backend/constants';

interface AppOptions {
  publicDir: string;
  assemblerDir?: string;
  routeDirs?: string[];
  pluginDirs?: string[];
}

const builtinPluginsDir = path.join(__dirname, 'plugins');
const builtinRoutesDir = path.join(__dirname, 'routes');

const shouldIgnoreAutoloadPath = (filePath: string): boolean =>
  /(^|[\\/])__tests__([\\/]|$)/.test(filePath) || /\.(spec|test)\.(ts|js|cjs|mjs)$/.test(filePath);

export const initializeApp: FastifyPluginAsync<AppOptions> = async (fastify, opts) => {
  const { publicDir } = opts;
  const pluginDirs = opts.pluginDirs ?? [];
  const routeDirs = opts.routeDirs ?? [];

  if (!fs.existsSync(LOG_DIR)) {
    fastify.log.info(`${LOG_DIR} does not exist. Creating`);
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }

  fastify.register(sensiblePlugin);
  fastify.register(websocketPlugin);

  fastify.register(staticPlugin, {
    root: publicDir,
    wildcard: false,
    index: false,
  });

  ejs.delimiter = '?';
  fastify.register(viewPlugin, {
    engine: { ejs },
    root: publicDir,
    viewExt: 'html',
    includeViewExtension: true,
  });

  const autoloadOpts = {
    options: { ...opts },
    ignorePattern: /^__tests__$|\.(spec|test)\.(ts|js|cjs|mjs)$/,
    ignoreFilter: shouldIgnoreAutoloadPath,
  };

  if (fs.existsSync(builtinPluginsDir)) {
    fastify.register(autoloadPlugin, {
      ...autoloadOpts,
      dir: builtinPluginsDir,
    });
  }

  for (const pluginDir of pluginDirs) {
    if (fs.existsSync(pluginDir)) {
      fastify.register(autoloadPlugin, {
        ...autoloadOpts,
        dir: pluginDir,
      });
    }
  }

  if (fs.existsSync(builtinRoutesDir)) {
    fastify.register(autoloadPlugin, {
      ...autoloadOpts,
      dir: builtinRoutesDir,
    });
  }

  for (const routeDir of routeDirs) {
    if (!fs.existsSync(routeDir)) {
      continue;
    }
    if (fs.statSync(routeDir).isDirectory()) {
      fastify.register(autoloadPlugin, {
        ...autoloadOpts,
        dir: routeDir,
      });
    } else {
      // Route entry file (e.g. from plugin auto-discovery)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const routePlugin = require(routeDir);
      fastify.register(routePlugin.default ?? routePlugin);
    }
  }

  fastify.register(acceptsPlugin);
};
