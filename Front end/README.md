# 📱 Lavadero App - Frontend

Aplicación móvil profesional desarrollada con **React Native** y **Expo** para la gestión completa de un negocio de lavandería. Con soporte para dos roles distintos (usuarios y lavanderías), autenticación segura con JWT, y experiencia optimizada para dispositivos móviles.

## ✨ Características

### 👥 Para Usuarios (Clientes)
- 🔐 **Autenticación segura** con JWT
- 📱 **Interfaz intuitiva** para crear pedidos
- 🧺 **Catálogo de servicios** disponibles por lavandería
- 📍 **Gestión de direcciones** de entrega
- 📋 **Historial de pedidos** con estados en tiempo real
- 👤 **Perfil de usuario** con información personal
- 🔔 **Notificaciones** cuando pedidos son completados
- 💬 **Contacto directo** con lavanderías
- 📊 **Dashboard** con estadísticas de uso

### 🏪 Para Lavanderías
- 🔐 **Dashboard profesional** de administración
- 📲 **Recepción de nuevos pedidos** en tiempo real
- 📦 **Gestión de servicios** (creación, edición, descripción)
- 📈 **Estadísticas de negocio** (pedidos, ingresos)
- 👨‍💼 **Gestión de empleados** (si aplica)
- 🗺️ **Zonas de cobertura** disponibles
- 💰 **Cálculo automático** de precios
- 📊 **Reportes y análisis** de operación

### 🌐 Características Generales
- 📡 **Sincronización en tiempo real** con backend
- 🔄 **Gestión de sesión** con AsyncStorage
- 🛡️ **Validación de roles** en cada pantalla
- 🎨 **Diseño adaptativo** para diferentes tamaños
- ⚡ **Performance optimizado** (lazy loading)
- 🌍 **Soporte para GPS** y geolocalización
- 🔌 **API RESTful** integrada

## 🛠️ Tecnologías Utilizadas

- **Framework**: React Native v0.73+
- **Plataforma**: Expo SDK 54+
- **Navegación**: React Navigation (Stack + Bottom Tabs)
- **Estado Global**: React Context API
- **Persistencia**: AsyncStorage
- **HTTP Client**: Axios
- **Iconos**: Expo Vector Icons (FontAwesome 6)
- **Gradientes**: Expo Linear Gradient
- **Geolocalización**: Expo Location
- **Autenticación**: JWT + AsyncStorage

## 📦 Instalación

### Prerequisitos
- Node.js v18 o superior
- npm o yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go App (iOS/Android)
- Backend corriendo en `http://localhost:4000`

### Pasos

1. **Navega a la carpeta del frontend:**
```bash
cd "Front end"
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Crea archivo `.env` o configura la API:**

En `src/config/api.js`:
```javascript
const API_BASE_URL = 'http://tu-ip-backend:4000/api';
```

Para desarrollo local:
```javascript
// Si usas expo, obtén tu IP
const API_BASE_URL = 'http://192.168.1.X:4000/api';
```

4. **Inicia el servidor de desarrollo:**
```bash
npm start
```

5. **Abre en tu dispositivo:**
   - **Escanea el código QR** con Expo Go (iOS/Android)
   - O presiona:
     - `a` - Abre en Android Emulator
     - `i` - Abre en iOS Simulator
     - `w` - Abre en navegador web

## 📁 Estructura del Proyecto

```
Front end/
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js              # Autenticación
│   │   ├── RegisterScreen.js           # Registro de usuario
│   │   ├── HomeScreen.js               # Dashboard principal
│   │   ├── PedidosScreen.js            # Mis pedidos
│   │   ├── ServiciosScreen.js          # Catálogo de servicios
│   │   ├── ClientesScreen.js           # Clientes (para lavandería)
│   │   ├── PerfilScreen.js             # Mi perfil
│   │   ├── DireccionesScreen.js        # Mis direcciones
│   │   ├── MisPedidosScreen.js         # Historial
│   │   ├── lavanderia/
│   │   │   ├── LavanderiaPedidosScreen.js      # Pedidos recibidos
│   │   │   ├── LavanderiaDireccionScreen.js    # Zonas de entrega
│   │   │   └── LavanderiaServiciosScreen.js    # Mis servicios
│   │   └── ...
│   ├── components/
│   │   ├── AppLogo.js                  # Logo de la app
│   │   └── ErrorBoundary.js            # Manejo de errores
│   ├── context/
│   │   └── AuthContext.js              # Estado global de autenticación
│   ├── services/
│   │   ├── auth.service.js             # Llamadas a API de auth
│   │   ├── pedido.service.js           # Llamadas a API de pedidos
│   │   ├── servicio.service.js         # Llamadas a API de servicios
│   │   ├── direccion.service.js        # Llamadas a API de direcciones
│   │   └── lavanderia.service.js       # Llamadas a API de lavanderías
│   └── config/
│       └── api.js                      # Configuración de axios
├── App.js                              # Punto de entrada
├── app.json                            # Configuración Expo
├── package.json
├── metro.config.js                     # Configuración Metro bundler
└── babel.config.js
```

## 🔐 Flujo de Autenticación

```
1. Usuario abre la app
   ↓
2. LoginScreen valida credenciales
   ↓
3. Backend retorna JWT + datos de usuario
   ↓
4. Frontend guarda JWT en AsyncStorage
   ↓
5. AuthContext actualiza isLoggedIn = true + userData
   ↓
6. App.js verifica userData.rol
   ↓
7. Navega a "Main" (usuario) o "LavanderiaTabs" (lavandería)
```

**Validaciones:**
- ✅ El usuario debe seleccionar tipo de cuenta ANTES de loguear
- ✅ El rol seleccionado (usuario/lavandería) debe coincidir con bdel servidor
- ✅ JWT se incluye en cada request con header `Authorization: Bearer <token>`
- ✅ Si token expira, se redirige a login

## 📡 API Integration

Todos los servicios usan axios con interceptor para agregar JWT automáticamente:

```javascript
// En src/config/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const apiRequest = axios.create({
  baseURL: 'http://192.168.1.X:4000/api'
});

// Interceptor para agregar JWT automáticamente
apiRequest.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## 📱 Pantallas Principales

### LoginScreen
- Seleccionar tipo de cuenta (Usuario o Lavandería)
- Ingresar email y contraseña
- Validaciones en cliente y servidor
- Recuperar contraseña (integración futura)

### HomeScreen (Usuario)
- Dashboard con resumen de actividad
- Atajos a pedidos recientes
- Lavanderías recomendadas
- Notificaciones pendientes

### HomeScreen (Lavandería)
- Estadísticas del día
- Últimos pedidos recibidos
- Clientes frecuentes
- Perfil y configuración

### PedidosScreen (Usuario)
- Lista de mis pedidos
- Estados: "Pendiente", "Aceptado", "En proceso", "Completado", "Cancelado"
- Filtros por fecha y estado
- Click para ver detalles
- Calificar pedido completado

### ServiciosScreen (Usuario)
- Catálogo de servicios disponibles
- Filtrar por lavandería
- Ver precio y descripción
- Agregar al carrito (futura)

### LavanderiaServiciosScreen (Lavandería)
- Lista de servicios ofertados
- Crear nuevo servicio
- Editar descripción y precio
- Activar/desactivar servicios

### DireccionesScreen
- Mis direcciones guardadas
- Crear nueva dirección
- Editar dirección existente
- Marcar como favorita

### PerfilScreen
- Información personal
- Foto de perfil
- Editar datos
- Historial de transacciones
- Cerrar sesión

## 🔧 Desarrollo

### Estructura de un Servicio

```javascript
// src/services/pedido.service.js
import { apiRequest } from '../config/api';

export const pedidoService = {
  // GET mis pedidos
  getMisPedidos: async () => {
    return apiRequest.get('/pedidos');
  },

  // POST crear pedido
  crearPedido: async (datosPedido) => {
    return apiRequest.post('/pedidos', datosPedido);
  },

  // GET detalles de pedido
  obtenerPedido: async (id) => {
    return apiRequest.get(`/pedidos/${id}`);
  },

  // PUT actualizar estado
  actualizarEstado: async (id, nuevoEstado) => {
    return apiRequest.put(`/pedidos/${id}`, { estado: nuevoEstado });
  }
};
```

### Usar en Componente

```javascript
import { useAuth } from '../context/AuthContext';
import { pedidoService } from '../services/pedido.service';

export default function PedidosScreen() {
  const { userData } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarPedidos();
  }, []);

  const cargarPedidos = async () => {
    try {
      setLoading(true);
      const response = await pedidoService.getMisPedidos();
      setPedidos(response.data);
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  // Render...
}
```

## 🔐 Seguridad

- ✅ JWT almacenado en **AsyncStorage** (no en state global sin protección)
- ✅ JWT enviado en header `Authorization: Bearer <token>` en cada request
- ✅ Validación de roles **antes** de renderizar pantallas
- ✅ Login requiere seleccionar tipo de cuenta
- ✅ Manejo de errores 401 redirige a login automáticamente
- ✅ Tokens no exponen información sensible en payload

## 📦 Packages Principales

```json
{
  "react-native": "0.73.0",
  "expo": "^54.0.0",
  "@react-navigation/native": "^6.0.0",
  "axios": "^1.0.0",
  "@react-native-async-storage/async-storage": "^1.23.0",
  "expo-linear-gradient": "^12.0.0",
  "expo-vector-icons": "^13.0.0",
  "expo-location": "^17.0.0"
}
```

## 🚀 Build & Deployment

### Android APK
```bash
npm run build-android
# O con eas-cli
eas build --platform android
```

### iOS App
```bash
npm run build-ios
# O con eas-cli
eas build --platform ios
```

Para más detalles: Ver [BUILD_APK.md](BUILD_APK.md) y [PUBLICAR_PLAY_STORE.md](PUBLICAR_PLAY_STORE.md)

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "Cannot find module '@react-navigation...'" | Ejecuta `npm install` nuevamente |
| "Connection refused" (backend) | Verifica tu IP del backend en `src/config/api.js` |
| "Invalid JWT" al loguear | El servidor está fallando. Revisa `/Back end/logs/error-*.log` |
| "Rol de usuario no coincide" | Asegúrate de seleccionar el tipo de cuenta correcto |
| "App crash al loguear" | Error fue solucionado. Si persiste, reporta con stack trace |
| "AsyncStorage items vacíos" | Token expiró. Vuelve a loguear |

## 📞 Contribuir

1. Crea una rama para tu feature: `git checkout -b feature/mi-feature`
2. Commits con mensajes claros: `git commit -m "Feat: agregar nueva pantalla"`
3. Push a la rama: `git push origin feature/mi-feature`
4. Abre un Pull Request

## 📄 Licencia

Privado - Lavadero Development Team

