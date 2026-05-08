const fs = require('node:fs');
const path = require('node:path');
const VirtualModulesPlugin = require('webpack-virtual-modules');
const { discoverPluginPackages } = require('./discoverPluginPackages');
const { getWorkspacePackages } = require('./loadManifest');

/**
 * Webpack plugin to generate a virtual module with imports for all discovered plugin extensions.
 *
 * If the assembler directory contains an `extensions.ts`, its extensions are included
 * under the `__assembler__` key. This allows assembler packages to contribute
 * extension overrides (e.g., hiding or patching extensions from other packages).
 */
class GenerateExtensionsPlugin {
  constructor(options) {
    this.targetFile = options.targetFile;

    const discoveredPackages = discoverPluginPackages(options.assemblerDir);
    console.log('Extension packages:', discoveredPackages);

    const assemblerExtensionsPath = options.assemblerDir
      ? this.findAssemblerExtensions(options.assemblerDir)
      : null;
    if (assemblerExtensionsPath) {
      console.log('Assembler extensions:', assemblerExtensionsPath);
    }

    const content = this.generateFileContent(discoveredPackages, assemblerExtensionsPath);

    this.virtualModules = new VirtualModulesPlugin({
      [this.targetFile]: content,
    });
  }

  apply(compiler) {
    this.virtualModules.apply(compiler);
  }

  findAssemblerExtensions(assemblerDir) {
    for (const dir of [assemblerDir, path.resolve(assemblerDir, 'src')]) {
      for (const ext of ['extensions.ts', 'extensions.tsx', 'extensions.js']) {
        const candidate = path.resolve(dir, ext);
        if (fs.existsSync(candidate)) {
          return candidate;
        }
      }
    }
    return null;
  }

  generateFileContent(pluginPackages, assemblerExtensionsPath) {
    if ((!pluginPackages || pluginPackages.length === 0) && !assemblerExtensionsPath) {
      return `import type { Extension } from '@odh-dashboard/plugin-core';

const pluginExtensions: Record<string, Extension[]> = {};

export default pluginExtensions;
`;
    }

    const workspacePackages = getWorkspacePackages();
    const packagesWithExtensions = new Set(
      workspacePackages
        .filter((pkg) => pkg.extensionsExport || pkg.exports?.['./extensions'])
        .map((pkg) => pkg.name),
    );

    const staticPluginPackages = (pluginPackages || []).filter((pkgName) =>
      packagesWithExtensions.has(pkgName),
    );
    const runtimeOnlyPackages = (pluginPackages || []).filter(
      (pkgName) => !packagesWithExtensions.has(pkgName),
    );

    const imports = staticPluginPackages
      .map((pkgName, index) => `import extensions${index} from '${pkgName}/extensions';`)
      .join('\n');

    const recordEntries = staticPluginPackages
      .map((pkgName, index) => `  '${pkgName}': extensions${index}`)
      .concat(runtimeOnlyPackages.map((pkgName) => `  '${pkgName}': []`))
      .join(',\n');

    const assemblerImport = assemblerExtensionsPath
      ? `import assemblerExtensions from '${assemblerExtensionsPath}';`
      : '';
    const assemblerEntry = assemblerExtensionsPath ? `  '__assembler__': assemblerExtensions` : '';
    const separator = recordEntries && assemblerEntry ? ',\n' : '';

    return `import type { Extension } from '@odh-dashboard/plugin-core';
${imports}
${assemblerImport}

const pluginExtensions: Record<string, Extension[]> = {
${recordEntries}${separator}${assemblerEntry}
};

export default pluginExtensions;
`;
  }
}

module.exports = GenerateExtensionsPlugin;
