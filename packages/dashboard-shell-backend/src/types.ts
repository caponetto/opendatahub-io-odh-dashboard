import type { Server, IncomingMessage, ServerResponse } from 'http';
import type { FastifyInstance } from 'fastify';

export interface BackendConfig {
  /** Path to the built frontend public directory */
  publicDir: string;
  /** Absolute path to the assembler package root — enables route auto-discovery from pluginPackages */
  assemblerDir?: string;
  /** Additional route directories to autoload via @fastify/autoload (legacy; prefer assemblerDir) */
  routeDirs?: string[];
  /** Additional plugin directories to autoload (legacy; prefer assemblerDir) */
  pluginDirs?: string[];
  /** Server port (default: 8080) */
  port?: number;
  /** Server bind address (default: '0.0.0.0') */
  host?: string;
  /** Log level (default: 'info') */
  logLevel?: string;
  /** Whether this is a development environment */
  isDev?: boolean;
  /** Maximum request body size in bytes (default: 32MB) */
  bodyLimit?: number;
}

export type ServerInstance = FastifyInstance<Server, IncomingMessage, ServerResponse>;
