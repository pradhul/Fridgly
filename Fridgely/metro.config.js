const { getDefaultConfig } = require('expo/metro-config');

/** Extend Expo's default config and only add .tflite as an asset. */
module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.resolver.assetExts.push('tflite');
  return config;
})();
