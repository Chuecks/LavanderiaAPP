const mongoose = require('mongoose');

const lavanderiaSchema = new mongoose.Schema({
    nombre: { type: String, required: true, trim: true },
    barrio: { type: String, trim: true },
    calle: { type: String, required: true, trim: true },
    numeroPuerta: { type: String, trim: true, default: '' },
    numeroApartamento: { type: String, trim: true, default: '' },
    ciudad: { type: String, required: true, trim: true },
    departamento: { type: String, required: true, trim: true },
    codigoPostal: { type: String, trim: true, default: '' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
}, { _id: true });

lavanderiaSchema.index({ lat: 1, lng: 1 });

const Lavanderia = mongoose.model('Lavanderia', lavanderiaSchema);
module.exports = Lavanderia;
