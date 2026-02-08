const Pedido = require('../models/pedido.model');
const { publicarPedido } = require('../services/queue.service');
const { enviarEmailPedido } = require('../services/email.service');
const { geocodificarDireccion } = require('../services/geocoding.service');
const { getClosestWithinKm, toPedidoEmbed, distanciaKm } = require('../services/lavanderia.service');
const RADIO_KM = 5;
const MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA = 3;

/**
 * Parsea horario en formato "Lunes, 3 de Febrero, 08:00" (día, fecha, hora) a Date.
 * Usa año actual; si la fecha resultante ya pasó, usa año siguiente.
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
        if (estado && ['pendiente', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
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

// Crear un nuevo pedido (solo si la dirección de recogida está a ≤5 km de alguna lavandería)
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

        // Geocodificar dirección de recogida
        const coordsRecogida = await geocodificarDireccion(direccionRecogida);
        if (!coordsRecogida) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se pudo verificar la dirección de recogida. Revisa que la dirección sea correcta.',
                codigo: 'DIRECCION_NO_GEOCOCODIFICADA'
            });
        }

        // Buscar lavandería más cercana dentro de RADIO_KM (recogida)
        const resultado = await getClosestWithinKm(coordsRecogida.lat, coordsRecogida.lng, RADIO_KM);
        if (!resultado) {
            return res.status(400).json({
                success: false,
                mensaje: 'No hay ninguna lavandería a menos de 5 km de tu dirección de recogida. No podemos tomar tu pedido en esta zona.',
                codigo: 'NO_LAVANDERIA_CERCANA'
            });
        }

        const lavanderia = resultado.lavanderia;

        // Geocodificar dirección de entrega y validar que esté a ≤5 km de la lavandería asignada
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
            estado: 'pendiente'
        });

        await pedido.save();

        // Enviar email a lavaderojmm (misma cuenta que "olvidé contraseña"): siempre directo para que llegue seguro
        const pedidoParaEmail = {
            _id: pedido._id,
            id: pedido._id.toString(),
            estado: pedido.estado,
            createdAt: pedido.createdAt,
            servicio: pedido.servicio,
            direccionRecogida: pedido.direccionRecogida,
            direccionEntrega: pedido.direccionEntrega,
            horarioRecogida: pedido.horarioRecogida,
            horarioEntrega: pedido.horarioEntrega,
            notas: pedido.notas,
            lavanderia: pedido.lavanderia,
            usuario: {
                nombre: req.usuario.nombre,
                email: req.usuario.email,
                telefono: req.usuario.telefono
            }
        };
        try {
            await enviarEmailPedido(pedidoParaEmail);
            console.log('✅ Email de nuevo pedido enviado a', process.env.EMAIL_DESTINO || process.env.EMAIL_USER);
        } catch (emailError) {
            console.error('❌ Error al enviar email de pedido:', emailError.message);
            if (emailError.response) console.error('   Detalle:', emailError.response);
        }

        // Opcional: publicar también a RabbitMQ por si hay consumidor (no bloquea)
        try {
            await publicarPedido({ _id: pedido._id, id: pedido._id.toString() });
        } catch (_) {}

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

        if (!['pendiente', 'en_proceso', 'completado', 'cancelado'].includes(estado)) {
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

// Obtener estadísticas de pedidos del usuario
const obtenerEstadisticas = async (req, res) => {
    try {
        const usuarioId = req.usuario._id;

        const [total, pendientes, enProceso, completados] = await Promise.all([
            Pedido.countDocuments({ usuario: usuarioId }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'pendiente' }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'en_proceso' }),
            Pedido.countDocuments({ usuario: usuarioId, estado: 'completado' })
        ]);

        res.json({
            success: true,
            data: {
                total,
                pendientes,
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

module.exports = {
    obtenerPedidos,
    obtenerPedido,
    crearPedido,
    actualizarEstadoPedido,
    obtenerEstadisticas
};
