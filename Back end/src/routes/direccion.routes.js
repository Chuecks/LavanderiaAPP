const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/auth.middleware');
const {
    obtenerDirecciones,
    obtenerDireccion,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion
} = require('../controllers/direccion.controller');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas de direcciones
router.get('/', obtenerDirecciones);
router.get('/:id', obtenerDireccion);
router.post('/', crearDireccion);
router.put('/:id', actualizarDireccion);
router.delete('/:id', eliminarDireccion);

module.exports = router;
