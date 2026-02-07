# Lavadero App - Frontend

Aplicación móvil desarrollada con React Native y Expo para la gestión de un negocio de lavandería.

## Características

- 🔐 Autenticación de usuarios
- 📊 Dashboard con estadísticas del día
- 👕 Gestión de servicios (crear, editar, eliminar)
- 📋 Gestión de pedidos con estados (Pendiente, En Proceso, Completado)
- 👥 Gestión de clientes con información de contacto
- 👤 Perfil de usuario con estadísticas

## Tecnologías Utilizadas

- React Native
- Expo
- React Navigation (Stack y Bottom Tabs)
- Expo Vector Icons
- Expo Linear Gradient

## Instalación

1. Navega a la carpeta Front end:
```bash
cd "Front end"
```

2. Instala las dependencias:
```bash
npm install
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

4. Escanea el código QR con la app Expo Go (iOS/Android) o presiona:
   - `a` para abrir en Android
   - `i` para abrir en iOS
   - `w` para abrir en web

## Estructura del Proyecto

```
Front end/
├── App.js                 # Componente principal y navegación
├── src/
│   └── screens/          # Pantallas de la aplicación
│       ├── LoginScreen.js
│       ├── HomeScreen.js
│       ├── ServiciosScreen.js
│       ├── PedidosScreen.js
│       ├── ClientesScreen.js
│       └── PerfilScreen.js
├── assets/               # Imágenes y recursos
├── package.json
└── app.json             # Configuración de Expo
```

## Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Ejecuta en Android
- `npm run ios` - Ejecuta en iOS
- `npm run web` - Ejecuta en navegador web

## Notas

- Esta es una versión inicial con datos de ejemplo
- La autenticación actualmente es básica (sin backend)
- Los datos se almacenan en el estado local de React
- Para producción, se recomienda integrar con un backend y base de datos

