const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/auth.middleware');
const {
    obtenerPedidos,
    obtenerPedido,
    crearPedido,
    actualizarEstadoPedido,
    obtenerEstadisticas,
    listarPedidosLavanderia,
    aceptarPedidoLavanderia,
    rechazarPedidoLavanderia,
    cancelarPedidoLavanderia,
    pasarAEnProcesoLavanderia,
    pasarACompletadoLavanderia,
    reasignarPedidoRechazado
} = require('../controllers/pedido.controller');

// Todas las rutas requieren autenticación
router.use(protegerRuta);

// Rutas de pedidos (lavandería: deben ir antes de /:id)
router.get('/lavanderia', listarPedidosLavanderia);
router.put('/:id/aceptar', aceptarPedidoLavanderia);
router.put('/:id/rechazar', rechazarPedidoLavanderia);
router.put('/:id/cancelar', cancelarPedidoLavanderia);
router.put('/:id/en-proceso', pasarAEnProcesoLavanderia);
router.put('/:id/completar', pasarACompletadoLavanderia);

// Rutas de pedidos (usuario)
router.get('/', obtenerPedidos);
router.get('/estadisticas', obtenerEstadisticas);
router.put('/:id/reasignar-lavanderia', reasignarPedidoRechazado);
router.get('/:id', obtenerPedido);
router.post('/', crearPedido);
router.put('/:id/estado', actualizarEstadoPedido);

module.exports = router;
