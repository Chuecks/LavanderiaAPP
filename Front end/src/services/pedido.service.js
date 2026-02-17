import API_BASE_URL, { apiRequest } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Obtener token de autenticación
const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

// Obtener todos los pedidos del usuario
export const obtenerPedidos = async (estado = null) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const endpoint = estado ? `/pedidos?estado=${estado}` : '/pedidos';
    const response = await apiRequest(endpoint, 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al obtener pedidos:', error);
    throw error;
  }
};

// Obtener un pedido por ID
export const obtenerPedido = async (id) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest(`/pedidos/${id}`, 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al obtener pedido:', error);
    throw error;
  }
};

// Crear un nuevo pedido
export const crearPedido = async (pedidoData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest('/pedidos', 'POST', pedidoData, token);
    return response.data;
  } catch (error) {
    console.error('Error al crear pedido:', error);
    throw error;
  }
};

// Actualizar el estado de un pedido
export const actualizarEstadoPedido = async (id, estado) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest(`/pedidos/${id}/estado`, 'PUT', { estado }, token);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar estado del pedido:', error);
    throw error;
  }
};

// Obtener estadísticas de pedidos
export const obtenerEstadisticas = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest('/pedidos/estadisticas', 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    throw error;
  }
};

// ----- Lavandería: pedidos asignados a esta lavandería -----

export const listarPedidosLavanderia = async (estado = null) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const endpoint = estado ? `/pedidos/lavanderia?estado=${estado}` : '/pedidos/lavanderia';
    const response = await apiRequest(endpoint, 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al listar pedidos lavandería:', error);
    throw error;
  }
};

export const aceptarPedidoLavanderia = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/aceptar`, 'PUT', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al aceptar pedido:', error);
    throw error;
  }
};

export const rechazarPedidoLavanderia = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/rechazar`, 'PUT', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al rechazar pedido:', error);
    throw error;
  }
};

export const cancelarPedidoLavanderia = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/cancelar`, 'PUT', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al cancelar pedido:', error);
    throw error;
  }
};

export const pasarAEnProcesoLavanderia = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/en-proceso`, 'PUT', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al pasar pedido a en proceso:', error);
    throw error;
  }
};

export const pasarACompletadoLavanderia = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/completar`, 'PUT', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al completar pedido:', error);
    throw error;
  }
};

// Usuario: reasignar pedido rechazado por lavandería a la siguiente más cercana
export const reasignarPedidoRechazado = async (id) => {
  try {
    const token = await getToken();
    if (!token) throw new Error('No hay token de autenticación');
    const response = await apiRequest(`/pedidos/${id}/reasignar-lavanderia`, 'PUT', null, token);
    return response;
  } catch (error) {
    console.error('Error al reasignar pedido:', error);
    throw error;
  }
};
