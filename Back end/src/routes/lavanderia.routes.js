const express = require('express');
const router = express.Router();
const { protegerRuta } = require('../middleware/auth.middleware');
const { getMiPerfil, actualizarMisServicios, actualizarMiDireccion } = require('../controllers/lavanderia.controller');

router.use(protegerRuta);

router.get('/perfil', getMiPerfil);
router.put('/servicios', actualizarMisServicios);
router.put('/direccion', actualizarMiDireccion);

module.exports = router;
