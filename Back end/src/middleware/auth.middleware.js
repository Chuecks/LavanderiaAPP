const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario.model');

// Middleware para proteger rutas que requieren autenticación
const protegerRuta = async (req, res, next) => {
    try {
        let token;

        // Obtener token del header Authorization
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                mensaje: 'No autorizado. Token no proporcionado.'
            });
        }

        // Verificar token
        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'lavadero-secret-key-change-in-production'
        );

        // Obtener usuario del token
        req.usuario = await Usuario.findById(decoded.id).select('-password');

        if (!req.usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        if (!req.usuario.activo) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario inactivo'
            });
        }

        next();
    } catch (error) {
        console.error('Error en middleware de autenticación:', error);
        return res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado'
        });
    }
};

module.exports = {
    protegerRuta
};

