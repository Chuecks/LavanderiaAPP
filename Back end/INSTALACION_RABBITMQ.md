# Guía de Instalación - RabbitMQ y Sistema de Emails

## Paso 1: Instalar RabbitMQ

### Windows:
1. Descargar RabbitMQ desde: https://www.rabbitmq.com/download.html
2. Instalar el instalador de Windows
3. RabbitMQ se instalará como un servicio de Windows
4. Verificar que el servicio esté corriendo en "Servicios" de Windows

### Mac:
```bash
brew install rabbitmq
brew services start rabbitmq
```

### Linux (Ubuntu/Debian):
```bash
sudo apt-get update
sudo apt-get install rabbitmq-server
sudo systemctl start rabbitmq-server
sudo systemctl enable rabbitmq-server
```

## Paso 2: Verificar RabbitMQ

Abrir una terminal y ejecutar:
```bash
rabbitmqctl status
```

Si ves información del servidor, está funcionando correctamente.

## Paso 3: Instalar Dependencias del Backend

```bash
cd "Back end"
npm install
```

Esto instalará:
- `amqplib`: Cliente de RabbitMQ para Node.js
- `nodemailer`: Para enviar emails

## Paso 4: Configurar Variables de Entorno

Crear un archivo `.env` en la carpeta `Back end` con:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/lavadero

# JWT
JWT_SECRET=lavadero-secret-key-change-in-production

# Server
PORT=4000
NODE_ENV=development

# RabbitMQ
RABBITMQ_URL=amqp://localhost:5672

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=tu-email@gmail.com
EMAIL_PASS=tu-contraseña-de-aplicacion
EMAIL_DESTINO=tu-email-personal@gmail.com
```

## Paso 5: Configurar Gmail para Envío de Emails

1. Ir a tu cuenta de Google: https://myaccount.google.com/
2. Activar "Verificación en 2 pasos" si no está activada
3. Ir a: https://myaccount.google.com/apppasswords
4. Seleccionar "Correo" y "Otro (nombre personalizado)"
5. Escribir "Lavadero App"
6. Copiar la contraseña generada (16 caracteres)
7. Usar esa contraseña en `EMAIL_PASS` (NO tu contraseña normal de Gmail)

**Nota:** Si usas otro proveedor de email (Outlook, Yahoo, etc.), ajusta `EMAIL_SERVICE` y las credenciales según corresponda.

## Paso 6: Iniciar el Backend

```bash
cd "Back end"
npm run dev
```

Deberías ver:
- ✅ Conectado a MongoDB
- ✅ Conectado a RabbitMQ
- 📬 Consumidor de emails iniciado. Esperando mensajes...
- 🚀 Servidor corriendo en puerto 4000

## Cómo Funciona

1. **Usuario crea un pedido** en la app
2. **Backend crea el pedido** en MongoDB
3. **Backend publica mensaje** a RabbitMQ (cola: `pedidos_email`)
4. **Consumidor recibe el mensaje** automáticamente
5. **Consumidor obtiene datos completos** del pedido desde MongoDB
6. **Consumidor envía email** con todos los detalles del pedido
7. **Email llega a tu bandeja de entrada**

## Verificar que Funciona

1. Crear un pedido desde la app
2. Verificar en la consola del backend:
   - `📨 Pedido publicado a la cola de emails`
   - `📨 Procesando pedido para email: [ID]`
   - `✅ Email enviado exitosamente para pedido: [ID]`
3. Revisar tu bandeja de entrada

## Solución de Problemas

### RabbitMQ no se conecta:
- Verificar que RabbitMQ esté corriendo: `rabbitmqctl status`
- Verificar la URL en `.env`: `RABBITMQ_URL=amqp://localhost:5672`

### Emails no se envían:
- Verificar credenciales de Gmail en `.env`
- Asegurarse de usar "Contraseña de aplicación" de Google, no la contraseña normal
- Verificar que `EMAIL_DESTINO` sea un email válido

### El consumidor no inicia:
- Verificar que RabbitMQ esté corriendo
- Revisar los logs del backend para ver errores específicos
