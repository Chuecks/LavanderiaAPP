# 🧺 Lavadero - Plataforma Completa de Gestión de Lavanderías

<div align="center">

![Lavadero Logo](assets/README.md)

**Sistema integral para gestionar lavanderías: conecta clientes con lavanderías, automatiza pedidos, y optimiza operaciones.**

[Características](#-características) • [Tech Stack](#-tech-stack) • [Instalación](#-instalación) • [Documentación](#-documentación) • [Contribuir](#-contribuir) • [Licencia](#-licencia)

---

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![React Native](https://img.shields.io/badge/React%20Native-0.73+-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-brightgreen?logo=mongodb)
![Status](https://img.shields.io/badge/Status-En%20Desarrollo-yellow)
![License](https://img.shields.io/badge/License-Private-red)

</div>

---

## 📸 Concepto

**Lavadero** es una plataforma omnicanal que conecta:

- 👥 **Clientes** que necesitan servicios de lavandería
- 🏪 **Lavanderías** que ofrecen servicios
- 📦 **Sistema de pedidos** automatizado
- 📍 **Geolocalización** para encontrar lavanderías cercanas
- 📧 **Notificaciones** en tiempo real
- 📊 **Analytics** para ambos lados del negocio

## ✨ Características

### 👥 Para Usuarios (Clientes)

- ✅ **Autenticación segura** con JWT
- ✅ **Catálogo de lavanderías** con filtros avanzados
- ✅ **Servicios personalizados** por lavandería
- ✅ **Crear pedidos** de forma rápida e intuitiva
- ✅ **Seguimiento en tiempo real** del estado del pedido
- ✅ **Historial de pedidos** completo
- ✅ **Múltiples direcciones** de entrega
- ✅ **Sistema de calificaciones** para lavanderías
- ✅ **Notificaciones** cuando pedido es completado

### 🏪 Para Lavanderías

- ✅ **Dashboard profesional** de administración
- ✅ **Recepción de pedidos** en tiempo real
- ✅ **Gestión de servicios** (crear, editar, precios)
- ✅ **Cambio de estado** de pedidos (Pendiente → Completado)
- ✅ **Estadísticas detalladas** de operación (KPIs)
- ✅ **Zonas de cobertura** configurables
- ✅ **Reportes** de ingresos y volumen
- ✅ **Gestión de empleados** (futuro)

### 🌐 Sistema General

- ✅ **Logging profesional** con Winston (rotación diaria, análisis)
- ✅ **API RESTful** completa y documentada
- ✅ **Validación de roles** en cada endpoint
- ✅ **Seguridad de autenticación** con JWT + bcrypt
- ✅ **Base de datos** relacional normalizada
- ✅ **Procesamiento asíncrono** con RabbitMQ (emails)
- ✅ **Geocoding** para direcciones
- ✅ **CORS + validación** de requests
- ✅ **Error handling** robusto
- ✅ **Documentación completa**

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%">

### Backend
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Base de datos**: MongoDB + Mongoose
- **Autenticación**: JWT + bcryptjs
- **Logging**: Winston + Daily Rotate
- **HTTP**: Morgan + CORS
- **Queue**: RabbitMQ (opcional)
- **Email**: Nodemailer + SMTP
- **Geocoding**: APIs externas

</td>
<td width="50%">

### Frontend (Mobile)
- **Framework**: React Native
- **Plataforma**: Expo SDK 54+
- **Navegación**: React Navigation
- **Estado**: React Context API
- **HTTP Client**: Axios
- **Persistencia**: AsyncStorage
- **UI**: Native components + Linear Gradient
- **Iconos**: Expo Vector Icons
- **Geolocalización**: Expo Location

</td>
</tr>
</table>

## 📁 Estructura del Proyecto

```
Lavadero/
├── Back end/                      # API Node.js + Express
│   ├── src/
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── models/                # Esquemas MongoDB
│   │   ├── routes/                # Endpoints de API
│   │   ├── services/              # Servicios auxiliares
│   │   ├── middleware/            # Auth, logging, etc
│   │   ├── utils/logger.js        # Sistema centralizado de logs
│   │   └── server.js              # Punto de entrada
│   ├── logs/                      # Archivos de log (generado)
│   ├── .env.example               # Template variables
│   ├── package.json
│   └── README.md                  # Documentación backend
│
├── Front end/                     # App React Native + Expo
│   ├── src/
│   │   ├── screens/               # Pantallas de la app
│   │   ├── components/            # Componentes reutilizables
│   │   ├── services/              # Llamadas a API
│   │   ├── context/               # Estado global (Auth)
│   │   └── config/                # Configuración (API, etc)
│   ├── App.js                     # Punto de entrada
│   ├── app.json                   # Configuración Expo
│   ├── package.json
│   └── README.md                  # Documentación frontend
│
├── DEPLOY.md                      # Guía de deployment
├── LINUX_COMMANDS_FOR_LOGS.md     # Comandos útiles Linux
├── docker-compose.yml             # Docker para desarrollo
├── README.md                      # Este archivo
└── README_GITHUB.md               # Versión GitHub
```

## 🚀 Quick Start

### Requisitos Previos
- Node.js v18+
- MongoDB (local o Atlas)
- npm o yarn
- Expo CLI: `npm install -g expo-cli`

### Backend (5 minutos)

```bash
# Navega a backend
cd "Back end"

# Instala dependencias
npm install

# Configura variables
cp .env.example .env
# Edita .env con tus valores

# Inicia servidor
npm run dev
```

El servidor estará en `http://localhost:4000`

### Frontend (5 minutos)

```bash
# Navega a frontend
cd "Front end"

# Instala dependencias
npm install

# Inicia app
npm start

# Escanea con Expo Go o presiona 'a' para Android
```

## 📚 Documentación

### Para Desarrolladores Backend
- [Back end/README.md](Back%20end/README.md) - Guía completa del API
- [LINUX_COMMANDS_FOR_LOGS.md](LINUX_COMMANDS_FOR_LOGS.md) - Comandos para monitoreo

### Para Desarrolladores Frontend
- [Front end/README.md](Front%20end/README.md) - Guía de la app móvil
- [Front end/BUILD_APK.md](Front%20end/BUILD_APK.md) - Compilar APK
- [Front end/PUBLICAR_PLAY_STORE.md](Front%20end/PUBLICAR_PLAY_STORE.md) - Subir a Play Store

### Para DevOps / Deployment
- [DEPLOY.md](DEPLOY.md) - Deployment en producción
- [LEEME_DOCKER.md](LEEME_DOCKER.md) - Usar Docker (ES)
- [Back end/INSTALACION_RABBITMQ.md](Back%20end/INSTALACION_RABBITMQ.md) - Setup RabbitMQ

### Guides Específicos
- Logging: [LINUX_COMMANDS_FOR_LOGS.md](LINUX_COMMANDS_FOR_LOGS.md)
- RabbitMQ: [Back end/README_RABBITMQ.md](Back%20end/README_RABBITMQ.md)

## 🔐 Seguridad

### Autenticación
- ✅ **JWT** con expiración de 24 horas
- ✅ **Contraseñas encriptadas** con bcryptjs (salt: 10)
- ✅ **Validación de roles** (usuario vs lavandería)
- ✅ **Tokens nunca en localStorage** inseguro
- ✅ **HTTPS en producción**

### Logging & Monitoring
- ✅ **Todos los intentos de login** registrados
- ✅ **Detección de IPs sospechosas**
- ✅ **Rotación automática** de logs cada 24h
- ✅ **Retención configurable** (14-60 días)
- ✅ **Análisis rápido** con grep/bash

```bash
# Ver logins fallidos (desde Linux)
grep "LOGIN_FAILURE" logs/auth-*.log | wc -l

# Top 10 IPs con más intentos fallidos
grep "LOGIN_FAILURE" logs/auth-*.log | \
  grep -o '"ipAddress":"[^"]*' | sort | uniq -c | sort -rn | head -10
```

## 📊 API Endpoints

### Autenticación
```
POST   /api/auth/registro          # Registrar usuario
POST   /api/auth/login             # Iniciar sesión
```

### Pedidos
```
GET    /api/pedidos                # Obtener mis pedidos
POST   /api/pedidos                # Crear nuevo pedido
GET    /api/pedidos/:id            # Detalles de pedido
PUT    /api/pedidos/:id            # Actualizar estado
```

### Servicios
```
GET    /api/servicios              # Listar servicios
POST   /api/servicios              # Crear servicio (lavandería)
PUT    /api/servicios/:id          # Actualizar servicio
DELETE /api/servicios/:id          # Eliminar servicio
```

### Direcciones
```
GET    /api/direcciones            # Mis direcciones
POST   /api/direcciones            # Crear dirección
PUT    /api/direcciones/:id        # Actualizar
DELETE /api/direcciones/:id        # Eliminar
```

### Lavanderías
```
GET    /api/lavanderias            # Listar lavanderías
GET    /api/lavanderias/:id        # Detalles lavandería
PUT    /api/lavanderias/:id        # Actualizar perfil
```

Para documentación completa: Ver [Back end/README.md](Back%20end/README.md)

## 🐳 Docker (Opcional)

```bash
# Desarrollar con Docker Compose
docker-compose up

# Servicio de producción
docker-compose -f docker-compose.full.yml up
```

## 🧪 Testing

```bash
# Backend
cd "Back end"
npm test

# Frontend
cd "Front end"
npm test
```

## 📈 Roadmap

### v2.1 (Próx)
- [ ] WebSocket para tiempo real
- [ ] Integración pagos (Stripe/PayPal)
- [ ] Panel web para lavanderías
- [ ] App web para clientes
- [ ] Inteligencia artificial para recomendaciones

### v2.2
- [ ] Sistema de subscripciones
- [ ] Programa de lealtad
- [ ] Escalado a múltiples países
- [ ] Soporte multi-idioma

### v3.0
- [ ] Marketplace de servicios
- [ ] Integración con múltiples proveedores
- [ ] Analytics avanzado con ELK Stack
- [ ] Chatbot AI para soporte

## 🤝 Contribuir

### Para reportar bugs
1. Abre un **Issue** describiendo el problema
2. Incluye pasos para reproducir
3. Adjunta logs si es posible

### Para sugerir features
1. Abre una **Discussion** explicando la idea
2. Describe el caso de uso
3. Espera feedback del equipo

### Para contribuir código
1. Fork el repositorio
2. Crea rama: `git checkout -b feature/mi-feature`
3. Commit con mensaje claro: `git commit -m "Feat: agregar nueva funcionalidad"`
4. Push: `git push origin feature/mi-feature`
5. Abre Pull Request

### Estándares de Código
- ✅ Nombre de variables descriptivos
- ✅ Funciones pequeñas y reutilizables
- ✅ Documentar funciones complejas
- ✅ Validar inputs
- ✅ Usar logger en lugar de console.log
- ✅ Tests para features nuevas

## 📞 Contacto & Soporte

- **Reportar bugs**: Abre un Issue
- **Preguntas técnicas**: Abre una Discussion
- **Contacto directo**: [Información del equipo]

## 📄 Licencia

**PRIVADO** - Lavadero Development Team

Todos los derechos reservados. Este código es exclusivamente para uso interno del equipo de desarrollo de Lavadero.

---

<div align="center">

### Hecho con ❤️ por el equipo de Lavadero

Conectando clientes con lavanderías. 🧺

</div>
