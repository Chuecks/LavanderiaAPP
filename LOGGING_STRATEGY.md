# Estrategia de Logging - Lavadero App

## Estado actual (sin sistema profesional)
- ✅ console.log/error/warn esparcidos en toda la app
- ❌ No persisten en archivo  
- ❌ Sin rotación de logs
- ❌ Sin niveles de severidad organizados
- ❌ Difícil de debuggear en producción
- ❌ Emoji desordenados (emojis ≠ profesional)

---

## Tipos de logs que necesitas

### 1. **LOGS DE AUTENTICACIÓN** (Críticos)
- Login exitoso/fallido con email y timestamp
- Registros exitosos/fallidos
- Cambios de contraseña
- Logout
- Intentos fallidos (para detectar ataques de fuerza bruta)

**Ubicación**: `logs/auth.log`

### 2. **LOGS DE NEGOCIO** (Importantes)
- Creación de pedidos
- Cambios de estado de pedidos
- Creación/actualización de direcciones
- Actualizaciones de servicios
- Cambios en lavanderías

**Ubicación**: `logs/business.log`

### 3. **LOGS DE ERRORES** (Críticos)
- Errores de base de datos
- Errores de API
- Errores no capturados
- Stack traces completos

**Ubicación**: `logs/error.log`

### 4. **LOGS DE INFRAESTRUCTURA** (Importantes)
- Startup del servidor
- Conexión a MongoDB
- Conexión a RabbitMQ
- Email enviados/fallidos
- Geocodificación

**Ubicación**: `logs/infrastructure.log`

### 5. **LOGS DE PERFORMANCE** (Útiles)
- Duración de queries
- Duración de requests HTTP
- Errores de timeout

**Ubicación**: `logs/performance.log`

---

## Solución: Winston + Morgan

### Winston
- Logger profesional para Node.js
- Múltiples transportes (archivo, consola, base de datos)
- Rotación automática de logs
- Niveles de severidad (error, warn, info, http, debug)
- Formateo JSON para parsing automático

### Morgan
- Logger HTTP automático
- Integración directa con Express
- Formatos predefinidos

---

## Estructura de carpetas
```
Back end/
├── src/
│   ├── utils/
│   │   └── logger.js         ← Config central de Winston
│   ├── middleware/
│   │   └── requestLogger.js   ← Morgan + custom middleware
```

---

## Jerarquía de niveles (por severidad)

| Nivel | Prioridad | Cuándo usar |
|-------|-----------|------------|
| **error** | 🔴 Crítica | Errores no recuperables, crashes |
| **warn** | 🟡 Alta | Situaciones inusuales (login fallido 5x) |
| **info** | 🟢 Media | Eventos importantes (login exitoso) |
| **http** | 🔵 Baja | Requests HTTP (solo en desarrollo) |
| **debug** | ⚪ Muy baja | Info para debugging (solo desarrollo) |

---

## Retención de logs (Recomendación)
- **error.log**: 90 días (crítico para auditoría)
- **auth.log**: 60 días (seguridad)
- **business.log**: 60 días (análisis)
- **infrastructure.log**: 30 días
- **performance.log**: 14 días (opcional)

---

## Índices para búsqueda rápida
Cada log incluirá:
```json
{
  "timestamp": "2026-02-18T12:34:56.789Z",
  "level": "info",
  "service": "auth",
  "userId": "507f1f77bcf86cd799439011",
  "action": "LOGIN_SUCCESS",
  "email": "user@example.com",
  "ipAddress": "192.168.1.100",
  "message": "Usuario logueado exitosamente",
  "details": {}
}
```

---

## Plan de implementación

### Fase 1: Setup (Hoy)
✅ Instalar dependencias (winston, winston-daily-rotate-file)
✅ Crear logger.js centralizado
✅ Crear requestLogger.js con Morgan
✅ Configurar rotación y retención

### Fase 2: Integración (Próximos cambios)
- Reemplazar todos los console.log en:
  - auth.controller.js
  - email.service.js
  - queue.service.js
  - controllers/* 
  
### Fase 3: Monitoreo (Futuro)
- Stack ELK (Elasticsearch, Logstash, Kibana) para análisis
- Alertas automáticas para errores críticos
- Dashboard en tiempo real

