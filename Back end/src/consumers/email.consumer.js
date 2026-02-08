require('dotenv').config();
const mongoose = require('mongoose');
const amqp = require('amqplib');
const { enviarEmailPedido } = require('../services/email.service');
const Pedido = require('../models/pedido.model');
const { QUEUE_NAME } = require('../services/queue.service');

// Conectar a MongoDB si no está conectado
const conectarMongoDB = async () => {
    if (mongoose.connection.readyState === 1) {
        return; // Ya está conectado
    }
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lavadero';
    await mongoose.connect(MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log('✅ MongoDB conectado desde consumidor');
};

// Consumidor de mensajes de RabbitMQ para enviar emails
let intentosReconexion = 0;
const MAX_INTENTOS = 3;

const iniciarConsumidorEmail = async (intento = 1) => {
    try {
        // Asegurar conexión a MongoDB
        await conectarMongoDB();
        
        const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
        
        // Conectar a RabbitMQ
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();
        
        // Resetear contador de intentos si la conexión es exitosa
        intentosReconexion = 0;
        
        // Asegurar que la cola existe
        await channel.assertQueue(QUEUE_NAME, {
            durable: true
        });
        
        // Configurar prefetch para procesar un mensaje a la vez
        channel.prefetch(1);
        
        console.log('📬 Consumidor de emails iniciado. Esperando mensajes...');
        
        // Consumir mensajes de la cola
        channel.consume(QUEUE_NAME, async (msg) => {
            if (msg) {
                try {
                    const pedidoData = JSON.parse(msg.content.toString());
                    console.log('📨 Procesando pedido para email:', pedidoData._id || pedidoData.id);
                    
                    // Obtener información completa del pedido desde la base de datos
                    const pedidoCompleto = await Pedido.findById(pedidoData._id || pedidoData.id)
                        .populate('usuario', 'nombre email telefono');
                    
                    if (!pedidoCompleto) {
                        console.error('⚠️ Pedido no encontrado en la base de datos:', pedidoData._id || pedidoData.id);
                        channel.ack(msg);
                        return;
                    }
                    
                    // Convertir a objeto plano para el email
                    const pedidoParaEmail = {
                        _id: pedidoCompleto._id,
                        id: pedidoCompleto._id,
                        estado: pedidoCompleto.estado,
                        createdAt: pedidoCompleto.createdAt,
                        servicio: pedidoCompleto.servicio,
                        direccionRecogida: pedidoCompleto.direccionRecogida,
                        direccionEntrega: pedidoCompleto.direccionEntrega,
                        horarioRecogida: pedidoCompleto.horarioRecogida,
                        horarioEntrega: pedidoCompleto.horarioEntrega,
                        notas: pedidoCompleto.notas,
                        lavanderia: pedidoCompleto.lavanderia,
                        usuario: {
                            nombre: pedidoCompleto.usuario?.nombre,
                            email: pedidoCompleto.usuario?.email,
                            telefono: pedidoCompleto.usuario?.telefono
                        }
                    };
                    
                    // Enviar email
                    await enviarEmailPedido(pedidoParaEmail);
                    
                    console.log('✅ Email enviado exitosamente para pedido:', pedidoCompleto._id);
                    
                    // Confirmar que el mensaje fue procesado
                    channel.ack(msg);
                } catch (error) {
                    console.error('❌ Error al procesar mensaje:', error);
                    
                    // En caso de error, decidir si reintentar o descartar
                    // Por ahora, descartamos el mensaje para evitar bucles infinitos
                    // En producción, podrías implementar un sistema de reintentos
                    channel.nack(msg, false, false);
                }
            }
        }, {
            noAck: false // Requiere confirmación manual
        });
        
        // Manejar errores de conexión
        connection.on('error', (err) => {
            console.error('❌ Error de conexión RabbitMQ:', err.message);
        });
        
        connection.on('close', () => {
            console.log('⚠️ Conexión RabbitMQ cerrada. Intentando reconectar...');
            if (intentosReconexion < MAX_INTENTOS) {
                intentosReconexion++;
                setTimeout(() => iniciarConsumidorEmail(intentosReconexion), 5000);
            } else {
                console.log('⚠️ Máximo de intentos alcanzado. Consumidor de emails desactivado.');
                console.log('⚠️ Los pedidos se crearán pero no se enviarán emails automáticamente.');
                console.log('💡 Para activar los emails, instala y ejecuta RabbitMQ.');
            }
        });
        
        // Manejar cierre de conexión
        process.once('SIGINT', async () => {
            console.log('\n🛑 Cerrando consumidor de emails...');
            try {
                await channel.close();
                await connection.close();
            } catch (err) {
                // Ignorar errores al cerrar
            }
            process.exit(0);
        });
        
    } catch (error) {
        if (intento <= MAX_INTENTOS) {
            intentosReconexion = intento;
            console.error(`❌ Error al iniciar consumidor de emails (intento ${intento}/${MAX_INTENTOS}):`, error.message);
            if (intento < MAX_INTENTOS) {
                console.log(`🔄 Reintentando en 5 segundos...`);
                setTimeout(() => iniciarConsumidorEmail(intento + 1), 5000);
            } else {
                console.log('⚠️ RabbitMQ no disponible. Los emails de pedidos y contraseña se envían igual por SMTP desde el backend.');
            }
        }
    }
};

module.exports = {
    iniciarConsumidorEmail
};
