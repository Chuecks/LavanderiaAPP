// Configuración de la API
// Desarrollo: IP de la máquina donde CORRE EL BACKEND (puede ser esta PC o otra en la misma red).
// Producción (build Play Store): URL de la VM/servidor público.
const IP_BACKEND = '34.176.229.57';  // ← VM Google Cloud (IP estática externa)
const PRODUCTION_API_URL = 'http://34.176.229.57:4000/api';  // ← Producción: build Play Store

import { Platform } from 'react-native';

let API_BASE_URL;

if (__DEV__) {
  if (Platform.OS === 'web') {
    API_BASE_URL = 'http://localhost:4000/api';
  } else if (Platform.OS === 'ios') {
    API_BASE_URL = `http://${IP_BACKEND}:4000/api`;
  } else {
    API_BASE_URL = `http://${IP_BACKEND}:4000/api`;
  }
} else {
  // APK / producción: siempre esta URL (misma que Expo Go en dispositivo)
  API_BASE_URL = PRODUCTION_API_URL;
}

export default API_BASE_URL;

// Función helper para hacer peticiones
export const apiRequest = async (endpoint, method = 'GET', body = null, token = null) => {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    // Intentar parsear la respuesta JSON
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      // Si no se puede parsear JSON, puede ser un error de conexión
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`);
      }
      throw new Error('Error al procesar la respuesta del servidor');
    }

    if (!response.ok) {
      const err = new Error(data.mensaje || data.error || `Error ${response.status}: ${response.statusText}`);
      if (data.codigo) err.codigo = data.codigo;
      throw err;
    }

    return data;
  } catch (error) {
    console.error('Error en API request:', error);
    
    // Si es un error de red (no se pudo conectar al servidor)
    if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
      throw new Error('No se pudo conectar al servidor. Verifica que el backend esté corriendo.');
    }
    
    throw error;
  }
};

