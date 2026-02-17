const express = require('express');
const router = express.Router();
const { listarServicios } = require('../controllers/servicio.controller');

// Público: listado de servicios (para registro lavandería y para consistencia con pedidos)
router.get('/', listarServicios);

module.exports = router;
