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
