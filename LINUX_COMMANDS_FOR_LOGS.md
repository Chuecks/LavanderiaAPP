# 🐧 COMANDOS LINUX PARA MANEJAR LOGS - Lavadero App

## ✅ Respuesta Corta
**Sí, con lo implementado manejas PERFECTAMENTE los logs de tu app.**

Solo necesitas estos comandos Linux en tu VM.

---

## 📋 COMANDOS ESENCIALES

### 1️⃣ VER LOGS EN TIEMPO REAL (Lo Más Útil)

```bash
# Ver último log de autenticación (en vivo)
tail -f /ruta/proyecto/Back\ end/logs/auth-*.log

# Ver último log de errores (en vivo)
tail -f /ruta/proyecto/Back\ end/logs/error-*.log

# Ver todos los logs en vivo (combinado)
tail -f /ruta/proyecto/Back\ end/logs/*.log

# Ver últimas 20 líneas sin esperar
tail -20 /ruta/proyecto/Back\ end/logs/auth-*.log
```

**NOTA**: La ruta depende dónde tengas el proyecto. Si está en `/home/usuario/Lavadero`:
```bash
tail -f /home/usuario/Lavadero/Back\ end/logs/auth-*.log
```

---

### 2️⃣ BUSCAR PROBLEMAS

#### A. Usuario específico no puede loguear
```bash
# Buscar todos los intentos de ese usuario
grep "user@example.com" /ruta/Back\ end/logs/auth-*.log

# Contar cuántos intentos fallidos
grep "user@example.com" /ruta/Back\ end/logs/auth-*.log | grep "LOGIN_FAILURE" | wc -l

# Ver cronología
grep "user@example.com" /ruta/Back\ end/logs/auth-*.log | sort
```

#### B. Ataques de fuerza bruta (IP sospechosa)
```bash
# Ver intentos fallidos de una IP
grep "203.0.113.45" /ruta/Back\ end/logs/auth-*.log | grep "LOGIN_FAILURE"

# Contar intentos de esa IP
grep "203.0.113.45" /ruta/Back\ end/logs/auth-*.log | grep "LOGIN_FAILURE" | wc -l

# TOP 10 IPs con más intentos fallidos
grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | \
  grep -oP '"ipAddress":"[^"]+' | \
  sed 's/"ipAddress":"//' | \
  sort | uniq -c | sort -rn | head -10
```

#### C. Emails no se envían
```bash
# Ver todos los intentos de email
grep "EMAIL" /ruta/Back\ end/logs/infrastructure-*.log

# Solo los que fallaron
grep "EMAIL_FAILED" /ruta/Back\ end/logs/error-*.log

# Contar cuántos emails fallaron
grep "EMAIL_FAILED" /ruta/Back\ end/logs/error-*.log | wc -l

# Ver errores específicos
grep -A2 "EMAIL_FAILED" /ruta/Back\ end/logs/error-*.log | grep "error"
```

#### D. Errores en BD
```bash
# Ver todos los errores de BD
grep "DATABASE_ERROR" /ruta/Back\ end/logs/error-*.log

# Últimas 5 líneas de error
grep "DATABASE_ERROR" /ruta/Back\ end/logs/error-*.log | tail -5

# Ver el stack trace completo
grep -A5 "DATABASE_ERROR" /ruta/Back\ end/logs/error-*.log
```

---

### 3️⃣ MONITOREO & ESTADÍSTICAS

#### A. ¿Cuántas personas han logueado hoy?
```bash
# Logins exitosos de hoy
grep "LOGIN_SUCCESS" /ruta/Back\ end/logs/auth-*.log | \
  grep "$(date +%Y-%m-%d)" | wc -l

# Usuarios únicos
grep "LOGIN_SUCCESS" /ruta/Back\ end/logs/auth-*.log | \
  grep "$(date +%Y-%m-%d)" | \
  grep -oP '"email":"[^"]+' | \
  sed 's/"email":"//' | sort | uniq | wc -l
```

#### B. ¿Cuáles fueron los errores más comunes hoy?
```bash
# Top 10 tipos de errores
grep "$(date +%Y-%m-%d)" /ruta/Back\ end/logs/error-*.log | \
  grep -oP '"action":"[^"]+' | \
  sed 's/"action":"//' | \
  sort | uniq -c | sort -rn | head -10
```

#### C. ¿Cuántos intentos fallidos de login?
```bash
# Total de fallos
grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | wc -l

# De hoy
grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | \
  grep "$(date +%Y-%m-%d)" | wc -l
```

#### D. ¿Cuál es el usuario más activo?
```bash
# Top 10 usuarios por logins
grep "LOGIN_SUCCESS" /ruta/Back\ end/logs/auth-*.log | \
  grep -oP '"email":"[^"]+' | \
  sed 's/"email":"//' | \
  sort | uniq -c | sort -rn | head -10
```

---

### 4️⃣ LIMPIEZA & MANTENIMIENTO

#### A. Ver cuánto espacio ocupan los logs
```bash
# Tamaño total
du -sh /ruta/Back\ end/logs/

# Tamaño por archivo
du -sh /ruta/Back\ end/logs/*

# Ver los archivos más grandes
ls -lSh /ruta/Back\ end/logs/
```

#### B. Eliminar logs viejos (> 90 días)
```bash
# Ver qué se eliminaría
find /ruta/Back\ end/logs/ -name "*.log" -mtime +90 -type f

# Realmente eliminarlos
find /ruta/Back\ end/logs/ -name "*.log" -mtime +90 -type f -delete

# Más seguro: mover a backup primero
find /ruta/Back\ end/logs/ -name "*.log" -mtime +90 -exec mv {} /backup/ \;
```

#### C. Comprimir logs viejos (> 30 días) para ahorrar espacio
```bash
# Comprimir a gzip
find /ruta/Back\ end/logs/ -name "*.log" -mtime +30 -exec gzip {} \;

# Ver espacio ahorrado
du -sh /ruta/Back\ end/logs/
ls -lh /ruta/Back\ end/logs/*.gz
```

---

### 5️⃣ EXPORTAR & ANALIZAR

#### A. Guardar búsqueda en archivo
```bash
# Salvar todos los errores de hoy en archivo
grep "$(date +%Y-%m-%d)" /ruta/Back\ end/logs/error-*.log > /tmp/errores_hoy.log

# Enviar a otro servidor
scp /tmp/errores_hoy.log usuario@otroserver:/backup/
```

#### B. Crear reporte por horas
```bash
# Errores por hora (hoy)
grep "$(date +%Y-%m-%d)" /ruta/Back\ end/logs/error-*.log | \
  awk -F' ' '{print $2}' | cut -d: -f1 | sort | uniq -c
```

#### C. Análisis de seguridad
```bash
# IPs que más intentos fallidos hacen
grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | \
  grep -o '"ipAddress":"[^"]*"' | \
  sort | uniq -c | sort -rn | head -20

# Exportar a CSV para Excel
grep "LOGIN_SUCCESS" /ruta/Back\ end/logs/auth-*.log | \
  jq -r '[.timestamp, .email, .ipAddress] | @csv' > /tmp/logins.csv
```

---

## 🚀 SCRIPT AUTOMATIZADO (Cron Job)

### A. Script diario de reporte

Crea archivo `/home/usuario/bin/reporte-logs.sh`:

```bash
#!/bin/bash

LOGS_DIR="/ruta/Back end/logs"
REPORT_FILE="/tmp/reporte_$(date +%Y-%m-%d).txt"

echo "====== REPORTE DE LOGS $(date) ======" > $REPORT_FILE

echo "" >> $REPORT_FILE
echo "=== LOGINS EXITOSOS ===" >> $REPORT_FILE
grep "LOGIN_SUCCESS" $LOGS_DIR/auth-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "=== INTENTOS FALLIDOS ===" >> $REPORT_FILE
grep "LOGIN_FAILURE" $LOGS_DIR/auth-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "=== ERRORES TOTALES ===" >> $REPORT_FILE
grep "ERROR" $LOGS_DIR/error-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "=== EMAILS ENVIADOS ===" >> $REPORT_FILE
grep "EMAIL_SENT" $LOGS_DIR/infrastructure-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> $REPORT_FILE

echo "" >> $REPORT_FILE
echo "=== EMAILS FALLIDOS ===" >> $REPORT_FILE
grep "EMAIL_FAILED" $LOGS_DIR/error-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> $REPORT_FILE

# Enviar por email
mail -s "Reporte Logs Lavadero $(date +%Y-%m-%d)" admin@example.com < $REPORT_FILE
```

**Hacerlo ejecutable**:
```bash
chmod +x /home/usuario/bin/reporte-logs.sh
```

**Ejecutar automáticamente cada día a las 8am** (agregar a crontab):
```bash
crontab -e

# Agregar esta línea:
0 8 * * * /home/usuario/bin/reporte-logs.sh
```

---

### B. Script de alertas (si hay muchos errores)

Crea `/home/usuario/bin/alertas-logs.sh`:

```bash
#!/bin/bash

LOGS_DIR="/ruta/Back end/logs"
THRESHOLD=20  # Alerta si hay > 20 errores/hora

ERRORES=$(grep "$(date +%Y-%m-%d\ %H)" $LOGS_DIR/error-*.log | wc -l)

if [ $ERRORES -gt $THRESHOLD ]; then
  MENSAJE="⚠️ ALERTA: $ERRORES errores en la última hora (límite: $THRESHOLD)"
  
  # Enviar email
  echo "$MENSAJE" | mail -s "ALERTA: Muchos errores en Lavadero" admin@example.com
  
  # O enviar a Slack (si tienes webhook)
  # curl -X POST -H 'Content-type: application/json' \
  #   --data "{\"text\":\"$MENSAJE\"}" \
  #   YOUR_SLACK_WEBHOOK_URL
  
  echo "$(date): $MENSAJE"
fi
```

**Ejecutar cada 15 minutos** (agregar a crontab):
```bash
*/15 * * * * /home/usuario/bin/alertas-logs.sh
```

---

## 💻 ALIAS ÚTILES (Para escribir menos)

Agregar a `~/.bashrc` o `~/.zshrc`:

```bash
# Ver logs de auth en vivo
alias ver-auth='tail -f /ruta/Back\ end/logs/auth-*.log'

# Ver logs de error en vivo
alias ver-error='tail -f /ruta/Back\ end/logs/error-*.log'

# Ver todos los logs
alias ver-todo='tail -f /ruta/Back\ end/logs/*.log'

# Buscar usuario
ver-usuario() {
  grep "$1" /ruta/Back\ end/logs/auth-*.log
}

# Buscar errores de hoy
alias errores-hoy='grep "$(date +%Y-%m-%d)" /ruta/Back\ end/logs/error-*.log'

# Total de intentos fallidos
alias fallos='grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | wc -l'

# Top IPs sospechosas
alias ips-sospechosas='grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | grep -o "ipAddress\":\"[^\"]*" | sort | uniq -c | sort -rn | head -10'

# Tamaño de logs
alias size-logs='du -sh /ruta/Back\ end/logs/'
```

Después de agregar, ejecutar:
```bash
source ~/.bashrc
```

Ahora puedes usar:
```bash
ver-auth
ver-usuario "client@example.com"
errores-hoy
ips-sospechosas
```

---

## 🎯 CASOS DE USO RÁPIDOS

### Problema: Usuario dice "No puedo loguear"
```bash
ver-usuario "usuario@mail.com"
# O:
grep "usuario@mail.com" /ruta/Back\ end/logs/auth-*.log | tail -5
```

### Problema: Sospechas ataque
```bash
ips-sospechosas
# O:
grep "LOGIN_FAILURE" /ruta/Back\ end/logs/auth-*.log | grep -o '"ipAddress":"[^"]*' | sort | uniq -c | sort -rn
```

### Problema: BD lenta/caída
```bash
errores-hoy
# O:
grep "DATABASE_ERROR" /ruta/Back\ end/logs/error-*.log | tail -10
```

### Problema: Emails no se envían
```bash
grep "EMAIL_FAILED" /ruta/Back\ end/logs/error-*.log | tail -5
```

### Quiero generar reporte
```bash
# Opción 1: Ejecutar script
/home/usuario/bin/reporte-logs.sh

# Opción 2: Comandos manuales
echo "=== REPORTE $(date) ===" > /tmp/reporte.txt
echo "Logins hoy:" >> /tmp/reporte.txt
grep "LOGIN_SUCCESS" /ruta/Back\ end/logs/auth-*.log | grep "$(date +%Y-%m-%d)" | wc -l >> /tmp/reporte.txt
cat /tmp/reporte.txt
```

---

## 📊 CHEAT SHEET (Referencia Rápida)

```bash
# Básicos
tail -f /ruta/logs/auth-*.log          # Ver en vivo
grep "EMAIL_FAILED" /ruta/logs/error   # Buscar
wc -l                                   # Contar líneas
sort | uniq -c | sort -rn              # Contar por tipo

# Filtros por fecha
grep "2026-02-18" /ruta/logs/*         # Logs de hoy
grep "2026-02-18 14" /ruta/logs/*      # Logs de la hora 14

# Estadísticas
grep "LOGIN_SUCCESS" /ruta/logs/auth | wc -l                # Total logins
grep "LOGIN_FAILURE" /ruta/logs/auth | wc -l                # Total fallos
grep "LOGIN_SUCCESS" /ruta/logs/auth | grep -c "user@"      # Logins de un usuario

# JSON parsing (si tienes jq instalado)
cat /ruta/logs/auth-*.log | jq '.email'                     # Solo emails
cat /ruta/logs/auth-*.log | jq '.ipAddress' | sort | uniq   # IPs únicas

# Backup/Limpieza
tar czf /backup/logs-$(date +%Y-%m-%d).tar.gz /ruta/logs/   # Comprimir
find /ruta/logs -name "*.log" -mtime +90 -delete             # Eliminar viejos
```

---

## ✅ CONCLUSIÓN

Con estos comandos en tu VM Linux puedes:

✅ Ver logs en tiempo real (`tail -f`)  
✅ Buscar problemas (`grep`)  
✅ Detectar ataques (búsqueda de IPs)  
✅ Monitorear performance (estadísticas)  
✅ Automatizar alertas (cron)  
✅ Generar reportes  
✅ Limpiar archivos viejos  

**NO NECESITAS HERRAMIENTAS EXTRAS. Puro bash y grep.**

¿Necesitas ayuda con algún comando específico? 🚀

