import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cerrarSesion } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

export default function CerrarSesionScreen({ route, navigation }) {
  const { setIsLoggedIn, setUserData } = useAuth();
  const [procesando, setProcesando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Procesar el cierre de sesión automáticamente al montar el componente
    procesarCerrarSesion();
  }, []);

  const procesarCerrarSesion = async () => {
    try {
      setProcesando(true);
      setError(null);
      
      // Primero llamar al endpoint de logout en el backend
      try {
        await cerrarSesion();
        console.log('Logout exitoso en el backend');
      } catch (backendError) {
        // Si falla el backend, continuar con el logout local
        // (puede ser que el token ya esté expirado o haya un problema de conexión)
        console.warn('Error al cerrar sesión en el backend, continuando con logout local:', backendError);
      }
      
      // Eliminar todos los datos de sesión de AsyncStorage
      await AsyncStorage.multiRemove([
        'authToken',
        'userData',
        'servicioTemporal',
        'direccionTemporal',
        'direcciones'
      ]);
      
      // Verificar que el token se eliminó
      const tokenVerificado = await AsyncStorage.getItem('authToken');
      if (tokenVerificado) {
        // Si aún existe, intentar eliminarlo de nuevo
        await AsyncStorage.removeItem('authToken');
      }
      
      setProcesando(false);
      
      // Auto-redirigir a Login después de 2 segundos
      setTimeout(() => {
        cerrarSesionYRedirigir();
      }, 2000);
      
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      setError('Ocurrió un error al cerrar sesión. Por favor intenta nuevamente.');
      setProcesando(false);
    }
  };

  const cerrarSesionYRedirigir = () => {
    try {
      if (typeof setUserData === 'function') setUserData(null);
      if (setIsLoggedIn) {
        setIsLoggedIn(false);
      } else {
        // Si no hay setIsLoggedIn, intentar navegar directamente
        navigation.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        });
      }
    } catch (navError) {
      console.error('Error al redirigir a Login:', navError);
      // Último fallback: resetear navegación
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E94B3C', '#C0392B']} style={styles.header}>
        <View style={styles.iconContainer}>
          {procesando ? (
            <ActivityIndicator size="large" color="#fff" />
          ) : error ? (
            <Ionicons name="close-circle" size={100} color="#fff" />
          ) : (
            <Ionicons name="log-out" size={100} color="#fff" />
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {procesando ? (
          <>
            <Text style={styles.title}>Cerrando Sesión...</Text>
            <Text style={styles.subtitle}>
              Por favor espera mientras cerramos tu sesión de forma segura
            </Text>
          </>
        ) : error ? (
          <>
            <Text style={styles.titleError}>Error al Cerrar Sesión</Text>
            <Text style={styles.subtitle}>
              {error}
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="alert-circle" size={24} color="#E94B3C" />
              <Text style={styles.infoText}>
                Puedes intentar cerrar sesión nuevamente o contactar con soporte si el problema persiste.
              </Text>
            </View>
          </>
        ) : (
          <>
            <Text style={styles.title}>Sesión Cerrada</Text>
            <Text style={styles.subtitle}>
              Tu sesión ha sido cerrada exitosamente. Todos tus datos de sesión han sido eliminados de forma segura.
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="shield-checkmark" size={24} color="#4A90E2" />
              <Text style={styles.infoText}>
                Para acceder nuevamente, deberás iniciar sesión con tus credenciales.
              </Text>
            </View>
            <Text style={styles.redirectText}>
              Redirigiendo a inicio de sesión en 2 segundos...
            </Text>
          </>
        )}

        {!procesando && (
          <TouchableOpacity
            style={styles.button}
            onPress={error ? procesarCerrarSesion : cerrarSesionYRedirigir}
          >
            <LinearGradient
              colors={error ? ['#E94B3C', '#C0392B'] : ['#4A90E2', '#357ABD']}
              style={styles.buttonGradient}
            >
              <Ionicons 
                name={error ? "refresh" : "log-in"} 
                size={20} 
                color="#fff" 
              />
              <Text style={styles.buttonText}>
                {error ? 'Intentar Nuevamente' : 'Ir a Inicio de Sesión'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  titleError: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E94B3C',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    lineHeight: 22,
  },
  redirectText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
