// Lista única de servicios (misma que usa el front para pedidos y para el combo de lavandería)
const LISTA_SERVICIOS = [
    { id: 1, nombre: 'Lavado Básico', precio: 5000, descripcion: 'Lavado y secado básico' },
    { id: 2, nombre: 'Planchado', precio: 3000, descripcion: 'Planchado de prendas' },
    { id: 3, nombre: 'Lavado Premium', precio: 8000, descripcion: 'Lavado, secado y planchado' },
    { id: 4, nombre: 'Limpieza en Seco', precio: 12000, descripcion: 'Limpieza especializada' },
];

const listarServicios = (req, res) => {
    res.json({
        success: true,
        data: LISTA_SERVICIOS,
    });
};

module.exports = {
    listarServicios,
    LISTA_SERVICIOS,
};
