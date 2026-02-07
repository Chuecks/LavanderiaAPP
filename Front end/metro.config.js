const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // En web, expo-modules-core apunta a src/index.ts que no existe en el paquete publicado.
  // Redirigir al shim que exporta lo que expo-font y otros necesitan.
  if (moduleName === 'expo-modules-core' && platform === 'web') {
    return {
      type: 'sourceFile',
      filePath: path.resolve(__dirname, 'shim-expo-modules-core-web.js'),
    };
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
