const GenerateExtensionsPlugin = require('../generateExtensionsPlugin');

describe('GenerateExtensionsPlugin', () => {
  it('should generate plugin-core extension type imports', () => {
    const content = GenerateExtensionsPlugin.prototype.generateFileContent([], null);

    expect(content).toContain("import type { Extension } from '@odh-dashboard/plugin-core';");
    expect(content).not.toContain('@openshift/dynamic-plugin-sdk');
  });
});
