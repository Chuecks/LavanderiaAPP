const Pedido = require('../models/pedido.model');
const Lavanderia = require('../models/lavanderia.model');
const Usuario = require('../models/usuario.model');
const { enviarEmailPedido } = require('../services/email.service');
const { geocodificarDireccion } = require('../services/geocoding.service');
const { getClosestWithinKm, getClosestWithinKmExcluding, getClosestWithinKmExcludingIds, toPedidoEmbed, distanciaKm } = require('../services/lavanderia.service');
const RADIO_KM = 5;
const MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA = 3;

/**
 * Parsea horario en formato "Lunes, 3 de Febrero, 08:00" (d├¡a, fecha, hora) a Date.
 * Usa a├▒o actual; si la fecha resultante ya pas├│, usa a├▒o siguiente.
 */
function parsearHorario(horarioStr) {
    if (!horarioStr || typeof horarioStr !== 'string') return null;
    const partes = horarioStr.split(', ').map(p => p.trim());
    if (partes.length < 3) return null;
    const tiempo = partes[partes.length - 1]; // "08:00"
    const fechaParte = partes[partes.length - 2]; // "3 de Febrero"
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const matchFecha = fechaParte.match(/^(\d{1,2})\s+de\s+(.+)$/i);
    if (!matchFecha) return null;
    const dia = parseInt(matchFecha[1], 10);
    const mesStr = matchFecha[2].toLowerCase();
    const mes = meses.findIndex(m => mesStr.startsWith(m));
    if (mes < 0 || dia < 1 || dia > 31) return null;
    const matchHora = tiempo.match(/^(\d{1,2}):(\d{2})$/);
    const hora = matchHora ? parseInt(matchHora[1], 10) : 0;
    const min = matchHora ? parseInt(matchHora[2], 10) : 0;
    const year = new Date().getFullYear();
    let d = new Date(year, mes, dia, hora, min, 0, 0);
    if (d.getTime() < Date.now()) d = new Date(year + 1, mes, dia, hora, min, 0, 0);
    return d;
}

const UNA_HORA_MS = 60 * 60 * 1000;

/**
 * Valida que recogida sea al menos 1 h desde ahora; que entrega sea al menos 1 h desde ahora;
 * que recogida sea antes que entrega y que haya al menos MIN_HORAS entre ambas.
 */
function validarHorarios(horarioRecogida, horarioEntrega) {
    const recogida = parsearHorario(horarioRecogida);
    const entrega = parsearHorario(horarioEntrega);
    if (!recogida || !entrega) return { ok: false, mensaje: 'No se pudieron interpretar los horarios. Revisa el formato.' };
    const ahora = new Date();
    if (recogida.getTime() < ahora.getTime() + UNA_HORA_MS) {
        return { ok: false, mensaje: 'El horario de recogida debe ser al menos 1 hora después de ahora.' };
    }
    if (entrega.getTime() < ahora.getTime() + UNA_HORA_MS) {
        return { ok: false, mensaje: 'El horario de entrega debe ser al menos 1 hora después de ahora.' };
    }
    if (recogida.getTime() >= entrega.getTime()) {
        return { ok: false, mensaje: 'El horario de entrega debe ser posterior al de recogida.' };
    }
    const diffMs = entrega.getTime() - recogida.getTime();
    const diffHoras = diffMs / (1000 * 60 * 60);
    if (diffHoras < MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA) {
        return { ok: false, mensaje: `Debe haber al menos ${MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA} horas entre la recogida y la entrega para poder lavar la ropa.` };
    }
    return { ok: true };
}

// Obtener todos los pedidos del usuario autenticado
const obtenerPedidos = async (req, res) => {
    try {
        const { estado } = req.query;
        
        const filtro = { usuario: req.usuario._id };
        if (estado && ['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
            filtro.estado = estado;
        }

        const pedidos = await Pedido.find(filtro)
            .sort({ createdAt: -1 })
            .populate('usuario', 'nombre email telefono');

        res.json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        console.error('Error al obtener pedidos:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener pedidos',
            error: error.message
        });
    }
};

// Obtener un pedido por ID
const obtenerPedido = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        }).populate('usuario', 'nombre email telefono');

        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }

        res.json({
            success: true,
            data: pedido
        });
    } catch (error) {
        console.error('Error al obtener pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener pedido',
            error: error.message
        });
    }
};

// Crear un nuevo pedido (solo si la direcci├│n de recogida est├í a Γëñ5 km de alguna lavander├¡a)
const crearPedido = async (req, res) => {
    try {
        const {
            servicio,
            direccionRecogida,
            direccionEntrega,
            horarioRecogida,
            horarioEntrega,
            notas
        } = req.body;

        // Validar campos requeridos
        if (!servicio || !direccionRecogida || !direccionEntrega || !horarioRecogida || !horarioEntrega) {
            return res.status(400).json({
                success: false,
                mensaje: 'Todos los campos requeridos deben ser completados'
            });
        }

        // Validar horarios: recogida antes que entrega y al menos 3 h entre ambos
        const validacionHorarios = validarHorarios(horarioRecogida, horarioEntrega);
        if (!validacionHorarios.ok) {
            return res.status(400).json({
                success: false,
                mensaje: validacionHorarios.mensaje,
                codigo: 'HORARIOS_INVALIDOS'
            });
        }

        // Geocodificar direcci├│n de recogida
        const coordsRecogida = await geocodificarDireccion(direccionRecogida);
        if (!coordsRecogida) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pudo verificar la dirección de recogida. Revisa que la dirección sea correcta.',
                codigo: 'DIRECCION_NO_GEOCOCODIFICADA'
            });
        }

        // Buscar lavandería más cercana dentro de RADIO_KM que ofrezca el servicio solicitado
        const nombreServicio = servicio && typeof servicio.nombre === 'string' ? servicio.nombre.trim() : null;
        const resultado = await getClosestWithinKm(coordsRecogida.lat, coordsRecogida.lng, RADIO_KM, nombreServicio);
        if (!resultado) {
            return res.status(400).json({
                success: false,
                mensaje: nombreServicio
                    ? 'No hay lavanderías a menos de 5 km que ofrezcan el servicio solicitado.'
                    : 'No hay ninguna lavandería a menos de 5 km de tu dirección de recogida. No podemos tomar tu pedido en esta zona.',
                codigo: 'NO_LAVANDERIA_CERCANA'
            });
        }

        const lavanderia = resultado.lavanderia;

        // Geocodificar direcci├│n de entrega y validar que est├⌐ a Γëñ5 km de la lavander├¡a asignada
        const coordsEntrega = await geocodificarDireccion(direccionEntrega);
        if (!coordsEntrega) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pudo verificar la dirección de entrega. Revisa que la dirección sea correcta.',
                codigo: 'DIRECCION_ENTREGA_NO_GEOCOCODIFICADA'
            });
        }
        const distEntregaLavanderia = distanciaKm(coordsEntrega.lat, coordsEntrega.lng, lavanderia.lat, lavanderia.lng);
        if (distEntregaLavanderia > RADIO_KM) {
            return res.status(400).json({
                success: false,
                mensaje: `La dirección de entrega está a más de 5 km de la lavandería asignada (${lavanderia.nombre}). No podemos entregar en esa zona.`,
                codigo: 'ENTREGA_FUERA_DE_RANGO'
            });
        }

        const lavanderiaEmbed = toPedidoEmbed(lavanderia);

        const pedido = new Pedido({
            usuario: req.usuario._id,
            servicio: {
                nombre: servicio.nombre,
                precio: servicio.precio,
                descripcion: servicio.descripcion || ''
            },
            direccionRecogida: {
                calle: direccionRecogida.calle,
                numeroPuerta: direccionRecogida.numeroPuerta,
                numeroApartamento: direccionRecogida.numeroApartamento || '',
                ciudad: direccionRecogida.ciudad,
                departamento: direccionRecogida.departamento,
                codigoPostal: direccionRecogida.codigoPostal
            },
            direccionEntrega: {
                calle: direccionEntrega.calle,
                numeroPuerta: direccionEntrega.numeroPuerta,
                numeroApartamento: direccionEntrega.numeroApartamento || '',
                ciudad: direccionEntrega.ciudad,
                departamento: direccionEntrega.departamento,
                codigoPostal: direccionEntrega.codigoPostal
            },
            horarioRecogida,
            horarioEntrega,
            notas: notas || '',
            lavanderia: lavanderiaEmbed,
            lavanderiaId: lavanderia._id,
            estado: 'pendiente'
        });

        await pedido.save();

        // Objeto plano para el email (evita problemas con subdocumentos Mongoose)
        const pedidoPlano = pedido.toObject ? pedido.toObject() : JSON.parse(JSON.stringify(pedido));
        pedidoPlano.id = (pedidoPlano._id && pedidoPlano._id.toString) ? pedidoPlano._id.toString() : String(pedidoPlano._id);
        pedidoPlano.usuario = {
            nombre: req.usuario.nombre,
            email: req.usuario.email,
            telefono: req.usuario.telefono
        };

        // Enviar email a la lavandería asignada (solicitud de pedido)
        try {
            const lavanderiaDoc = await Lavanderia.findById(lavanderia._id);
            let emailLavanderia = null;
            if (lavanderiaDoc && lavanderiaDoc.usuarioId) {
                const usuarioLavanderia = await Usuario.findById(lavanderiaDoc.usuarioId).select('email').lean();
                if (usuarioLavanderia && usuarioLavanderia.email) emailLavanderia = usuarioLavanderia.email;
            }
            console.log('Enviando solicitud de pedido a lavandería:', emailLavanderia || process.env.EMAIL_DESTINO || process.env.EMAIL_USER);
            await enviarEmailPedido(pedidoPlano, emailLavanderia);
            console.log('Email de solicitud de pedido enviado OK');
        } catch (emailError) {
            console.error('Error al enviar email de pedido:', emailError.message);
            if (emailError.stack) console.error(emailError.stack);
        }

        res.status(201).json({
            success: true,
            mensaje: 'Pedido creado exitosamente',
            data: pedido
        });
    } catch (error) {
        console.error('Error al crear pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al crear pedido',
            error: error.message
        });
    }
};

// Actualizar el estado de un pedido
const actualizarEstadoPedido = async (req, res) => {
    try {
        const { estado } = req.body;

        if (!['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
            return res.status(400).json({
                success: false,
                mensaje: 'Estado inválido'
            });
        }

        const pedido = await Pedido.findOne({
            _id: req.params.id,
            usuario: req.usuario._id
        });

        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }

        pedido.estado = estado;
        if (estado === 'completado') {
            pedido.fechaCompletado = new Date();
        }

        await pedido.save();

        res.json({
            success: true,
            mensaje: 'Estado del pedido actualizado exitosamente',
            data: pedido
        });
    } catch (error) {
        console.error('Error al actualizar estado del pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar estado del pedido',
            error: error.message
        });
    }
};

// Obtener estad├¡sticas de pedidos del usuario
const obtenerEstadisticas = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const [total, pendientes, confirmados, enProceso, completados] = await Promise.all([
            Pedido.countDocuments({ usuario: usuarioId }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'pendiente' }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'confirmado' }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'en_proceso' }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'completado' })
        ]);

        res.json({
            success: true,
            data: {
                total,
                pendientes,
                confirmados,
                enProceso,
                completados
            }
        });
    } catch (error) {
        console.error('Error al obtener estadísticas:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al obtener estadísticas',
            error: error.message
        });
    }
};

// ----- Lavandería: pedidos asignados a esta lavandería -----

// Listar pedidos de la lavandería (solo usuario con rol lavanderia)
const listarPedidosLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden ver sus pedidos'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const { estado } = req.query;
        const filtro = { lavanderiaId: lavanderia._id };
        if (estado && ['pendiente', 'confirmado', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
            filtro.estado = estado;
        }
        const pedidos = await Pedido.find(filtro)
            .sort({ createdAt: -1 })
            .populate('usuario', 'nombre email telefono');
        res.json({
            success: true,
            data: pedidos
        });
    } catch (error) {
        console.error('Error al listar pedidos de lavandería:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al listar pedidos',
            error: error.message
        });
    }
};

// Aceptar pedido (lavandería): pasa de pendiente a confirmado
const aceptarPedidoLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden aceptar pedidos'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            lavanderiaId: lavanderia._id
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado o no asignado a esta lavandería'
            });
        }
        if (pedido.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se pueden aceptar pedidos en estado pendiente'
            });
        }
        pedido.estado = 'confirmado';
        await pedido.save();
        res.json({
            success: true,
            mensaje: 'Pedido aceptado. El cliente lo verá como confirmado.',
            data: pedido
        });
    } catch (error) {
        console.error('Error al aceptar pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al aceptar pedido',
            error: error.message
        });
    }
};

// Rechazar pedido (lavandería): pasa a cancelado
const rechazarPedidoLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden rechazar pedidos'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            lavanderiaId: lavanderia._id
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado o no asignado a esta lavandería'
            });
        }
        if (pedido.estado !== 'pendiente') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se pueden rechazar pedidos en estado pendiente'
            });
        }
        pedido.estado = 'cancelado';
        pedido.rechazadoPorLavanderia = true;
        if (!pedido.rechazadoPorLavanderias) pedido.rechazadoPorLavanderias = [];
        const idStr = lavanderia._id.toString();
        if (!pedido.rechazadoPorLavanderias.some(id => id.toString() === idStr)) {
            pedido.rechazadoPorLavanderias.push(lavanderia._id);
        }
        await pedido.save();
        res.json({
            success: true,
            mensaje: 'Pedido rechazado',
            data: pedido
        });
    } catch (error) {
        console.error('Error al rechazar pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al rechazar pedido',
            error: error.message
        });
    }
};

// Cancelar pedido (lavandería): confirmado o en_proceso -> cancelado; el usuario ve aviso como con rechazo
const cancelarPedidoLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden cancelar pedidos'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            lavanderiaId: lavanderia._id
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado o no asignado a esta lavandería'
            });
        }
        if (pedido.estado !== 'confirmado' && pedido.estado !== 'en_proceso') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se pueden cancelar pedidos confirmados o en proceso'
            });
        }
        pedido.estado = 'cancelado';
        pedido.rechazadoPorLavanderia = true;
        if (!pedido.rechazadoPorLavanderias) pedido.rechazadoPorLavanderias = [];
        const idStr = lavanderia._id.toString();
        if (!pedido.rechazadoPorLavanderias.some(id => id.toString() === idStr)) {
            pedido.rechazadoPorLavanderias.push(lavanderia._id);
        }
        await pedido.save();
        res.json({
            success: true,
            mensaje: 'Pedido cancelado',
            data: pedido
        });
    } catch (error) {
        console.error('Error al cancelar pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al cancelar pedido',
            error: error.message
        });
    }
};

// Pasar pedido a "en proceso" (lavandería): confirmado -> en_proceso
const pasarAEnProcesoLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden usar esta acción'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            lavanderiaId: lavanderia._id
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado o no asignado a esta lavandería'
            });
        }
        if (pedido.estado !== 'confirmado') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se puede pasar a en proceso un pedido confirmado'
            });
        }
        pedido.estado = 'en_proceso';
        await pedido.save();
        res.json({
            success: true,
            mensaje: 'Pedido en proceso. El cliente lo verá en "En proceso".',
            data: pedido
        });
    } catch (error) {
        console.error('Error al pasar pedido a en proceso:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el pedido',
            error: error.message
        });
    }
};

// Marcar pedido como completado (lavandería): en_proceso -> completado
const pasarACompletadoLavanderia = async (req, res) => {
    try {
        if (req.usuario.rol !== 'lavanderia') {
            return res.status(403).json({
                success: false,
                mensaje: 'Solo las lavanderías pueden usar esta acción'
            });
        }
        const lavanderia = await Lavanderia.findOne({ usuarioId: req.usuario._id });
        if (!lavanderia) {
            return res.status(404).json({
                success: false,
                mensaje: 'Lavandería no encontrada para este usuario'
            });
        }
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            lavanderiaId: lavanderia._id
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado o no asignado a esta lavandería'
            });
        }
        if (pedido.estado !== 'en_proceso') {
            return res.status(400).json({
                success: false,
                mensaje: 'Solo se puede completar un pedido que está en proceso'
            });
        }
        pedido.estado = 'completado';
        pedido.fechaCompletado = new Date();
        await pedido.save();
        res.json({
            success: true,
            mensaje: 'Pedido completado.',
            data: pedido
        });
    } catch (error) {
        console.error('Error al completar pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al actualizar el pedido',
            error: error.message
        });
    }
};

// Reasignar pedido rechazado por lavandería a la siguiente lavandería más cercana (usuario)
const reasignarPedidoRechazado = async (req, res) => {
    try {
        const pedido = await Pedido.findOne({
            _id: req.params.id,
            usuario: req.usuario._id,
            estado: 'cancelado'
        });
        if (!pedido) {
            return res.status(404).json({
                success: false,
                mensaje: 'Pedido no encontrado'
            });
        }
        if (!pedido.rechazadoPorLavanderia) {
            return res.status(400).json({
                success: false,
                mensaje: 'Este pedido no fue rechazado por una lavandería'
            });
        }
        const coordsRecogida = await geocodificarDireccion(pedido.direccionRecogida);
        if (!coordsRecogida) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pudo verificar la dirección de recogida.',
                codigo: 'DIRECCION_NO_GEOCOCODIFICADA'
            });
        }
        // Excluir todas las lavanderías que ya rechazaron este pedido (evita bucle entre las 2 más cercanas)
        const idsExcluir = [...(pedido.rechazadoPorLavanderias || [])];
        if (pedido.lavanderiaId && !idsExcluir.some(id => id.toString() === pedido.lavanderiaId.toString())) {
            idsExcluir.push(pedido.lavanderiaId);
        }
        const nombreServicio = pedido.servicio && typeof pedido.servicio.nombre === 'string' ? pedido.servicio.nombre.trim() : null;
        const resultado = await getClosestWithinKmExcludingIds(
            coordsRecogida.lat,
            coordsRecogida.lng,
            RADIO_KM,
            idsExcluir,
            nombreServicio
        );
        if (!resultado) {
            return res.status(400).json({
                success: false,
                mensaje: nombreServicio
                    ? 'No hay otra lavandería cercana que ofrezca el servicio de este pedido.'
                    : 'No se pudo realizar el pedido: no hay otra lavandería cercana disponible.',
                codigo: 'NO_OTRA_LAVANDERIA_CERCANA'
            });
        }
        const lavanderia = resultado.lavanderia;
        const lavanderiaEmbed = toPedidoEmbed(lavanderia);
        pedido.lavanderia = lavanderiaEmbed;
        pedido.lavanderiaId = lavanderia._id;
        pedido.estado = 'pendiente';
        pedido.rechazadoPorLavanderia = false;
        await pedido.save();

        // Enviar solicitud por email a la nueva lavandería (igual que al crear pedido)
        try {
            const pedidoPlano = pedido.toObject ? pedido.toObject() : JSON.parse(JSON.stringify(pedido));
            pedidoPlano.id = (pedidoPlano._id && pedidoPlano._id.toString) ? pedidoPlano._id.toString() : String(pedidoPlano._id);
            pedidoPlano.usuario = {
                nombre: req.usuario.nombre,
                email: req.usuario.email,
                telefono: req.usuario.telefono
            };
            let emailLavanderia = null;
            const lavanderiaDoc = await Lavanderia.findById(lavanderia._id);
            if (lavanderiaDoc && lavanderiaDoc.usuarioId) {
                const usuarioLavanderia = await Usuario.findById(lavanderiaDoc.usuarioId).select('email').lean();
                if (usuarioLavanderia && usuarioLavanderia.email) emailLavanderia = usuarioLavanderia.email;
            }
            console.log('Enviando solicitud de pedido reasignado a lavandería:', emailLavanderia || process.env.EMAIL_DESTINO || process.env.EMAIL_USER);
            await enviarEmailPedido(pedidoPlano, emailLavanderia);
            console.log('Email de solicitud de pedido reasignado enviado OK');
        } catch (emailError) {
            console.error('Error al enviar email de pedido reasignado:', emailError.message);
            if (emailError.stack) console.error(emailError.stack);
        }

        res.json({
            success: true,
            mensaje: 'Pedido reasignado a otra lavandería. Aparecerá como pendiente para que la acepten.',
            data: pedido
        });
    } catch (error) {
        console.error('Error al reasignar pedido:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error al reasignar el pedido',
            error: error.message
        });
    }
};

module.exports = {
    obtenerPedidos,
    obtenerPedido,
    crearPedido,
    actualizarEstadoPedido,
    obtenerEstadisticas,
    listarPedidosLavanderia,
    aceptarPedidoLavanderia,
    rechazarPedidoLavanderia,
    pasarAEnProcesoLavanderia,
    pasarACompletadoLavanderia,
    reasignarPedidoRechazado,
    cancelarPedidoLavanderia
};
