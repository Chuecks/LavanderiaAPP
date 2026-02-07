const mongoose = require('mongoose');

const direccionSchema = new mongoose.Schema({
    usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'El usuario es obligatorio']
    },
    nombre: {
        type: String,
        required: [true, 'El nombre de la dirección es obligatorio'],
        trim: true
    },
    calle: {
        type: String,
        required: [true, 'La calle es obligatoria'],
        trim: true
    },
    numeroPuerta: {
        type: String,
        required: [true, 'El número de puerta es obligatorio'],
        trim: true
    },
    numeroApartamento: {
        type: String,
        trim: true,
        default: ''
    },
    ciudad: {
        type: String,
        required: [true, 'La ciudad es obligatoria'],
        trim: true
    },
    departamento: {
        type: String,
        required: [true, 'El departamento es obligatorio'],
        trim: true
    },
    codigoPostal: {
        type: String,
        required: [true, 'El código postal es obligatorio'],
        trim: true
    },
    activa: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Índice para búsquedas rápidas por usuario
direccionSchema.index({ usuario: 1 });

const Direccion = mongoose.model('Direccion', direccionSchema);

module.exports = Direccion;
