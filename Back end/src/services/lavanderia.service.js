const Lavanderia = require('../models/lavanderia.model');

/** Radio de la Tierra en km (Haversine) */
const R_KM = 6371;

/**
 * Distancia en km entre dos puntos (fórmula de Haversine).
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 * @returns {number}
 */
const distanciaKm = (lat1, lng1, lat2, lng2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R_KM * c;
};

/**
 * Obtiene todas las lavanderías con coordenadas.
 * @returns {Promise<Array>}
 */
const getLavanderias = async () => {
    const list = await Lavanderia.find({}).lean();
    return list;
};

/**
 * Encuentra la lavandería más cercana dentro de maxKm (o null si ninguna está dentro).
 * Si hay varias dentro del radio, devuelve la más cercana.
 * @param {number} lat - Latitud de la dirección de recogida
 * @param {number} lng - Longitud de la dirección de recogida
 * @param {number} maxKm - Radio máximo en km (default 5)
 * @returns {Promise<{ lavanderia: Object, distanciaKm: number } | null>}
 */
const getClosestWithinKm = async (lat, lng, maxKm = 5) => {
    const lavanderias = await getLavanderias();
    if (!lavanderias.length) return null;

    let closest = null;
    let minDist = maxKm + 1;

    for (const lav of lavanderias) {
        if (lav.lat == null || lav.lng == null) continue;
        const d = distanciaKm(lat, lng, lav.lat, lav.lng);
        if (d <= maxKm && d < minDist) {
            minDist = d;
            closest = lav;
        }
    }

    if (!closest) return null;
    return { lavanderia: closest, distanciaKm: minDist };
};

/**
 * Formatea lavanderia para guardar embebida en pedido (solo datos de negocio, sin _id de Mongo si se quiere).
 * @param {Object} lav - Documento lavanderia
 * @returns {Object}
 */
const toPedidoEmbed = (lav) => {
    if (!lav) return null;
    return {
        nombre: lav.nombre,
        barrio: lav.barrio || '',
        calle: lav.calle,
        numeroPuerta: lav.numeroPuerta,
        numeroApartamento: lav.numeroApartamento || '',
        ciudad: lav.ciudad,
        departamento: lav.departamento,
        codigoPostal: lav.codigoPostal || ''
    };
};

module.exports = {
    getLavanderias,
    getClosestWithinKm,
    distanciaKm,
    toPedidoEmbed
};
