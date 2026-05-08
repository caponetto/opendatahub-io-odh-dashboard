module.exports = {
  ...require('./webpack.common'),
  ...require('./webpack.dev'),
  ...require('./webpack.prod'),
  ...require('./assemblerDefaults'),
  dotenv: require('./dotenv'),
  discoverPluginPackages: require('./discoverPluginPackages'),
  generatePluginManifest: require('./generatePluginManifest'),
  moduleFederation: require('./moduleFederation'),
  pluginChunking: require('./pluginChunking'),
  getRuntimeOdhPackages: require('./getRuntimeOdhPackages'),
};
