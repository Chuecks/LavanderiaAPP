# Backend Lavadero

Backend desarrollado con Node.js, Express y MongoDB para la gestión de un negocio de lavandería.

## Características

- 🔐 Autenticación con JWT
- 🔒 Encriptación de contraseñas con bcrypt
- 📝 Registro y login de usuarios
- 🛡️ Middleware de autenticación
- 👥 Gestión de roles (admin/empleado)

## Tecnologías Utilizadas

- Node.js
- Express.js
- MongoDB con Mongoose
- JWT (JSON Web Tokens)
- bcryptjs
- CORS
- Morgan (logging)

## Instalación

1. Instala las dependencias:
```bash
npm install
```

2. Crea un archivo `.env` basado en `.env.example`:
```bash
cp .env.example .env
```

3. Configura las variables de entorno en `.env`:
```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/lavadero
JWT_SECRET=tu-secret-key-muy-segura
NODE_ENV=development
```

4. Asegúrate de tener MongoDB corriendo localmente o configura una URI de MongoDB Atlas.

5. Inicia el servidor:
```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

## Estructura del Proyecto

```
Back end/
├── src/
│   ├── controllers/
│   │   └── auth.controller.js    # Lógica de autenticación
│   ├── models/
│   │   └── usuario.model.js      # Modelo de usuario con encriptación
│   ├── routes/
│   │   └── auth.routes.js       # Rutas de autenticación
│   ├── middleware/
│   │   └── auth.middleware.js   # Middleware de autenticación
│   └── server.js                # Servidor principal
├── .env.example                 # Ejemplo de variables de entorno
├── .gitignore
├── package.json
└── README.md
```

## API Endpoints

### Autenticación

#### POST `/api/auth/registro`
Registra un nuevo usuario.

**Body:**
```json
{
  "username": "admin",
  "email": "admin@lavadero.com",
  "password": "password123",
  "nombre": "Juan",
  "apellido": "Pérez",
  "telefono": "+56 9 1234 5678",
  "rol": "admin"
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Usuario registrado exitosamente",
  "data": {
    "_id": "...",
    "username": "admin",
    "email": "admin@lavadero.com",
    "nombre": "Juan",
    "rol": "admin"
  }
}
```

#### POST `/api/auth/login`
Inicia sesión con usuario y contraseña.

**Body:**
```json
{
  "username": "admin",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "mensaje": "Login exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "_id": "...",
      "username": "admin",
      "email": "admin@lavadero.com",
      "nombre": "Juan",
      "rol": "admin"
    }
  }
}
```

#### GET `/api/auth/verificar`
Verifica si un token es válido.

**Headers:**
```
Authorization: Bearer <token>
```

## Seguridad

- Las contraseñas se encriptan automáticamente antes de guardarse en la base de datos usando bcrypt
- Los tokens JWT expiran después de 24 horas
- Las contraseñas nunca se devuelven en las respuestas JSON
- Middleware de autenticación para proteger rutas

## Base de Datos

El modelo de usuario se guarda en MongoDB con los siguientes campos:
- `username`: Nombre de usuario único
- `email`: Email único
- `password`: Contraseña encriptada (hash)
- `nombre`: Nombre del usuario
- `apellido`: Apellido del usuario
- `telefono`: Teléfono de contacto
- `rol`: Rol del usuario (admin/empleado)
- `activo`: Estado del usuario
- `ultimoAcceso`: Fecha del último acceso
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización

## Notas

- Cambia el `JWT_SECRET` en producción por una clave segura
- Asegúrate de tener MongoDB corriendo antes de iniciar el servidor
- Para desarrollo local, puedes usar MongoDB Community Edition o MongoDB Atlas

