const express = require('express');
const router = express.Router();
const { 
    registro, 
    login,
    verificarToken,
    logout,
    olvideContrasena,
    cambiarContrasena
} = require('../controllers/auth.controller');
const { protegerRuta } = require('../middleware/auth.middleware');

// Ruta para registro de usuario
router.post('/registro', registro);

// Ruta para login
router.post('/login', login);

// Ruta para verificar token
router.get('/verificar', verificarToken);

// Ruta para logout (requiere autenticación)
router.post('/logout', protegerRuta, logout);

// Ruta para olvidé contraseña (público)
router.post('/olvide-contrasena', olvideContrasena);

// Ruta para cambiar contraseña (requiere autenticación)
router.post('/cambiar-contrasena', protegerRuta, cambiarContrasena);

module.exports = router;

