import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AppLogo from '../components/AppLogo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const NAV_BAR_BLUE = '#357ABD';

export default function LoginScreen({ navigation, route }) {
  const { setIsLoggedIn, setUserData } = useAuth();
  const [tipoCuenta, setTipoCuenta] = useState(route.params?.tipo ?? null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync(NAV_BAR_BLUE);
    NavigationBar.setButtonStyleAsync('light');
    return () => {
      NavigationBar.setBackgroundColorAsync('#ffffff');
      NavigationBar.setButtonStyleAsync('dark');
    };
  }, []);

  // Botón atrás de Android: si hay tipo elegido, volver a la pantalla de elegir; si no, dejar que cierre/salga
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const onBack = () => {
      if (tipoCuenta !== null) {
        setTipoCuenta(null);
        setError('');
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => subscription.remove();
  }, [tipoCuenta]);

  const handleLogin = async () => {
    // Limpiar error anterior
    setError('');

    // Validación: debe haber elegido un tipo de cuenta
    if (tipoCuenta === null) {
      setError('Por favor selecciona el tipo de cuenta (Usuario o Lavandería)');
      return;
    }

    // Validación básica
    if (!email.trim() || !password.trim()) {
      setError('Por favor ingresa email y contraseña');
      return;
    }

    setLoading(true);
    try {
      // Hacer petición al backend, pasando el tipo de cuenta
      const response = await apiRequest('/auth/login', 'POST', {
        email: email.trim().toLowerCase(),
        password: password,
        rol: tipoCuenta, // Enviar el tipo de cuenta para validación
      });

      if (response.success && response.data.token) {
        const usuario = response.data.usuario;
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('userData', JSON.stringify(usuario));
        
        // Actualizar el contexto antes de cambiar isLoggedIn para evitar inconsistencias
        if (typeof setUserData === 'function') setUserData(usuario);
        if (typeof setIsLoggedIn === 'function') setIsLoggedIn(true);
        
        setEmail('');
        setPassword('');
        setError('');
      } else {
        setError('Error al iniciar sesión. Por favor intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error en login:', error);
      
      // Mostrar mensaje de error específico del backend
      let errorMessage = 'Error al iniciar sesión. Verifica tus credenciales.';
      
      if (error.message) {
        // Mensajes específicos del backend
        if (error.message.includes('Esta cuenta no es de una lavandería')) {
          errorMessage = 'Esta cuenta no es de una lavandería. Por favor inicia sesión en la opción de Usuario.';
        } else if (error.message.includes('Esta cuenta es de una lavandería')) {
          errorMessage = 'Esta cuenta es de una lavandería. Por favor inicia sesión en la opción de Lavandería.';
        } else if (error.message.includes('Credenciales inválidas')) {
          errorMessage = 'Usuario o contraseña incorrectos. Por favor verifica tus credenciales.';
        } else if (error.message.includes('No se pudo conectar')) {
          errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo.';
        } else if (error.message.includes('Usuario inactivo')) {
          errorMessage = 'Tu cuenta está inactiva. Contacta al administrador.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#4A90E2', '#357ABD']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          {tipoCuenta !== null && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => { setTipoCuenta(null); setError(''); }}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>
          )}
          <View style={styles.iconContainer}>
            <AppLogo size={200} />
          </View>
          
          <Text style={styles.title}>Lavadero App</Text>
          <Text style={styles.subtitle}>Gestiona tus Lavados fácilmente</Text>

          {tipoCuenta === null ? (
            <View style={styles.tipoButtonsWrap}>
              <Text style={styles.tipoLabel}>¿Cómo quieres acceder?</Text>
              <TouchableOpacity
                style={styles.tipoButton}
                onPress={() => setTipoCuenta('usuario')}
              >
                <Ionicons name="person" size={28} color="#4A90E2" />
                <View style={styles.tipoButtonTextWrap}>
                  <Text style={styles.tipoButtonText}>Usuarios</Text>
                  <Text style={styles.tipoButtonHint}>Clientes que hacen pedidos</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tipoButton}
                onPress={() => setTipoCuenta('lavanderia')}
              >
                <Ionicons name="business" size={28} color="#4A90E2" />
                <View style={styles.tipoButtonTextWrap}>
                  <Text style={styles.tipoButtonText}>Lavanderías</Text>
                  <Text style={styles.tipoButtonHint}>Negocios que reciben pedidos</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.registerLink}
                onPress={() => navigation?.navigate('Register')}
              >
                <Text style={styles.registerLinkText}>
                  ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(''); // Limpiar error al escribir
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(''); // Limpiar error al escribir
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color="#666"
                />
              </TouchableOpacity>
            </View>

            {/* Mensaje de error */}
            {error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#E94B3C" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.loginButton, loading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#4A90E2" />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => {
                try {
                  if (navigation?.navigate) {
                    navigation.navigate('OlvideContrasena');
                  } else {
                    setError('No se pudo abrir la pantalla. Intenta de nuevo.');
                  }
                } catch (e) {
                  console.error('Error al ir a Olvidé contraseña:', e);
                  setError('No se pudo abrir la pantalla. Intenta de nuevo.');
                }
              }}
            >
              <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation?.navigate('Register', { tipo: tipoCuenta })}
            >
              <Text style={styles.registerLinkText}>
                ¿No tienes cuenta? <Text style={styles.registerLinkBold}>Regístrate</Text>
              </Text>
            </TouchableOpacity>
          </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: '100vh' }),
  },
  keyboardView: {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: '100vh' }),
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  iconContainer: {
    marginBottom: 4,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 12,
  },
  tipoButtonsWrap: {
    width: '100%',
    maxWidth: 400,
    marginTop: 8,
  },
  tipoLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  tipoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 14,
  },
  tipoButtonTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  tipoButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  tipoButtonHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  form: {
    width: '100%',
    maxWidth: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  eyeIcon: {
    padding: 5,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotLink: {
    marginTop: 14,
    alignItems: 'center',
  },
  forgotLinkText: {
    color: '#fff',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#fff',
    fontSize: 14,
  },
  registerLinkBold: {
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E94B3C',
  },
  errorText: {
    color: '#E94B3C',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
});

