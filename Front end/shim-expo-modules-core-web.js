/**
 * Shim para expo-modules-core en web cuando el paquete publicado
 * apunta a src/index.ts que no existe. Usado solo para bundling web.
 */

class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.name = 'CodedError';
  }
}

class UnavailabilityError extends CodedError {
  constructor(moduleName, methodName) {
    super('ERR_UNAVAILABLE', `${moduleName}.${methodName} is not available on this platform.`);
    this.name = 'UnavailabilityError';
  }
}

const Platform = {
  OS: 'web',
  select: (obj) => obj.web ?? obj.default,
};

class NativeModule {
  constructor(nativeModuleName) {
    this._nativeModuleName = nativeModuleName;
  }
}

// expo-font pasa createExpoFontLoader (función); debe devolverse el objeto que crea, no la función.
function registerWebModule(ModuleClass, moduleName) {
  return typeof ModuleClass === 'function' ? ModuleClass() : ModuleClass;
}

function requireNativeModule() {
  throw new UnavailabilityError('expo-modules-core', 'requireNativeModule');
}

function requireOptionalNativeModule() {
  return null;
}

export {
  CodedError,
  UnavailabilityError,
  Platform,
  NativeModule,
  registerWebModule,
  requireNativeModule,
  requireOptionalNativeModule,
};

export default {
  CodedError,
  UnavailabilityError,
  Platform,
  NativeModule,
  registerWebModule,
  requireNativeModule,
  requireOptionalNativeModule,
};
