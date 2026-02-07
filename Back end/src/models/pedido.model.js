const mongoose = require('mongoose');

const pedidoSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    servicio: {
        nombre: {
            type: String,
            required: [true, 'El nombre del servicio es obligatorio'],
            trim: true
        },
        precio: {
            type: Number,
            required: [true, 'El precio del servicio es obligatorio'],
            min: [0, 'El precio no puede ser negativo']
        },
        descripcion: {
            type: String,
            trim: true
        }
    },
    direccionRecogida: {
        calle: {
            type: String,
            required: [true, 'La calle de recogida es obligatoria'],
            trim: true
        },
        numeroPuerta: {
            type: String,
            required: [true, 'El número de puerta de recogida es obligatorio'],
            trim: true
        },
        numeroApartamento: {
            type: String,
            trim: true,
            default: ''
        },
        ciudad: {
            type: String,
            required: [true, 'La ciudad de recogida es obligatoria'],
            trim: true
        },
        departamento: {
            type: String,
            required: [true, 'El departamento de recogida es obligatorio'],
            trim: true
        },
        codigoPostal: {
            type: String,
            required: [true, 'El código postal de recogida es obligatorio'],
            trim: true
        }
    },
    direccionEntrega: {
        calle: {
            type: String,
            required: [true, 'La calle de entrega es obligatoria'],
            trim: true
        },
        numeroPuerta: {
            type: String,
            required: [true, 'El número de puerta de entrega es obligatorio'],
            trim: true
        },
        numeroApartamento: {
            type: String,
            trim: true,
            default: ''
        },
        ciudad: {
            type: String,
            required: [true, 'La ciudad de entrega es obligatoria'],
            trim: true
        },
        departamento: {
            type: String,
            required: [true, 'El departamento de entrega es obligatorio'],
            trim: true
        },
        codigoPostal: {
            type: String,
            required: [true, 'El código postal de entrega es obligatorio'],
            trim: true
        }
    },
    horarioRecogida: {
        type: String,
        required: [true, 'El horario de recogida es obligatorio'],
        trim: true
    },
    horarioEntrega: {
        type: String,
        required: [true, 'El horario de entrega es obligatorio'],
        trim: true
    },
    notas: {
        type: String,
        trim: true,
        default: ''
    },
    lavanderia: {
        nombre: { type: String, trim: true },
        barrio: { type: String, trim: true },
        calle: { type: String, trim: true },
        numeroPuerta: { type: String, trim: true },
        numeroApartamento: { type: String, trim: true, default: '' },
        ciudad: { type: String, trim: true },
        departamento: { type: String, trim: true },
        codigoPostal: { type: String, trim: true, default: '' }
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en_proceso', 'completado', 'cancelado'],
        default: 'pendiente'
    },
    fechaCompletado: {
        type: Date
    }
}, {
    timestamps: true
});

// Índices para búsquedas rápidas
pedidoSchema.index({ usuario: 1 });
pedidoSchema.index({ estado: 1 });
pedidoSchema.index({ usuario: 1, estado: 1 });

const Pedido = mongoose.model('Pedido', pedidoSchema);

module.exports = Pedido;
