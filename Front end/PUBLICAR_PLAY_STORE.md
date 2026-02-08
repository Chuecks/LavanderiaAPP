# Publicar Lavadero App en Google Play Store

## Requisitos previos

1. **Cuenta de Google Play Developer** (pago único ~25 USD)  
   - Entrá a [Google Play Console](https://play.google.com/console)  
   - Iniciá sesión con tu cuenta Google  
   - Aboná la inscripción (una sola vez)

2. **Cuenta de Expo** (gratis)  
   - Creá una en [expo.dev](https://expo.dev) si no tenés  
   - La vas a usar para generar el build con EAS

---

## Paso 1: Instalar EAS CLI y configurar proyecto

En la carpeta **Front end**:

```bash
npm install -g eas-cli
eas login
eas build:configure
```

Elegí **Android** cuando pregunte. Se creará `eas.json` con perfiles de build.

---

## Paso 2: Generar el build para Play Store (AAB)

El formato que pide Google es **Android App Bundle (.aab)**, no APK.

```bash
cd "Front end"
eas build --platform android --profile production
```

(O si solo tenés el perfil por defecto: `eas build -p android`)

- El build se hace en la nube de Expo (no en tu PC).  
- Al terminar, en [expo.dev](https://expo.dev) → tu proyecto → Builds podés **descargar el .aab**.

---

## Paso 3: Crear la app en Google Play Console

1. Entrá a [Play Console](https://play.google.com/console)  
2. **Crear aplicación** → Nombre: **Lavadero App**  
3. Completá:
   - **Política de privacidad**: si la app recoge datos (email, pedidos), necesitás una URL de política de privacidad (puede ser una página en GitHub o un doc público).
   - **Clasificación del contenido**: cuestionario (generalmente “Para todos” o similar).
   - **Público objetivo**: edad (ej. 13+ o 18+ según tu app).
   - **Noticias de la app**: opcional.
   - **Publicidad**: indicá si la app muestra anuncios (sí/no).

---

## Paso 4: Ficha de la tienda

En la consola, en **Ficha de la tienda**:

- **Nombre corto**: Lavadero App  
- **Descripción breve** (80 caracteres)  
- **Descripción completa** (hasta 4000 caracteres)  
- **Icono**: 512x512 px (PNG)  
- **Gráfico de funciones**: 1024x500 px (opcional pero recomendado)  
- **Capturas de pantalla**: al menos 2 (teléfono), recomendado 4–8

---

## Paso 5: Subir el AAB y publicar

1. En Play Console → **Producción** (o **Pruebas internas** para probar primero).  
2. **Crear nueva versión**  
3. **Subir** el archivo **.aab** que descargaste de EAS.  
4. Completá las notas de la versión (qué incluye esta versión).  
5. Revisá que no queden errores o advertencias en la consola.  
6. **Enviar para revisión** (o “Iniciar rollout” si ya estuviste en pruebas).

La revisión de Google suele tardar desde unas horas hasta unos días.

---

## Resumen de comandos (en orden)

```bash
cd "c:\Users\surfaceLaptop3\Desktop\Lavadero\Front end"
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile production
```

Luego: descargar el .aab desde expo.dev → Builds → subirlo en Play Console.

---

## Actualizar la app más adelante

1. Subí **version** y **versionCode** en `app.json`:
   - `"version": "1.0.1"`
   - `"android": { ..., "versionCode": 2 }` (siempre mayor que el anterior)
2. Volvé a generar el build: `eas build -p android --profile production`
3. Descargá el nuevo .aab y subilo en Play Console como **nueva versión**.

---

## Enlaces útiles

- [Documentación EAS Build](https://docs.expo.dev/build/introduction/)
- [Google Play Console](https://play.google.com/console)
- [Requisitos de la ficha de Play](https://support.google.com/googleplay/android-developer/answer/9859152)
