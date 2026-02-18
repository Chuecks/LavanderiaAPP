# Monitoring & Troubleshooting Guide

## Escenarios de Debugging

### 🔍 Problema: Usuario no puede loguear

**Qué revisar:**
```bash
# 1. Buscar intentos de login del usuario
grep "user@example.com" logs/auth-*.log

# 2. Ver si hay errores en base de datos
grep "user@example.com" logs/error-*.log

# 3. Buscar si hay bloqueos por IP (fuerza bruta)
grep "192.168.1.100" logs/auth-*.log | grep "FAILURE"

# 4. Verificar cambios recientes de contraseña
grep "PASSWORD_CHANGE" logs/auth-*.log | grep "user@example.com"
```

**Acciones:**
- Si hay 5+ LOGIN_FAILURE: Posible bloqueo de IP (implementar en el futuro)
- Si hay PASSWORD_CHANGE_FAILED: Base de datos corrupta/problema de permisos
- Si no hay registros: El usuario no existe o está registrado en otro rol

---

### 🚀 Problema: Servidor no inicia

**Qué revisar:**
```bash
# Ver logs de infraestructura (startup, DB, RabbitMQ)
cat logs/infrastructure-*.log | tail -20

# Ver logs de errores
cat logs/error-*.log | tail -20

# Ver si es problema de conexión a MongoDB
grep "DATABASE_ERROR" logs/error-*.log
grep "MONGODB" logs/infrastructure-*.log
```

**Acciones:**
- `DATABASE_ERROR`: Verificar `MONGODB_URI` en `.env`
- `RABBITMQ_ERROR`: RabbitMQ no está corriendo (es opcional, puede ignorarse)
- Otros errores: Ver el full stack trace en logs/error-*.log

---

### 📧 Problema: Emails no se envían

**Qué revisar:**
```bash
# Ver intentos de email
grep "EMAIL_SENT\|EMAIL_FAILED" logs/infrastructure-*.log

# Ver detalles de fallos
grep "EMAIL_FAILED" logs/error-*.log

# Verificar si RabbitMQ está conectado
grep "RABBITMQ" logs/infrastructure-*.log

# Verificar credenciales de SMTP
grep "Email configurado" logs/infrastructure-*.log
```

**Acciones:**
- Si `EMAIL_FAILED`: Revisar `EMAIL_USER` y `EMAIL_PASS` en `.env`
- Si no hay `EMAIL_SENT`: Verificar que email.service está siendo llamado
- Si hay `RABBITMQ_ERROR`: Los emails se están intentando enviar por SMTP directo (backup)

---

### 🔒 Problema: Sospecha de ataque (fuerza bruta)

**Qué revisar:**
```bash
# Contar intentos fallidos por IP
grep "LOGIN_FAILURE" logs/auth-*.log | cut -d'"' -f8 | sort | uniq -c | sort -rn

# Top emails con más intentos fallidos
grep "LOGIN_FAILURE" logs/auth-*.log | grep -o '"email":"[^"]*"' | sort | uniq -c | sort -rn

# Timeline de intentos de la IP sospechosa
grep "192.168.100.50" logs/auth-*.log | grep "LOGIN_FAILURE"
```

**Acciones:**
```javascript
// Implementar en auth.controller.js (PRÓXIMO)
- Contar logins fallidos en último 15 min
- Si > 5: Bloquear durante 1 hora
- Loguear en caso especial: BRUTE_FORCE_BLOCKED
```

---

### 💾 Problema: Datos faltantes en base de datos

**Qué revisar:**
```bash
# Ver qué operaciones se hicieron sobre esa tabla
grep -i "user\|pedido\|direccion" logs/business-*.log

# Ver si hubo errores durante la operación
grep "CREATE_ORDER_FAILED\|DIRECTION_CREATE_FAILED" logs/error-*.log

# Ver timeline completo
grep "objeto_id" logs/*.log | sort
```

**Acciones:**
- Si hay `ORDER_CREATED` pero el orden no existe: Problema de replicación BD
- Si hay `ORDER_CREATE_FAILED`: Ver error específico en error-*.log
- Usar MongoDB compass para verificar índices y data

---

### ⚡ Problema: Performance lenta

**Qué revisar:**
```bash
# Requests HTTP lentos (> 1s)
grep "HTTP_REQUEST" logs/http-*.log | awk '$NF > 1000 {print}'

# Errores de timeout
grep "TIMEOUT\|timeout" logs/error-*.log

# Consultas lentas a BD
grep "DATABASE_SLOW\|duration.*[0-9]{4}" logs/infrastructure-*.log
```

**Acciones:**
```javascript
// PRÓXIMO: Agregar timing a queries
- Loguear duración de queries
- Loguear duración de email.send()
- Loguear duración de geocodificación
- Identificar bottlenecks y optimizar
```

---

## Estructura de Logs (Ejemplo Real)

```json
{
  "timestamp": "2026-02-18 14:32:45",
  "level": "info",
  "service": "auth",
  "action": "LOGIN_SUCCESS",
  "email": "cliente@example.com",
  "userId": "507f1f77bcf86cd799439011",
  "ipAddress": "192.168.1.105",
  "message": "Usuario cliente@example.com logueado exitosamente"
}

{
  "timestamp": "2026-02-18 14:35:12",
  "level": "warn",
  "service": "auth",
  "action": "LOGIN_FAILURE",
  "email": "hacker@example.com",
  "reason": "Credenciales inválidas",
  "ipAddress": "203.0.113.45",
  "message": "Intento de login fallido para hacker@example.com: Credenciales inválidas",
  "attempts_from_ip_last_15min": 7
}

{
  "timestamp": "2026-02-18 14:36:28",
  "level": "error",
  "service": "email",
  "action": "EMAIL_FAILED",
  "email": "user@example.com",
  "type": "password_reset",
  "error": "connect ECONNREFUSED 127.0.0.1:587",
  "message": "Error al enviar email password_reset a user@example.com",
  "stack": "Error: connect ECONNREFUSED...",
  "suggestion": "Verificar credenciales SMTP en .env"
}
```

---

## Comandos Útiles para Bash/PowerShell

### Linux/Mac:
```bash
# En tiempo real
tail -f logs/error-*.log

# Última hora de errores
find logs -name "*.log" -mtime -1 -exec grep "error" {} \;

# Estadísticas de acciones
grep "action" logs/*.log | cut -d'"' -f4 | sort | uniq -c | sort -rn

# Exportar para análisis
cat logs/auth-*.log logs/business-*.log > analysis.log
```

### Windows PowerShell:
```powershell
# En tiempo real
Get-Content logs\error-*.log -Wait -Tail 10

# Últimas 100 líneas de error
Get-Content logs\error-*.log | Select-Object -Last 100

# Buscar por user
Select-String "user@example.com" logs\*.log

# Contar por tipo de error
(Select-String '"action":"' logs\error-*.log).Line | ForEach-Object { $_ -replace '.*"action":"(.*)".*/','$1' } | Group-Object | Sort-Object Count -Descending
```

---

## Setup Recomendado para Producción

### 1. Rotación de Logs Automática
✅ **Ya implementado con winston-daily-rotate-file**
- Archivos diarios: `error-2026-02-18.log`
- Retención: 14-90 días según tipo
- Máximo: 20MB por archivo

### 2. Script de Limpieza (PRÓXIMO)
```bash
#!/bin/bash
# clean-logs.sh - Ejecutar con cron cada 7 días
find logs/ -name "*.log" -mtime +60 -delete  # Eliminar más de 60 días
find logs/ -name "error*.log" -mtime +90 -delete  # Errores: 90 días
```

### 3. Monitoreo de Espacio Disco
```bash
# Primera semana: ~100MB si hay mucho tráfico
# Con rotación: máx ~300MB (15 días x 20MB)
du -sh logs/
```

### 4. Alertas en Tiempo Real (FUTURO)
```javascript
// Implementar script que chequee logs cada minuto:
- Si 10+ ERROR en 1 min → Email al DevOps
- Si 50+ LOGIN_FAILURE en 15 min → Email al Admin Seguridad
- Si DATABASE_ERROR → Slack inmediato
```

---

## KPIs a Monitorear

```javascript
// Métrica: Login Success Rate
successful_logins = grep "LOGIN_SUCCESS" logs/auth-*.log | wc -l
failed_logins = grep "LOGIN_FAILURE" logs/auth-*.log | wc -l
success_rate = successful_logins / (successful_logins + failed_logins)
// Objetivo: > 95%

// Métrica: Email Delivery Rate
emails_sent = grep "EMAIL_SENT" logs/infrastructure-*.log | wc -l
emails_failed = grep "EMAIL_FAILED" logs/error-*.log | wc -l
delivery_rate = emails_sent / (emails_sent + emails_failed)
// Objetivo: > 98%

// Métrica: API Uptime
errors_total = grep "ERROR" logs/error-*.log | wc -l
// Objetivo: < 1% de errores

// Métrica: Performance
slow_requests = grep "response-time.*[5-9][0-9]{2,}" logs/infrastructure-*.log
// Objetivo: < 5% requests > 500ms
```

