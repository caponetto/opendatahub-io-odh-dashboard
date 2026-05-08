const ESLINT_IGNORE = [
  /jest-config\/types\.(js|d\.ts)$/,
  /\/\.lintstagedrc\.js$/,
  /\/README\.md$/,
  /\/\.claude\//,
];

module.exports = {
  '**/*.{js,ts,jsx,tsx,md}': (files) => {
    const filtered = files.filter((f) => !ESLINT_IGNORE.some((re) => re.test(f)));
    if (filtered.length === 0) {
      return [];
    }
    return [`npx eslint --max-warnings 0 ${filtered.map((f) => `"${f}"`).join(' ')}`];
  },
  '**/package.json': () => 'npm run validate:tiers',
};
