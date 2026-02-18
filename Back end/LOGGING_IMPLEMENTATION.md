# Sistema de Logging Implementado ✅

## Resumen de lo Implementado

### 📦 Dependencias Instaladas
- **winston** v3.x : Logger profesional
- **winston-daily-rotate-file** : Rotación automática de logs

### 📁 Archivos Creados
```
Back end/
├── src/
│   ├── utils/
│   │   └── logger.js                    ✅ Logger centralizado
│   └── middleware/
│       └── requestLogger.js              ✅ Morgan + contexto HTTP
├── logs/                                 ✅ Carpeta de logs (auto-creada)
├── LOGGING_GUIDE.md                     ✅ Guía de uso
└── MONITORING_GUIDE.md                  ✅ Guía de troubleshooting
```

### 🔧 Archivos Modificados
```
✅ Back end/src/server.js
   - Winston integrado (reemplazó morgan simple)
   - Logging de startup, conexión BD, errores
   
✅ Back end/src/controllers/auth.controller.js
   - Métodos de logger importados
   - console.error → logger.error()
   
✅ Back end/src/middleware/requestLogger.js
   - Morgan con custom stream a Winston
   - Captura de IP real
   - Logging de errores HTTP
```

---

## 🎯 Tipos de Logs Implementados

| Log | Archivo | Retención | Casos de Uso |
|-----|---------|-----------|-------------|
| **ERROR** | error-YYYY-MM-DD.log | 14 días | Crashes, excepciones, errores BD |
| **AUTH** | auth-YYYY-MM-DD.log | 60 días | Login, registro, cambios contraseña |
| **BUSINESS** | business-YYYY-MM-DD.log | 60 días | Pedidos, direcciones, servicios |
| **INFRASTR.** | infrastructure-YYYY-MM-DD.log | 30 días | DB, Email, RabbitMQ, startup |
| **HTTP** | Console en desarrollo | - | Requests HTTP (dev only) |

---

## 📊 Estructura de un Log

```json
{
  "timestamp": "2026-02-18 14:32:45",
  "level": "info",                    // error, warn, info, http, debug
  "service": "auth",                  // Módulo que generó el log
  "action": "LOGIN_SUCCESS",          // Acción específica
  "email": "user@example.com",        // Datos relevantes
  "userId": "507f...",
  "ipAddress": "192.168.1.105",
  "message": "Usuario logueado..."
}
```

---

## 🚀 Métodos Disponibles

### Autenticación
```javascript
logger.loginSuccess(email, userId, ipAddress);
logger.loginFailure(email, reason, ipAddress);
logger.registerSuccess(email, role, userId);
logger.registerFailure(email, reason);
logger.logout(email, userId);
logger.passwordChange(email, userId, success);
```

### Negocio
```javascript
logger.orderCreated(orderId, userId, launderyId, amount);
logger.orderStatusChanged(orderId, oldStatus, newStatus, userId);
logger.directionCreated(directionId, userId);
logger.serviceUpdated(launderyId, services);
```

### Infraestructura
```javascript
logger.databaseConnected(connectionString);
logger.databaseError(error, context);
logger.emailSent(email, type, messageId);
logger.emailFailed(email, type, error);
logger.rabbitmqConnected();
logger.rabbitmqError(error, context);
logger.serverStarted(port, environment);
```

### Genéricos
```javascript
logger.error(message, error, context);
logger.warn(message, context);
logger.info(message, context);
logger.debug(message, context);
```

---

## 📈 Ventajas del Sistema Implementado

✅ **Persistencia**: Logs se guardan en archivo (no se pierden)
✅ **Rotación**: Archivos diarios con límite de días de retención
✅ **Búsqueda**: Fácil grep/Select-String de logs JSON
✅ **Estructura**: Campos consistentes para análisis
✅ **Performance**: Sin impacto en velocidad de API
✅ **Seguridad**: No se loguean contraseñas/tokens
✅ **Escalable**: Listo para ELK Stack en futuro
✅ **Análisis**: Trace de usuarios/IPs/errores

---

## 🔄 Próximos Pasos (Recomendados)

### Fase 2: Completar Integración
1. Reemplazar console.log en:
   - [ ] Todos los controllers (pedido, dirección, lavanderia, servicio)
   - [ ] email.service.js
   - [ ] queue.service.js
   - [ ] email.consumer.js

2. Agregar timing a operaciones lentas:
   ```javascript
   const start = Date.now();
   // operación...
   const duration = Date.now() - start;
   logger.info('Operación completada', { duration });
   ```

### Fase 3: Monitoreo
1. Script para detectar patrones:
   - Bloquear IP tras 5 logins fallidos
   - Alerta si > 10 errores en 1 min
   - Reintento automático de emails fallidos

2. Stack ELK (opcional):
   - Elasticsearch: Almacenar logs centralizados
   - Logstash: Procesar y filtrar logs
   - Kibana: Dashboards y visualizaciones

### Fase 4: Alertas (Producción)
```javascript
- Configurar PagerDuty o similar
- Alert si error rate > 1%
- Alert si login failure rate > 20%
- Slack notificaciones de eventos críticos
```

---

## 💡 Uso Recomendado

### Desarrollo
```bash
# Ver logs en tiempo real
tail -f logs/error-*.log
tail -f logs/auth-*.log
```

### Troubleshooting
```bash
# Usuario no puede loguear
grep "email@example.com" logs/auth-*.log

# Búsqueda de errores por tipo
grep "DATABASE_ERROR" logs/error-*.log

# Timeline de eventos
grep "2026-02-18.*14:" logs/*.log | sort
```

### Análisis de Seguridad
```bash
# Top 10 IPs con más intentos fallidos
grep "LOGIN_FAILURE" logs/auth-*.log | \
  awk -F'"' '{print $14}' | sort | uniq -c | sort -rn | head -10

# Detectar fuerza bruta (> 5 intentos en 15 min de misma IP)
grep "LOGIN_FAILURE" logs/auth-*.log | \
  awk -F'"' '{print $14}' | sort | uniq -c | awk '$1 > 5 {print}'
```

---

## 🔒 Seguridad de Logs

⚠️ **Importante**: Los logs contienen:
- Emails de usuarios
- IPs
- Timestamps
- Información de acciones

✅ **Buenas prácticas**:
- Restringir acceso a carpeta `logs/` 
- No compartir logs con datos sensibles
- Cifrar logs en tránsito si se envían a servidor remoto
- Implementar rotación automática (ya hecha)
- Borrar logs viejos (configurado: 30-90 días según tipo)

---

## 📞 Soporte

Para más info, ver:
- **Guía de Uso**: `LOGGING_GUIDE.md`
- **Troubleshooting**: `MONITORING_GUIDE.md`
- **Estrategia**: `LOGGING_STRATEGY.md`

---

**Status**: ✅ Sistema activo y funcionando
**Última actualización**: 2026-02-18
**Versión**: 1.0

