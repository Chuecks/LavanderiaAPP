import { apiRequest } from '../config/api';

/**
 * Obtiene el listado de servicios (público, sin token).
 * Usado en registro de lavandería y para consistencia con pedidos.
 */
export const getServicios = async () => {
  const response = await apiRequest('/servicios', 'GET', null, null);
  return response.data && Array.isArray(response.data) ? response.data : [];
};
