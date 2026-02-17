/**
 * Geocodificación de direcciones en Uruguay usando Nominatim (OpenStreetMap).
 * Prueba varias variantes del formato para que coincida con cómo se guardan las direcciones.
 */

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const REQUEST_DELAY_MS = 1100; // Nominatim pide max 1 req/s sin API key

const trim = (s) => (s && String(s).trim()) || '';

/**
 * Genera varias cadenas de búsqueda para una misma dirección (formato típico: calle, número, ciudad, departamento).
 * Nominatim a veces no encuentra "Calle X 1234, Montevideo" pero sí "Calle X, Montevideo, Uruguay".
 */
const construirVariantesQuery = (direccion) => {
    if (!direccion || !trim(direccion.calle)) return [];
    const calle = trim(direccion.calle);
    const numero = trim(direccion.numeroPuerta);
    const apto = trim(direccion.numeroApartamento);
    const ciudad = trim(direccion.ciudad);
    const depto = trim(direccion.departamento);

    const ciudadODepartamento = ciudad || depto || 'Montevideo';
    const baseUy = [ciudadODepartamento, 'Uruguay'].filter(Boolean).join(', ');

    const variantes = [];
    // 1) Calle número, ciudad, Uruguay (ej: Bulevar España 2460, Montevideo, Uruguay)
    if (numero) {
        variantes.push(`${calle} ${numero}, ${baseUy}`);
        variantes.push(`${calle}, ${numero}, ${baseUy}`);
    }
    // 2) Solo calle, ciudad, Uruguay (más tolerante)
    variantes.push(`${calle}, ${baseUy}`);
    // 3) Con departamento si es distinto
    if (depto && depto !== ciudadODepartamento) {
        variantes.push(`${calle}, ${ciudad}, ${depto}, Uruguay`);
    }
    // 4) Solo ciudad/departamento como fallback (centro de la zona)
    if (ciudadODepartamento) {
        variantes.push(`${ciudadODepartamento}, Uruguay`);
    }
    return [...new Set(variantes)];
};

/**
 * Llama a Nominatim con una query y devuelve { lat, lng } o null.
 */
const buscarUna = async (query) => {
    if (!query) return null;
    const params = new URLSearchParams({
        q: query,
        format: 'json',
        limit: 1,
        countrycodes: 'uy'
    });
    const url = `${NOMINATIM_URL}?${params.toString()}`;
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'LavaderoApp/1.0 (contact@lavadero.com)'
            },
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) return null;
        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) return null;
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
        return { lat, lng };
    } catch (err) {
        return null;
    }
};

/**
 * Geocodifica una dirección probando varias variantes del formato.
 * Acepta el objeto tal como viene del frontend (calle, numeroPuerta, numeroApartamento, ciudad, departamento, codigoPostal).
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
const geocodificarDireccion = async (direccion) => {
    const variantes = construirVariantesQuery(direccion);
    if (variantes.length === 0) return null;

    for (const query of variantes) {
        const result = await buscarUna(query);
        if (result) return result;
        await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));
    }
    return null;
};

const construirQuery = (direccion) => {
    const v = construirVariantesQuery(direccion);
    return v[0] || '';
};

/**
 * Geocodifica un texto libre de dirección (ej. "Bulevar España 2460, Montevideo").
 * Útil para registro de lavandería con un solo campo dirección.
 * @param {string} direccionTexto - Dirección en texto libre
 * @returns {Promise<{ lat: number, lng: number } | null>}
 */
const geocodificarTexto = async (direccionTexto) => {
    const t = trim(direccionTexto);
    if (!t) return null;
    const query = t.includes('Uruguay') ? t : `${t}, Uruguay`;
    return await buscarUna(query);
};

module.exports = {
    geocodificarDireccion,
    geocodificarTexto,
    construirQuery,
    REQUEST_DELAY_MS
};
