const path = require('path');

const MANIFEST_PATH = path.join(__dirname, '..', '.plugin-manifest.json');

const mockWorkspacePackages = [
  {
    name: '@odh-dashboard/dashboard-shell-frontend',
    path: '/workspace/packages/dashboard-shell-frontend',
    exports: { './extensions': './extensions.ts' },
  },
  {
    name: '@odh-dashboard/kserve',
    path: '/workspace/packages/kserve',
    exports: { './extensions': './extensions.ts' },
  },
  {
    name: '@odh-dashboard/model-serving',
    path: '/workspace/packages/model-serving',
    exports: { './extensions': './extensions.ts' },
  },
  {
    name: '@odh-dashboard/internal',
    path: '/workspace/frontend/src/__mocks__',
    exports: { './extensions': './extensions.ts' },
  },
  {
    name: '@odh-dashboard/tsconfig',
    path: '/workspace/packages/tsconfig',
    exports: {},
  },
  {
    name: '@odh-dashboard/dashboard-dist-slim',
    path: '/workspace/packages/dashboard-dist-slim',
    exports: { './extensions': './src/extensions.ts' },
    topology: { tier: 'assembler' },
  },
];

beforeEach(() => {
  jest.resetModules();

  const realFs = jest.requireActual('fs');
  jest.doMock('fs', () => ({
    ...realFs,
    existsSync: jest.fn((p) => (p === MANIFEST_PATH ? false : realFs.existsSync(p))),
  }));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('getPluginPackageDetails', () => {
  it('should return plugin packages with short names and locations, excluding internal', () => {
    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify(mockWorkspacePackages)),
    }));

    const { getPluginPackageDetails } = require('../discoverPluginPackages');
    const result = getPluginPackageDetails();

    expect(result).toEqual([
      {
        name: '@odh-dashboard/dashboard-shell-frontend',
        shortName: 'dashboard-shell-frontend',
        location: '/workspace/packages/dashboard-shell-frontend',
      },
      {
        name: '@odh-dashboard/kserve',
        shortName: 'kserve',
        location: '/workspace/packages/kserve',
      },
      {
        name: '@odh-dashboard/model-serving',
        shortName: 'model-serving',
        location: '/workspace/packages/model-serving',
      },
    ]);
  });

  it('should return empty array when no workspace packages exist', () => {
    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify([])),
    }));

    const { getPluginPackageDetails } = require('../discoverPluginPackages');
    expect(getPluginPackageDetails()).toEqual([]);
  });

  it('should return empty array when npm query fails', () => {
    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockImplementation(() => {
        throw new Error('npm query failed');
      }),
    }));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getPluginPackageDetails } = require('../discoverPluginPackages');
    expect(getPluginPackageDetails()).toEqual([]);

    expect(warnSpy).toHaveBeenCalledWith('Error querying workspaces:', 'npm query failed');
  });

  it('should strip the org scope to produce shortName', () => {
    const packages = [
      {
        name: '@custom-org/my-plugin',
        path: '/workspace/packages/my-plugin',
        exports: { './extensions': './extensions.ts' },
      },
    ];

    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify(packages)),
    }));

    const { getPluginPackageDetails } = require('../discoverPluginPackages');
    const result = getPluginPackageDetails();

    expect(result).toEqual([
      {
        name: '@custom-org/my-plugin',
        shortName: 'my-plugin',
        location: '/workspace/packages/my-plugin',
      },
    ]);
  });

  it('should skip packages with missing path and warn', () => {
    const packages = [
      {
        name: '@odh-dashboard/no-path-plugin',
        exports: { './extensions': './extensions.ts' },
      },
      {
        name: '@odh-dashboard/has-path-plugin',
        path: '/workspace/packages/has-path-plugin',
        exports: { './extensions': './extensions.ts' },
      },
    ];

    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify(packages)),
    }));
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    const { getPluginPackageDetails } = require('../discoverPluginPackages');
    const result = getPluginPackageDetails();

    expect(result).toEqual([
      {
        name: '@odh-dashboard/has-path-plugin',
        shortName: 'has-path-plugin',
        location: '/workspace/packages/has-path-plugin',
      },
    ]);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('@odh-dashboard/no-path-plugin'));
  });

  it('should cache the failure so subsequent calls do not re-run execSync', () => {
    const mockExecSync = jest.fn().mockImplementation(() => {
      throw new Error('npm query failed');
    });
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    const {
      getPluginPackageDetails,
      discoverPluginPackages,
    } = require('../discoverPluginPackages');

    getPluginPackageDetails();
    discoverPluginPackages();

    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });

  it('should memoize the npm query call across multiple invocations', () => {
    const mockExecSync = jest.fn().mockReturnValue(JSON.stringify(mockWorkspacePackages));
    jest.doMock('child_process', () => ({ execSync: mockExecSync }));

    const {
      getPluginPackageDetails,
      discoverPluginPackages,
    } = require('../discoverPluginPackages');

    getPluginPackageDetails();
    discoverPluginPackages();

    expect(mockExecSync).toHaveBeenCalledTimes(1);
  });
});

describe('discoverPluginPackages with assemblerDir', () => {
  const tmpDir = '/tmp/test-assembler';
  const assemblerPkgPath = path.join(tmpDir, 'package.json');

  /**
   * resolveSelectedPackages reads package.json via fs.readFileSync (not require).
   * Mock readFileSync for the assembler path so tests do not depend on the real filesystem.
   */
  function requireDiscoverWithAssemblerFs(
    assemblerPackage,
    workspacePackages = mockWorkspacePackages,
  ) {
    jest.resetModules();
    const realFs = jest.requireActual('fs');
    jest.doMock('fs', () => ({
      ...realFs,
      existsSync: jest.fn((p) => (p === MANIFEST_PATH ? false : realFs.existsSync(p))),
      readFileSync: jest.fn((filePath, enc) => {
        if (path.normalize(String(filePath)) === path.normalize(assemblerPkgPath)) {
          return JSON.stringify(assemblerPackage);
        }
        return realFs.readFileSync(filePath, enc);
      }),
    }));
    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify(workspacePackages)),
    }));
    return require('../discoverPluginPackages');
  }

  beforeEach(() => {
    delete process.env.PLUGIN_PACKAGES;
  });

  it('should return all packages when pluginPackages is "all"', () => {
    const { discoverPluginPackages } = requireDiscoverWithAssemblerFs({
      name: '@odh-dashboard/dashboard-dist-full',
      pluginPackages: 'all',
    });
    const result = discoverPluginPackages(tmpDir);

    expect(result).toEqual([
      '@odh-dashboard/dashboard-shell-frontend',
      '@odh-dashboard/kserve',
      '@odh-dashboard/model-serving',
      '@odh-dashboard/internal',
    ]);
  });

  it('should return only listed packages when pluginPackages is an array', () => {
    const { discoverPluginPackages } = requireDiscoverWithAssemblerFs({
      name: '@odh-dashboard/dashboard-dist-slim',
      pluginPackages: ['@odh-dashboard/model-serving'],
    });
    const result = discoverPluginPackages(tmpDir);

    expect(result).toEqual([
      '@odh-dashboard/dashboard-shell-frontend',
      '@odh-dashboard/model-serving',
    ]);
  });

  it('should throw when pluginPackages array contains invalid packages', () => {
    const { discoverPluginPackages } = requireDiscoverWithAssemblerFs({
      name: '@odh-dashboard/dashboard-dist-slim',
      pluginPackages: ['@odh-dashboard/nonexistent'],
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => discoverPluginPackages(tmpDir)).toThrow('Invalid packages');
  });

  it('should fall through to all packages when no pluginPackages field exists', () => {
    const { discoverPluginPackages } = requireDiscoverWithAssemblerFs({
      name: '@odh-dashboard/some-assembler',
    });
    const result = discoverPluginPackages(tmpDir);

    expect(result).toEqual([
      '@odh-dashboard/dashboard-shell-frontend',
      '@odh-dashboard/kserve',
      '@odh-dashboard/model-serving',
      '@odh-dashboard/internal',
    ]);
  });

  it('should prioritize PLUGIN_PACKAGES env var over pluginPackages field', () => {
    process.env.PLUGIN_PACKAGES = '@odh-dashboard/kserve';

    const { discoverPluginPackages } = requireDiscoverWithAssemblerFs({
      name: '@odh-dashboard/dashboard-dist-slim',
      pluginPackages: ['@odh-dashboard/model-serving'],
    });
    const result = discoverPluginPackages(tmpDir);

    expect(result).toEqual(['@odh-dashboard/kserve']);
  });

  it('should fall through when assemblerDir has no readable package.json', () => {
    jest.resetModules();
    const realFs = jest.requireActual('fs');
    jest.doMock('fs', () => ({
      ...realFs,
      existsSync: jest.fn((p) => (p === MANIFEST_PATH ? false : realFs.existsSync(p))),
    }));
    jest.doMock('child_process', () => ({
      execSync: jest.fn().mockReturnValue(JSON.stringify(mockWorkspacePackages)),
    }));

    const { discoverPluginPackages } = require('../discoverPluginPackages');
    const result = discoverPluginPackages('/nonexistent/path');

    expect(result).toEqual([
      '@odh-dashboard/dashboard-shell-frontend',
      '@odh-dashboard/kserve',
      '@odh-dashboard/model-serving',
      '@odh-dashboard/internal',
    ]);
  });
});
