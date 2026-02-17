const Lavanderia = require('../models/lavanderia.model');
const { geocodificarDireccion } = require('../services/geocoding.service');

// Obtener el perfil de la lavandería del usuario autenticado (rol lavanderia)
const getMiPerfil = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden acceder a este perfil'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id }).lean();
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        res.json({
            success: true,
            data: {
                _id: lavanderia._id,
                nombre: lavanderia.nombre,
                calle: lavanderia.calle,
                numeroPuerta: lavanderia.numeroPuerta,
                numeroApartamento: lavanderia.numeroApartamento,
                ciudad: lavanderia.ciudad,
                departamento: lavanderia.departamento,
                codigoPostal: lavanderia.codigoPostal,
                serviciosOfrecidos: lavanderia.serviciosOfrecidos || []
            }
        });
    } catch (error) {
        console.error('Error al obtener perfil lavandería:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener el perfil',
            error: error.message
        });
    }
};

// Actualizar los servicios que ofrece la lavandería
const actualizarMisServicios = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden actualizar sus servicios'
            });
        }
        const { serviciosOfrecidos } = req.body;
        const servicios = Array.isArray(serviciosOfrecidos)
            ? serviciosOfrecidos.filter(s => typeof s === 'string' && s.trim()).map(s => s.trim())
            : [];
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        lavanderia.serviciosOfrecidos = servicios;
        await lavanderia.save();
        res.json({
            success: true,
            mensaje: 'Servicios actualizados correctamente',
            data: { serviciosOfrecidos: lavanderia.serviciosOfrecidos }
        });
    } catch (error) {
        console.error('Error al actualizar servicios lavandería:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar los servicios',
            error: error.message
        });
    }
};

// Actualizar la dirección del local de la lavandería (geocodifica y actualiza lat/lng)
const actualizarMiDireccion = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden actualizar su dirección'
            });
        }
        const d = req.body.direccion && typeof req.body.direccion === 'object' ? req.body.direccion : null;
        if (!d || !d.calle?.trim() || !d.numeroPuerta?.trim() || !d.ciudad?.trim() || !d.departamento || !d.codigoPostal?.trim()) {
            return res.status(400).json({
                success: false,
                mensaje: 'Completa todos los campos de la dirección (calle, n° puerta, ciudad, departamento, código postal)'
            });
        }
        const dirObj = {
            calle: (d.calle || '').trim(),
            numeroPuerta: (d.numeroPuerta || '').trim(),
            numeroApartamento: (d.numeroApartamento || '').trim(),
            ciudad: (d.ciudad || '').trim(),
            departamento: (d.departamento || '').trim(),
            codigoPostal: (d.codigoPostal || '').trim()
        };
        const coords = await geocodificarDireccion(dirObj);
        if (!coords || typeof coords.lat !== 'number' || typeof coords.lng !== 'number') {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pudo verificar la dirección. Revisa que los datos sean correctos.',
                codigo: 'DIRECCION_NO_GEOCOCODIFICADA'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        lavanderia.calle = dirObj.calle;
        lavanderia.numeroPuerta = dirObj.numeroPuerta;
        lavanderia.numeroApartamento = dirObj.numeroApartamento || '';
        lavanderia.ciudad = dirObj.ciudad;
        lavanderia.departamento = dirObj.departamento;
        lavanderia.codigoPostal = dirObj.codigoPostal;
        lavanderia.lat = coords.lat;
        lavanderia.lng = coords.lng;
        await lavanderia.save();
        res.json({
            success: true,
            mensaje: 'Dirección actualizada correctamente',
            data: {
                calle: lavanderia.calle,
                numeroPuerta: lavanderia.numeroPuerta,
                numeroApartamento: lavanderia.numeroApartamento,
                ciudad: lavanderia.ciudad,
                departamento: lavanderia.departamento,
                codigoPostal: lavanderia.codigoPostal
            }
        });
    } catch (error) {
        console.error('Error al actualizar dirección lavandería:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar la dirección',
            error: error.message
        });
    }
};

module.exports = {
    getMiPerfil,
    actualizarMisServicios,
    actualizarMiDireccion
};
