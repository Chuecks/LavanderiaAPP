const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/auth.middleware');
const {
    obtenerPedidos,
    obtenerPedido,
    crearPedido,
    actualizarEstadoPedido,
    obtenerEstadisticas
} = require('../controllers/pedido.controller');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas de pedidos
router.get('/', obtenerPedidos);
router.get('/estadisticas', obtenerEstadisticas);
router.get('/:id', obtenerPedido);
router.post('/', crearPedido);
router.put('/:id/estado', actualizarEstadoPedido);

module.exports = router;
