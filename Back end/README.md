# 🧺 Backend Lavadero

Backend profesional desarrollado con **Node.js**, **Express** y **MongoDB** para la gestión completa de un negocio de lavandería con soporte para múltiples roles, sistema avanzado de logging y arquitectura escalable.

## ✨ Características

- 🔐 **Autenticación JWT** con soporte de múltiples roles (Usuario/Lavandería)
- 🔒 **Encriptación segura** de contraseñas con bcryptjs
- 📊 **Sistema profesional de logging** con Winston (rotación diaria, retención automática)
- 📧 **Gestión de emails** con RabbitMQ (para no bloquear respuestas)
- 📍 **Integración de geocoding** para direcciones
- 👥 **Gestión de usuarios** (clientes y lavanderías con perfiles diferenciados)
- 📦 **Gestión de pedidos** (crear, actualizar, cambiar estado)
- 🛍️ **Catálogo de servicios** (dinámico por lavandería)
- 🗺️ **Gestión de direcciones** de entrega
- 📈 **Monitoreo en tiempo real** de operaciones
- 🛡️ **Validación de roles** en cada endpoint

## 🛠️ Tecnologías Utilizadas

- **Runtime**: Node.js v18+
- **Framework**: Express.js v4
- **Base de datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT (JSON Web Tokens)
- **Seguridad**: bcryptjs, CORS
- **Logging**: Winston v3 + winston-daily-rotate-file
- **HTTP Logger**: Morgan
- **Queue**: RabbitMQ (opcional, para procesamiento asíncrono)
- **Email**: Nodemailer + SMTP
- **Geocoding**: APIs de geolocalización

## 📦 Instalación

### Prerequisitos
- Node.js v18 o superior
- MongoDB (local o Atlas)
- npm o yarn
- RabbitMQ (opcional, para email en background)

### Pasos

1. **Navega a la carpeta del backend:**
```bash
cd "Back end"
```

2. **Instala las dependencias:**
```bash
npm install
```

3. **Crea archivo `.env`:**
```bash
cp .env.example .env
```

4. **Configura las variables de entorno en `.env`:**
```env
# Servidor
PORT=4000
NODE_ENV=development

# Base de datos
MONGODB_URI=mongodb://localhost:27017/lavadero
# O para MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/lavadero

# Autenticación
JWT_SECRET=tu-secret-key-super-segura-cambiar-en-produccion
JWT_EXPIRE=24h

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# RabbitMQ (opcional)
RABBITMQ_URL=amqp://localhost:5672

# Geocoding
GEOCODING_API_KEY=tu-api-key
```

5. **Inicia el servidor:**
```bash
# Desarrollo (con auto-reload con nodemon)
npm run dev

# Producción
npm start

# O con pm2
npm run pm2
```

✅ El servidor debería estar en `http://localhost:4000`

## 📁 Estructura del Proyecto

```
Back end/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.js          # Autenticación y registro
│   │   ├── pedido.controller.js        # Gestión de pedidos
│   │   ├── servicio.controller.js      # Catálogo de servicios
│   │   ├── direccion.controller.js     # Direcciones de entrega
│   │   └── lavanderia.controller.js    # Gestión de lavanderías
│   ├── models/
│   │   ├── usuario.model.js            # Esquema de usuarios
│   │   ├── pedido.model.js             # Esquema de pedidos
│   │   ├── lavanderia.model.js         # Esquema de lavanderías
│   │   └── direccion.model.js          # Esquema de direcciones
│   ├── routes/
│   │   ├── auth.routes.js              # Rutas: /api/auth/*
│   │   ├── pedido.routes.js            # Rutas: /api/pedidos/*
│   │   ├── servicio.routes.js          # Rutas: /api/servicios/*
│   │   ├── direccion.routes.js         # Rutas: /api/direcciones/*
│   │   └── lavanderia.routes.js        # Rutas: /api/lavanderias/*
│   ├── middleware/
│   │   └── auth.middleware.js          # Verificación de JWT
│   ├── services/
│   │   ├── email.service.js            # Envío de emails
│   │   ├── geocoding.service.js        # Geocodificación
│   │   ├── queue.service.js            # Integración RabbitMQ
│   │   └── lavanderia.service.js       # Lógica de negocio
│   ├── consumers/
│   │   └── email.consumer.js           # Procesador de cola de emails
│   ├── utils/
│   │   └── logger.js                   # Sistema centralizado de logging
│   ├── middleware/
│   │   └── requestLogger.js            # HTTP request logging
│   └── server.js                       # Punto de entrada
├── logs/                               # Archivos de log (generado automáticamente)
│   ├── auth-YYYY-MM-DD.log            # Logs de autenticación
│   ├── error-YYYY-MM-DD.log           # Logs de errores
│   ├── business-YYYY-MM-DD.log        # Logs de negocio
│   └── infrastructure-YYYY-MM-DD.log  # Logs de infraestructura
├── .env.example                        # Template de variables
├── .gitignore
├── package.json
└── README.md
```

## 🔌 API Endpoints

### 🔐 Autenticación (`/api/auth`)

#### POST `/api/auth/registro`
**Registra un nuevo usuario o lavandería**

```bash
curl -X POST http://localhost:4000/api/auth/registro \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "password123",
    "nombre": "Juan",
    "apellido": "Pérez",
    "telefono": "+569 1234 5678",
    "rol": "usuario"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "mensaje": "Usuario registrado exitosamente",
  "token": "eyJhbGc...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "cliente@example.com",
    "nombre": "Juan",
    "rol": "usuario",
    "createdAt": "2026-02-18T10:30:00Z"
  }
}
```

#### POST `/api/auth/login`
**Inicia sesión**

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@example.com",
    "password": "password123",
    "rol": "usuario"
  }'
```

**Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "cliente@example.com",
    "nombre": "Juan",
    "rol": "usuario"
  }
}
```

**Error (401):**
```json
{
  "success": false,
  "error": "Esta cuenta no es de una lavandería. Por favor, usa la opción Usuario"
}
```

### 📦 Pedidos (`/api/pedidos`)

#### POST `/api/pedidos`
**Crear nuevo pedido**

```bash
curl -X POST http://localhost:4000/api/pedidos \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "lavanderia_id": "507f1f77bcf86cd799439012",
    "servicios": [
      {
        "servicio_id": "507f1f77bcf86cd799439013",
        "cantidad": 2
      }
    ],
    "direccion_id": "507f1f77bcf86cd799439014"
  }'
```

#### GET `/api/pedidos`
**Obtener mis pedidos**

```bash
curl -X GET http://localhost:4000/api/pedidos \
  -H "Authorization: Bearer <token>"
```

#### GET `/api/pedidos/:id`
**Obtener detalles de un pedido**

#### PUT `/api/pedidos/:id`
**Actualizar estado de pedido**

### 🛍️ Servicios (`/api/servicios`)

#### GET `/api/servicios`
**Obtener servicios disponibles**

#### POST `/api/servicios` (Solo Lavanderías)
**Crear nuevo servicio**

### 🗺️ Direcciones (`/api/direcciones`)

#### GET `/api/direcciones`
**Obtener mis direcciones**

#### POST `/api/direcciones`
**Crear nueva dirección**

#### PUT `/api/direcciones/:id`
**Actualizar dirección**

#### DELETE `/api/direcciones/:id`
**Eliminar dirección**

## 🔐 Seguridad

### Autenticación
- ✅ Contraseñas encriptadas con **bcryptjs** (salt rounds: 10)
- ✅ Tokens JWT con expiración de **24 horas**
- ✅ **Validación de roles** en cada endpoint
- ✅ Las contraseñas **nunca se devuelven** en respuestas

### Almacenamiento
- ✅ Variables sensibles en `.env` (nunca en código)
- ✅ Conexión HTTPS en producción
- ✅ CORS configurado restrictivamente

### Logging
- ✅ Todos los intentos de login registrados (exitosos y fallidos)
- ✅ Detección automática de IPs sospechosas
- ✅ Logs de errores de BD, emails, y servicios
- ✅ Rotación automática cada 24 horas
- ✅ Retención: errores 14 días, auth/negocio 60 días

## 📊 Sistema de Logging

El backend usa **Winston** para logging profesional:

```bash
# Ver logs en vivo (desde Linux)
tail -f /ruta/Back\ end/logs/auth-*.log

# Ver errores recientes
tail -20 /ruta/Back\ end/logs/error-*.log

# Buscar fallo de login de un usuario
grep "usuario@example.com" /ruta/Back\ end/logs/auth-*.log
```

**Tipos de logs generados:**
- `auth-YYYY-MM-DD.log` - Logins, registros, cambios de contraseña
- `error-YYYY-MM-DD.log` - Errores de BD, emails, servicios
- `business-YYYY-MM-DD.log` - Pedidos, servicios, transacciones
- `infrastructure-YYYY-MM-DD.log` - Conexiones, errores de sistemas

Para más comandos, ver [LINUX_COMMANDS_FOR_LOGS.md](../LINUX_COMMANDS_FOR_LOGS.md)

## 🚀 Deployment

### En Linux/Ubuntu

1. **Instala dependencias del sistema:**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs mongodb
```

2. **Clona y configura:**
```bash
git clone <repo>
cd "Back end"
npm install --production
cp .env.example .env
# Edita .env con valores reales
```

3. **Inicia con PM2:**
```bash
sudo npm install -g pm2
pm2 start src/server.js --name "lavadero-api"
pm2 startup
pm2 save
```

4. **Configura Nginx (proxy reverso):**
```nginx
server {
  listen 80;
  server_name api.lavadero.com;

  location / {
    proxy_pass http://localhost:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

### Con Docker

```bash
docker build -t lavadero-api .
docker run -p 4000:4000 --env-file .env lavadero-api
```

## 📈 Performance & Monitoreo

**Para monitorear el servidor:**

```bash
# Ver procesos Node
pm2 list
pm2 logs lavadero-api

# Monitorar en vivo
pm2 monit

# Ver estadísticas de BD
mongo
> db.usuarios.countDocuments()
> db.pedidos.countDocuments()
```

## 🐛 Troubleshooting

| Problema | Solución |
|----------|----------|
| "MongoError: connect ECONNREFUSED" | Asegúrate de que MongoDB esté corriendo |
| "JWT malformed" | Verifica que el token sea válido y no haya expirado |
| "Esta cuenta no es de una lavandería" | El rol en login no coincide con el rol del usuario |
| "Email no se envía" | Verifica SMTP_USER, SMTP_PASS y RabbitMQ en `.env` |
| "Logs vacío" | Verifica permisos de carpeta `/logs` |

## 📞 Soporte

Para reportar bugs o sugerencias:
1. Revisa los logs: `tail -f Back\ end/logs/error-*.log`
2. Abre un issue en el repo
3. Contacta al equipo de desarrollo

## 📝 Changelog

### v2.0 (Actual)
- ✅ Sistema de logging con Winston
- ✅ Validación de roles en login
- ✅ Soporte para múltiples usuarios (Usuario/Lavandería)
- ✅ Geocoding integrado
- ✅ RabbitMQ para emails

### v1.0 (Inicial)
- Autenticación básica JWT
- CRUD de pedidos y servicios

## 📄 Licencia

Privado - Lavadero Development Team

