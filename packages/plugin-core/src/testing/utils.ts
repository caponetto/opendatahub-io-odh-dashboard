import type { Extension } from '../core/types';
import { isCodeRef } from '../core/internal/coderefs';
import { visitDeep } from '../core/internal/objects';

/**
 * Validates a code ref in the following format:
 * () => import('./MyModule')
 * () => import('./utils').then((module) => module.namedExport)
 */
const MODULE_REF_PATTERN = "'[^']+'";
const RAW_IMPORT_PATTERN = String.raw`import\(${MODULE_REF_PATTERN}\)`;
const TRANSPILED_IMPORT_PATTERN = String.raw`Promise\.resolve\(\)\.then\(\(\)\s*=>\s*(?:_interopRequireWildcard\()?require\(${MODULE_REF_PATTERN}\)\)?\)`;
const NAMED_EXPORT_PATTERN = String.raw`(?:\.then\(\(?[a-zA-Z_$][a-zA-Z0-9_$]*\)?\s*=>\s*[a-zA-Z_$][a-zA-Z0-9_$]*\.[a-zA-Z_$][a-zA-Z0-9_$]*\))?`;
const importPattern = new RegExp(
  String.raw`^\(\)\s*=>\s*(?:{\s*return)?\s*(?:${RAW_IMPORT_PATTERN}|${TRANSPILED_IMPORT_PATTERN})${NAMED_EXPORT_PATTERN}`,
);

export const expectExtensionsToBeValid = (extensions: Extension[]): void => {
  extensions.forEach((extension) => {
    visitDeep(extension.properties, isCodeRef, (value) => {
      const fnString = value
        .toString()
        .replaceAll(/cov_.+;/g, '')
        .replaceAll(/\s+?\/\*.*?\*\//g, '')
        .replaceAll(/\s*\/\/.*$/gm, '');
      expect(fnString).toMatch(importPattern);
    });
  });
};
