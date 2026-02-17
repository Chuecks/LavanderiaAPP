require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const { iniciarConsumidorEmail } = require('./consumers/email.consumer');

// Importar modelos
require('./models/usuario.model');
require('./models/direccion.model');
require('./models/lavanderia.model');
require('./models/pedido.model');

// Importar rutas
const authRoutes = require('./routes/auth.routes');
const direccionRoutes = require('./routes/direccion.routes');
const pedidoRoutes = require('./routes/pedido.routes');
const servicioRoutes = require('./routes/servicio.routes');
const lavanderiaRoutes = require('./routes/lavanderia.routes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev')); // Logging de peticiones HTTP

// Conexión a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lavadero';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(async () => {
    console.log('✅ Conectado a MongoDB');
    // Eliminar índice username_1 si existe (el modelo no usa username, solo email)
    try {
        await mongoose.connection.db.collection('usuarios').dropIndex('username_1');
        console.log('✅ Índice username_1 eliminado (no usado en este proyecto)');
    } catch (e) {
        if (e.code !== 27 && e.codeName !== 'IndexNotFound') {
            console.log('Nota:', e.message);
        }
    }
})
.catch(err => {
    console.error('❌ Error de conexión a MongoDB:', err);
    process.exit(1);
});

// Ruta de bienvenida
app.get('/', (req, res) => {
    res.json({
        success: true,
        mensaje: '¡API Lavadero funcionando!',
        version: '1.0.0'
    });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/direcciones', direccionRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/servicios', servicioRoutes);
app.use('/api/lavanderia', lavanderiaRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        mensaje: 'Servidor funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// Diagnóstico: ver a qué MongoDB está conectado y cuántos usuarios hay (para detectar si hay dos bases distintas)
app.get('/api/debug/db', async (req, res) => {
    try {
        const uri = (process.env.MONGODB_URI || '').replace(/:[^:@]+@/, ':****@');
        const Usuario = require('./models/usuario.model');
        const count = await Usuario.countDocuments();
        res.json({
            ok: true,
            mongodb_uri_oculta: uri || 'no configurada',
            usuarios_en_esta_base: count,
            mensaje: 'Si ves 0 usuarios pero creaste cuentas, puede que el backend esté usando otra base (ej. local vs Docker).'
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        success: false,
        mensaje: 'Ruta no encontrada'
    });
});

// Manejo de errores global
app.use((err, req, res, next) => {
    console.error('❌ Error:', err.stack);
    res.status(500).json({
        success: false,
        mensaje: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Error desconocido'
    });
});

// Puerto y arranque: escuchar enseguida (como antes). MongoDB se conecta en segundo plano.
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    // Comprobar configuración de email (pedidos y "olvidé contraseña" la usan)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log(`📧 Email configurado (${process.env.EMAIL_USER}). Los correos se envían directamente.`);
    } else {
        console.warn('⚠️ EMAIL_USER o EMAIL_PASS no configurados. Crea/edita Back end/.env para que lleguen los correos (pedidos y restablecer contraseña).');
    }
    // RabbitMQ es opcional: los emails ya se envían desde el backend; el consumidor solo es extra
    iniciarConsumidorEmail().catch((err) => {
        console.log('📬 RabbitMQ no disponible (opcional). Los emails de pedidos y contraseña se envían igual por SMTP.');
    });
});

