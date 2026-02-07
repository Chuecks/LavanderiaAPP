const amqp = require('amqplib');

let connection = null;
let channel = null;
const QUEUE_NAME = 'pedidos_email';

// Conectar a RabbitMQ
const connectRabbitMQ = async () => {
    try {
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        
        connection = await amqp.connect(RABBITMQ_URL);
        channel = await connection.createChannel();
        
        // Asegurar que la cola existe
        await channel.assertQueue(QUEUE_NAME, {
            durable: true // La cola sobrevive a reinicios del servidor
        });
        
        console.log('✅ Conectado a RabbitMQ');
        return { connection, channel };
    } catch (error) {
        console.error('❌ Error al conectar con RabbitMQ:', error);
        throw error;
    }
};

// Publicar un mensaje a la cola
const publicarPedido = async (pedidoData) => {
    try {
        if (!channel) {
            await connectRabbitMQ();
        }
        
        const mensaje = JSON.stringify(pedidoData);
        
        // Publicar mensaje de forma persistente
        channel.sendToQueue(QUEUE_NAME, Buffer.from(mensaje), {
            persistent: true // El mensaje sobrevive a reinicios del servidor
        });
        
        console.log(`📨 Mensaje publicado a la cola ${QUEUE_NAME}:`, pedidoData._id || pedidoData.id);
        return true;
    } catch (error) {
        console.error('❌ Error al publicar mensaje a RabbitMQ:', error);
        throw error;
    }
};

// Cerrar conexión
const cerrarConexion = async () => {
    try {
        if (channel) {
            await channel.close();
        }
        if (connection) {
            await connection.close();
        }
        console.log('🔌 Conexión a RabbitMQ cerrada');
    } catch (error) {
        console.error('Error al cerrar conexión RabbitMQ:', error);
    }
};

module.exports = {
    connectRabbitMQ,
    publicarPedido,
    cerrarConexion,
    QUEUE_NAME
};
