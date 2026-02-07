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

// Cerrar sesión (logout)
export const cerrarSesion = async () => {
  try {
    const token = await getToken();
    if (!token) {
      // Si no hay token, simplemente retornar éxito (ya está cerrada la sesión)
      return { success: true, mensaje: 'Sesión ya cerrada' };
    }

    // Llamar al endpoint de logout en el backend
    const response = await apiRequest('/auth/logout', 'POST', null, token);
    return response;
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    // Aún si falla el backend, retornar éxito para que el frontend pueda limpiar
    throw error;
  }
};

// Verificar token
export const verificarToken = async () => {
  try {
    const token = await getToken();
    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const response = await apiRequest('/auth/verificar', 'GET', null, token);
    return response;
  } catch (error) {
    console.error('Error al verificar token:', error);
    throw error;
  }
};
