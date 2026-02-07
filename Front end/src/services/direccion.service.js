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

// Obtener todas las direcciones del usuario
export const obtenerDirecciones = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest('/direcciones', 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al obtener direcciones:', error);
    throw error;
  }
};

// Obtener una dirección por ID
export const obtenerDireccion = async (id) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest(`/direcciones/${id}`, 'GET', null, token);
    return response.data;
  } catch (error) {
    console.error('Error al obtener dirección:', error);
    throw error;
  }
};

// Crear una nueva dirección
export const crearDireccion = async (direccionData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest('/direcciones', 'POST', direccionData, token);
    return response.data;
  } catch (error) {
    console.error('Error al crear dirección:', error);
    throw error;
  }
};

// Actualizar una dirección
export const actualizarDireccion = async (id, direccionData) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest(`/direcciones/${id}`, 'PUT', direccionData, token);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar dirección:', error);
    throw error;
  }
};

// Eliminar una dirección
export const eliminarDireccion = async (id) => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest(`/direcciones/${id}`, 'DELETE', null, token);
    return response;
  } catch (error) {
    console.error('Error al eliminar dirección:', error);
    throw error;
  }
};
