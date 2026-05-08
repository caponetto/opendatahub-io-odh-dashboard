module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: { node: 'current' },
        exclude: ['@babel/plugin-transform-dynamic-import'],
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
};
