// Configuración de la API
// En dispositivo físico (Android/iOS con Expo Go) la app debe apuntar a la IP de tu PC, no a localhost.
// Si ves "No se pudo conectar al servidor":
//   1) Backend corriendo: en carpeta Back end → npm run dev
//   2) IP correcta: en Windows ejecuta "ipconfig" y usa la IPv4 de tu Wi‑Fi (ej: 192.168.1.15)
//   3) Celular y PC en la MISMA red Wi‑Fi (router). No uses el hotspot del celular: el celular no suele poder conectar a la PC cuando la PC se conecta al hotspot.
//   4) Firewall: permitir Node.js o el puerto 4000
const IP_PC = '192.168.1.11';  // ← Cambia por TU IPv4 (ipconfig en Windows, con la PC en ese Wi‑Fi)

import { Platform } from 'react-native';

let API_BASE_URL;

if (__DEV__) {
  if (Platform.OS === 'web') {
    API_BASE_URL = 'http://localhost:4000/api';
  } else if (Platform.OS === 'ios') {
    // Simulador: localhost. Dispositivo físico: IP de la PC
    API_BASE_URL = `http://${IP_PC}:4000/api`;
  } else {
    // Android: Emulador usa 10.0.2.2; dispositivo físico usa IP de la PC
    API_BASE_URL = `http://${IP_PC}:4000/api`;
  }
} else {
  // En Docker: EXPO_PUBLIC_API_URL=/api (mismo origen, nginx hace proxy). En Vercel/otro: poner la URL de tu API.
  API_BASE_URL = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'https://tu-api-produccion.com/api';
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

