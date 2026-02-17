# Cómo generar una APK para probar en Android

## Requisitos

- Cuenta en [Expo](https://expo.dev) (gratis)
- Node.js instalado

## Pasos

### 1. Instalar EAS CLI

En la carpeta del proyecto (o desde `Front end`):

```bash
npm install -g eas-cli
```

### 2. Iniciar sesión en Expo

```bash
eas login
```

Si no tienes cuenta: [expo.dev/signup](https://expo.dev/signup)

### 3. Configurar el proyecto (solo la primera vez)

Desde la carpeta **Front end**:

```bash
cd "Front end"
eas build:configure
```

(Acepta la configuración por defecto si te lo pregunta.)

### 4. Generar la APK

```bash
eas build --platform android --profile preview
```

- El perfil **preview** está configurado en `eas.json` para generar un **APK** (no AAB), ideal para instalar a mano en tu móvil.
- La build se hace en la nube de Expo; al terminar te dará un **enlace para descargar la APK**.

### 5. Instalar en tu Android

1. Descarga la APK desde el enlace que te muestra EAS (o desde [expo.dev](https://expo.dev) → tu proyecto → Builds).
2. En el móvil: abre el archivo APK y permite “Instalar desde fuentes desconocidas” si te lo pide.
3. Instala y abre la app.

---

## Alternativa: build local (sin EAS)

Si prefieres compilar en tu PC sin usar la nube de Expo:

1. Instalar [Android Studio](https://developer.android.com/studio) y el SDK de Android.
2. En la carpeta `Front end`:

   ```bash
   npx expo prebuild --platform android
   cd android
   .\gradlew.bat assembleRelease
   ```

3. La APK quedará en:  
   `android/app/build/outputs/apk/release/app-release.apk`

---

## Nota

- Asegúrate de que en `src/config/api.js` la URL del backend sea la correcta (IP o dominio al que apunta tu backend en la red donde uses el móvil).
- Para publicar en Google Play más adelante, usa el perfil **production** (genera AAB):  
  `eas build --platform android --profile production`
