const Usuario = require('../models/usuario.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { enviarEmailNuevaContrasena } = require('../services/email.service');

// Registro de nuevo usuario (cliente)
const registro = async (req, res) => {
    try {
        const { nombre, email, telefono, password } = req.body;

        // Validar campos requeridos
        if (!nombre || !email || !telefono || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Por favor completa todos los campos requeridos'
            });
        }

        // Verificar si el usuario ya existe por email
        const usuarioExistente = await Usuario.findOne({ email: email.toLowerCase() });
        if (usuarioExistente) {
            return res.status(400).json({
                success: false,
                mensaje: 'El email ya está registrado'
            });
        }

        // Crear el nuevo usuario (cliente)
        // telefono: número completo con código de país pegado (ej: +59899123456)
        // La contraseña se encriptará automáticamente por el middleware pre('save')
        const telefonoGuardar = (telefono || '').trim();
        const usuario = await Usuario.create({
            nombre: nombre.trim(),
            email: email.toLowerCase().trim(),
            telefono: telefonoGuardar,
            password // Se encriptará automáticamente
        });

        res.status(201).json({
            success: true,
            mensaje: 'Usuario registrado exitosamente',
            data: {
                _id: usuario._id,
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.telefono,
                createdAt: usuario.createdAt
            }
        });

    } catch (error) {
        console.error('Error en registro de usuario:', error);
        
        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const mensajes = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                mensaje: mensajes.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            mensaje: 'Error al crear el usuario',
            error: error.message
        });
    }
};

// Login de usuario (cliente)
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que se envíen los datos requeridos
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                mensaje: 'Por favor ingresa email y contraseña'
            });
        }

        // Buscar usuario por email
        const usuario = await Usuario.findOne({ email: email.toLowerCase() });

        if (!usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Verificar si el usuario está activo
        if (!usuario.activo) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario inactivo. Contacta al administrador'
            });
        }

        // Verificar contraseña usando el método del modelo
        const passwordValida = await usuario.compararPassword(password);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'Credenciales inválidas'
            });
        }

        // Actualizar último acceso
        usuario.ultimoAcceso = Date.now();
        await usuario.save();

        // Generar token JWT
        const token = jwt.sign(
            { 
                id: usuario._id,
                email: usuario.email
            },
            process.env.JWT_SECRET || 'lavadero-secret-key-change-in-production',
            { expiresIn: '24h' }
        );

        res.json({
            success: true,
            mensaje: 'Login exitoso',
            data: {
                token,
                usuario: {
                    _id: usuario._id,
                    nombre: usuario.nombre,
                    email: usuario.email,
                    telefono: usuario.telefono,
                    ultimoAcceso: usuario.ultimoAcceso,
                    createdAt: usuario.createdAt
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al iniciar sesión',
            error: error.message
        });
    }
};

// Verificar token (para validar sesión)
const verificarToken = async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1]; // Bearer token

        if (!token) {
            return res.status(401).json({
                success: false,
                mensaje: 'Token no proporcionado'
            });
        }

        const decoded = jwt.verify(
            token, 
            process.env.JWT_SECRET || 'lavadero-secret-key-change-in-production'
        );

        const usuario = await Usuario.findById(decoded.id).select('-password');
        
        if (!usuario || !usuario.activo) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no válido'
            });
        }

        res.json({
            success: true,
            data: {
                usuario
            }
        });

    } catch (error) {
        console.error('Error al verificar token:', error);
        res.status(401).json({
            success: false,
            mensaje: 'Token inválido o expirado'
        });
    }
};

// Logout de usuario
const logout = async (req, res) => {
    try {
        // El token ya fue verificado por el middleware protegerRuta
        // Aquí podemos registrar el evento de logout si es necesario
        const usuario = req.usuario;
        
        console.log(`Usuario ${usuario.email} (${usuario._id}) cerró sesión`);

        res.json({
            success: true,
            mensaje: 'Sesión cerrada exitosamente'
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cerrar sesión',
            error: error.message
        });
    }
};

// Generar contraseña temporal: 8+ caracteres, al menos una mayúscula, número y símbolo (como RegisterScreen)
const generarNuevaContrasena = (nombre) => {
    const simbolos = '!@#$%&*';
    const nombreLimpio = (nombre || 'User').replace(/\s/g, '').slice(0, 3).toLowerCase();
    const base = nombreLimpio.length >= 2 ? nombreLimpio : nombreLimpio + 'x';
    const primeraMayuscula = base.charAt(0).toUpperCase() + base.slice(1);
    const num = Math.floor(1000 + Math.random() * 9000); // 4 dígitos → siempre 8+ caracteres en total
    const sym = simbolos[Math.floor(Math.random() * simbolos.length)];
    return primeraMayuscula + num + sym; // Ej: Jua3847& → 8 caracteres, cumple validación
};

// Olvidé contraseña: genera nueva contraseña y la envía por email
const olvideContrasena = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email || !email.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'Por favor ingresa tu email'
            });
        }

        const emailNormalizado = email.trim().toLowerCase();
        const usuario = await Usuario.findOne({ email: emailNormalizado });

        if (!usuario) {
            return res.status(404).json({
                success: false,
                mensaje: 'No existe una cuenta con ese email'
            });
        }

        if (!usuario.activo) {
            return res.status(400).json({
                success: false,
                mensaje: 'La cuenta está inactiva. Contacta al administrador.'
            });
        }

        const nuevaContrasena = generarNuevaContrasena(usuario.nombre);
        usuario.password = nuevaContrasena;
        await usuario.save();

        await enviarEmailNuevaContrasena(usuario.email, usuario.nombre, nuevaContrasena);

        res.json({
            success: true,
            mensaje: 'Se ha creado una nueva contraseña y se ha enviado a tu email. Revisa tu bandeja y cámbiala por una personal después de iniciar sesión.'
        });
    } catch (error) {
        console.error('Error en olvidé contraseña:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al restablecer la contraseña. Intenta más tarde.',
            error: error.message
        });
    }
};

// Cambiar contraseña (usuario autenticado)
const cambiarContrasena = async (req, res) => {
    try {
        const { contraseñaActual, nuevaContrasena } = req.body;
        // Cargar usuario CON password para poder comparar la contraseña actual
        const usuario = await Usuario.findById(req.usuario._id);
        if (!usuario) {
            return res.status(401).json({
                success: false,
                mensaje: 'Usuario no encontrado'
            });
        }

        if (!contraseñaActual || !nuevaContrasena) {
            return res.status(400).json({
                success: false,
                mensaje: 'Ingresa la contraseña actual y la nueva contraseña'
            });
        }

        const passwordValida = await usuario.compararPassword(contraseñaActual);
        if (!passwordValida) {
            return res.status(401).json({
                success: false,
                mensaje: 'La contraseña actual no es correcta'
            });
        }

        // Validar nueva contraseña: 8+ caracteres, mayúscula, número, carácter especial
        if (nuevaContrasena.length < 8) {
            return res.status(400).json({
                success: false,
                mensaje: 'La nueva contraseña debe tener al menos 8 caracteres'
            });
        }
        if (!/[A-Z]/.test(nuevaContrasena)) {
            return res.status(400).json({
                success: false,
                mensaje: 'La nueva contraseña debe tener al menos una letra mayúscula'
            });
        }
        if (!/[0-9]/.test(nuevaContrasena)) {
            return res.status(400).json({
                success: false,
                mensaje: 'La nueva contraseña debe tener al menos un número'
            });
        }
        if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaContrasena)) {
            return res.status(400).json({
                success: false,
                mensaje: 'La nueva contraseña debe tener al menos un carácter especial (!@#$%&* etc.)'
            });
        }

        usuario.password = nuevaContrasena;
        await usuario.save();

        res.json({
            success: true,
            mensaje: 'Contraseña actualizada correctamente'
        });
    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cambiar la contraseña. Intenta más tarde.',
            error: error.message
        });
    }
};

module.exports = {
    registro,
    login,
    verificarToken,
    logout,
    olvideContrasena,
    cambiarContrasena
};

