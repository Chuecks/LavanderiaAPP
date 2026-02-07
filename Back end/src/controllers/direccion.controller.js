const Direccion = require('../models/direccion.model');

// Obtener todas las direcciones del usuario autenticado
const obtenerDirecciones = async (req, res) => {
    try {
        const direcciones = await Direccion.find({ 
            usuario: req.usuario._id,
            activa: true 
        }).sort({ createdAt: -1 });

        res.json({
            success: true,
            data: direcciones
        });
    } catch (error) {
        console.error('Error al obtener direcciones:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener direcciones',
            error: error.message
        });
    }
};

// Obtener una dirección por ID
const obtenerDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!direccion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Dirección no encontrada'
            });
        }

        res.json({
            success: true,
            data: direccion
        });
    } catch (error) {
        console.error('Error al obtener dirección:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener dirección',
            error: error.message
        });
    }
};

// Crear una nueva dirección
const crearDireccion = async (req, res) => {
    try {
        const { nombre, calle, numeroPuerta, numeroApartamento, ciudad, departamento, codigoPostal } = req.body;

        // Validar campos requeridos
        if (!nombre || !calle || !numeroPuerta || !ciudad || !departamento || !codigoPostal) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos requeridos deben ser completados'
            });
        }

        const direccion = new Direccion({
            usuario: req.usuario._id,
            nombre,
            calle,
            numeroPuerta,
            numeroApartamento: numeroApartamento || '',
            ciudad,
            departamento,
            codigoPostal
        });

        await direccion.save();

        res.status(201).json({
            success: true,
            mensaje: 'Dirección creada exitosamente',
            data: direccion
        });
    } catch (error) {
        console.error('Error al crear dirección:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear dirección',
            error: error.message
        });
    }
};

// Actualizar una dirección
const actualizarDireccion = async (req, res) => {
    try {
        const { nombre, calle, numeroPuerta, numeroApartamento, ciudad, departamento, codigoPostal } = req.body;

        const direccion = await Direccion.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!direccion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Dirección no encontrada'
            });
        }

        // Actualizar campos
        if (nombre) direccion.nombre = nombre;
        if (calle) direccion.calle = calle;
        if (numeroPuerta) direccion.numeroPuerta = numeroPuerta;
        if (numeroApartamento !== undefined) direccion.numeroApartamento = numeroApartamento;
        if (ciudad) direccion.ciudad = ciudad;
        if (departamento) direccion.departamento = departamento;
        if (codigoPostal) direccion.codigoPostal = codigoPostal;

        await direccion.save();

        res.json({
            success: true,
            mensaje: 'Dirección actualizada exitosamente',
            data: direccion
        });
    } catch (error) {
        console.error('Error al actualizar dirección:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar dirección',
            error: error.message
        });
    }
};

// Eliminar una dirección (soft delete)
const eliminarDireccion = async (req, res) => {
    try {
        const direccion = await Direccion.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!direccion) {
            return res.status(404).json({
                success: false,
                mensaje: 'Dirección no encontrada'
            });
        }

        direccion.activa = false;
        await direccion.save();

        res.json({
            success: true,
            mensaje: 'Dirección eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar dirección:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al eliminar dirección',
            error: error.message
        });
    }
};

module.exports = {
    obtenerDirecciones,
    obtenerDireccion,
    crearDireccion,
    actualizarDireccion,
    eliminarDireccion
};
