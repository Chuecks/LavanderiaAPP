# Configuración de RabbitMQ y Email

Este proyecto utiliza RabbitMQ para enviar notificaciones por email cuando se crea un nuevo pedido.

## Requisitos Previos

1. **RabbitMQ instalado y corriendo**
   - Windows: Descargar desde https://www.rabbitmq.com/download.html
   - Mac: `brew install rabbitmq`
   - Linux: `sudo apt-get install rabbitmq-server`

2. **Iniciar RabbitMQ**
   - Windows: Buscar "RabbitMQ Service" en servicios y iniciarlo
   - Mac/Linux: `rabbitmq-server`

## Configuración

1. **Variables de entorno** (crear archivo `.env` basado en `.env.example`):
   ```
   RABBITMQ_URL=amqp://localhost:5672
   EMAIL_SERVICE=gmail
   EMAIL_USER=tu-email@gmail.com
   EMAIL_PASS=tu-contraseña-de-aplicacion
   EMAIL_DESTINO=tu-email-personal@gmail.com
   ```

2. **Configurar Gmail para emails**:
   - Ir a https://myaccount.google.com/apppasswords
   - Generar una "Contraseña de aplicación"
   - Usar esa contraseña en `EMAIL_PASS` (no tu contraseña normal de Gmail)

## Instalación de Dependencias

```bash
npm install
```

## Funcionamiento

1. **Productor (Backend)**: Cuando se crea un pedido, se publica un mensaje a la cola de RabbitMQ
2. **Consumidor**: Un proceso separado consume los mensajes y envía emails automáticamente
3. **Email**: Se envía un email HTML con todos los detalles del pedido

## Estructura

- `src/services/queue.service.js`: Servicio para publicar mensajes a RabbitMQ
- `src/services/email.service.js`: Servicio para enviar emails
- `src/consumers/email.consumer.js`: Consumidor que procesa mensajes y envía emails

## Verificar que RabbitMQ está corriendo

```bash
# Verificar estado
rabbitmqctl status

# Ver colas
rabbitmqctl list_queues
```

## Notas

- Si RabbitMQ no está disponible, los pedidos se crearán normalmente pero no se enviarán emails
- El consumidor se reinicia automáticamente si hay errores de conexión
- Los mensajes son persistentes (sobreviven a reinicios del servidor)
