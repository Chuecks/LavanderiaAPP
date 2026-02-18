# Guía de Uso del Logger - Lavadero App

## Instalación y Setup

El logger ya está configurado en `src/utils/logger.js` y se inicializa en `src/server.js`.

---

## Cómo Usar

### 1. Importar el logger

```javascript
const getLogger = require('../utils/logger');
const logger = getLogger('nombre-del-modulo');
```

El `nombre-del-modulo` puede ser:
- `auth` (autenticación)
- `business` (lógica de negocio)
- `email` (servicios de email)
- `database` (operaciones BD)
- `http` (requests HTTP)

---

## Ejemplos por Tipo

### ✅ Login Exitoso

```javascript
// En auth.controller.js
logger.loginSuccess(usuario.email, usuario._id, req.ipAddress);

// Genera:
// {
//   "timestamp": "2026-02-18 12:34:56",
//   "level": "info",
//   "service": "auth",
//   "action": "LOGIN_SUCCESS",
//   "email": "user@example.com",
//   "userId": "507f1f77bcf86cd799439011",
//   "ipAddress": "192.168.1.100"
// }
```

### ❌ Login Fallido

```javascript
logger.loginFailure(email, 'Credenciales inválidas', req.ipAddress);

// O con distintas razones:
logger.loginFailure(email, 'Usuario inactivo', req.ipAddress);
logger.loginFailure(email, 'Rol incorrecto. Es lavandería, debe usar opción Lavandería', req.ipAddress);
```

### ✅ Registro Exitoso

```javascript
logger.registerSuccess(usuario.email, usuario.rol, usuario._id);

// Genera log indicando:
// - Email registrado
// - Tipo (usuario o lavanderia)
// - ID en base de datos
```

### ❌ Registro Fallido

```javascript
logger.registerFailure(email, 'Email ya registrado');
```

### 🔐 Cambio de Contraseña

```javascript
// Exitoso
logger.passwordChange(usuario.email, usuario._id, true);

// Fallido
logger.passwordChange(usuario.email, usuario._id, false);
```

### 📋 Operaciones de Negocio

```javascript
// Crear pedido
logger.orderCreated(
  pedido._id,
  usuarioId,
  lavanderiaId,
  monto
);

// Cambiar estado de pedido
logger.orderStatusChanged(
  pedidoId,
  'pendiente',      // Estado anterior
  'aceptado',       // Nuevo estado
  lavanderiaId      // Quién lo cambió
);

// Crear dirección
logger.directionCreated(direccionId, usuarioId);

// Actualizar servicios
logger.serviceUpdated(lavanderiaId, ['Lavado', 'Planchado']);
```

### 📧 Emails

```javascript
// Email enviado exitosamente
logger.emailSent('user@example.com', 'password_reset', 'messageId12345');
logger.emailSent('user@example.com', 'new_order', 'messageId12346');

// Error al enviar email
logger.emailFailed('user@example.com', 'password_reset', error);
```

### 📡 Infraestructura

```javascript
// Conexión a RabbitMQ
logger.rabbitmqConnected();

// Error de RabbitMQ
logger.rabbitmqError(error, 'message_publish');

// Database connection (ya está en server.js)
logger.databaseConnected('MongoDB');
logger.databaseError(error, 'user_find');
```

### 🔴 Errores Genéricos

```javascript
// Error simple
logger.error('Error al obtener usuario', error);

// Error con contexto adicional
logger.error('Error al crear pedido', error, {
  action: 'CREATE_ORDER_FAILED',
  userId: usuario._id,
  lavanderiaId: lavanderia._id
});

// Warning (menos severo que error)
logger.warn('Límite de intentos de login alcanzado', {
  action: 'BRUTE_FORCE_DETECTED',
  email: email,
  ipAddress: req.ipAddress,
  attempts: 5
});

// Info general
logger.info('Operación completada', {
  action: 'OPERATION_COMPLETE',
  duration: '250ms'
});

// Debug (solo en desarrollo)
logger.debug('Estado del usuario:', {
  action: 'STATE_DEBUG',
  userData: usuario
});
```

---

## Archivos de Log Generados

```
Back end/logs/
├── auth-2026-02-18.log           # Logins, registros, cambios de contraseña
├── business-2026-02-18.log       # Pedidos, direcciones, servicios
├── error-2026-02-18.log          # Todos los errores (crítico)
├── infrastructure-2026-02-18.log # DB, Email, RabbitMQ, Startup
└── exceptions-2026-02-18.log     # Excepciones no capturadas
```

Cada archivo se rota **diariamente** y mantiene el histórico:
- `auth-*.log`: 60 días
- `business-*.log`: 60 días
- `error-*.log`: 90 días (máximo - auditoría legal)
- `infrastructure-*.log`: 30 días

---

## Búsqueda y Análisis

### Buscar logins fallidos
```bash
grep "LOGIN_FAILURE" logs/auth-*.log
```

### Buscar errores de un usuario
```bash
grep "user@example.com" logs/auth-*.log logs/error-*.log
```

### Buscar por IP (intentos de fuerza bruta)
```bash
grep "192.168.1.100" logs/auth-*.log
```

### Buscar errores en últimas 24 horas
```bash
grep "$(date +%Y-%m-%d)" logs/error-*.log
```

### Contar intentos de login fallidos
```bash
grep "LOGIN_FAILURE" logs/auth-*.log | wc -l
```

---

## Integración Futura

### Fase 2: Análisis de Logs
```javascript
// En el futuro: Script para detectar patrones
- 5+ logins fallidos de la misma IP → Bloquear IP
- 3+ errores de BD en 1 min → Alert DevOps
- Email no enviado 3 veces → Reenvío por cola
```

### Fase 3: Dashboards
- Stack ELK (Elasticsearch, Logstash, Kibana)
- Grafana para visualizaciones
- PagerDuty para alertas en producción

---

## Mejores Prácticas

✅ **Haz**:
- Loguear decisiones importantes (login, cambios de estado)
- Incluir IDs de usuario/objeto para trazabilidad
- Incluir IP para seguridad
- Incluir error.message y error.stack en errores
- Usar acciones descriptivas (LOGIN_SUCCESS, BRUTE_FORCE_DETECTED)

❌ **No hagas**:
- Loguear datos sensibles (contraseñas, tokens)
- Loguear a cada línea de código (muy verbose)
- Usar emojis en logs de producción
- Loguear en consola.log en lugar del logger

---

## Status Actual

✅ Sistema de logging implementado en:
- [x] server.js
- [x] auth.controller.js (parcialmente)
- [ ] Otros controllers (próxima tarea)
- [ ] email.service.js
- [ ] queue.service.js

Próximos pasos: Reemplazar todos los console.log en controllers y services.

