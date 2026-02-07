# Instalación Rápida de RabbitMQ en Windows

## Opción 1: Instalador de Windows (Recomendado)

1. **Descargar RabbitMQ:**
   - Ir a: https://www.rabbitmq.com/download.html
   - Descargar el instalador de Windows (`.exe`)
   - O descargar directamente desde: https://github.com/rabbitmq/rabbitmq-server/releases

2. **Instalar:**
   - Ejecutar el instalador `.exe`
   - Seguir el asistente de instalación
   - RabbitMQ se instalará como un servicio de Windows

3. **Verificar instalación:**
   - Abrir PowerShell como Administrador
   - Ejecutar: `rabbitmqctl status`
   - Si ves información del servidor, está funcionando ✅

4. **Iniciar el servicio (si no está corriendo):**
   - Presionar `Win + R`
   - Escribir: `services.msc`
   - Buscar "RabbitMQ"
   - Clic derecho → Iniciar

## Opción 2: Usando Chocolatey (Si tienes Chocolatey instalado)

```powershell
choco install rabbitmq
```

## Opción 3: Usando Docker (Si tienes Docker instalado)

```powershell
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

Esto iniciará RabbitMQ con la interfaz de gestión web en: http://localhost:15672
(Usuario: guest, Contraseña: guest)

## Verificar que Funciona

Abrir PowerShell y ejecutar:

```powershell
rabbitmqctl status
```

Deberías ver información del servidor. Si ves un error, el servicio no está corriendo.

## Reiniciar el Backend

Una vez que RabbitMQ esté corriendo, reinicia el backend:

```powershell
cd "Back end"
npm run dev
```

Deberías ver:
- ✅ Conectado a MongoDB
- ✅ Conectado a RabbitMQ
- 📬 Consumidor de emails iniciado. Esperando mensajes...

## Solución de Problemas

### Error: "rabbitmqctl no se reconoce como comando"
- RabbitMQ no está en el PATH
- Buscar "RabbitMQ Command Prompt" en el menú de inicio
- O agregar la ruta de instalación al PATH (normalmente: `C:\Program Files\RabbitMQ Server\rabbitmq_server-{version}\sbin`)

### El servicio no inicia
- Verificar que Erlang esté instalado (RabbitMQ lo requiere)
- Reinstalar RabbitMQ
- Revisar los logs en: `C:\Users\{usuario}\AppData\Roaming\RabbitMQ\logs`

### Puerto 5672 ya está en uso
- Otro proceso está usando el puerto
- Cerrar otros servicios que usen ese puerto
- O cambiar el puerto en la configuración de RabbitMQ
