import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../config/api';

const getToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    console.error('Error al obtener token:', error);
    return null;
  }
};

/** Obtener perfil de la lavandería (serviciosOfrecidos, etc.) */
export const getMiPerfilLavanderia = async () => {
  const token = await getToken();
  if (!token) throw new Error('No hay token de autenticación');
  const response = await apiRequest('/lavanderia/perfil', 'GET', null, token);
  return response.data;
};

/** Actualizar servicios que ofrece la lavandería */
export const actualizarServiciosLavanderia = async (serviciosOfrecidos) => {
  const token = await getToken();
  if (!token) throw new Error('No hay token de autenticación');
  const response = await apiRequest('/lavanderia/servicios', 'PUT', { serviciosOfrecidos }, token);
  return response.data;
};

/** Actualizar dirección del local de la lavandería */
export const actualizarDireccionLavanderia = async (direccion) => {
  const token = await getToken();
  if (!token) throw new Error('No hay token de autenticación');
  const response = await apiRequest('/lavanderia/direccion', 'PUT', { direccion }, token);
  return response.data;
};
