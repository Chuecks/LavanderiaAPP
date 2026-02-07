import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const CODIGOS_PAISES = [
  { codigo: '+598', pais: 'Uruguay', bandera: '🇺🇾' },
  { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+55', pais: 'Brasil', bandera: '🇧🇷' },
  { codigo: '+56', pais: 'Chile', bandera: '🇨🇱' },
  { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+52', pais: 'México', bandera: '🇲🇽' },
  { codigo: '+51', pais: 'Perú', bandera: '🇵🇪' },
  { codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨' },
  { codigo: '+595', pais: 'Paraguay', bandera: '🇵🇾' },
  { codigo: '+591', pais: 'Bolivia', bandera: '🇧🇴' },
  { codigo: '+58', pais: 'Venezuela', bandera: '🇻🇪' },
  { codigo: '+34', pais: 'España', bandera: '🇪🇸' },
  { codigo: '+1', pais: 'Estados Unidos / Canadá', bandera: '🇺🇸' },
  { codigo: '+39', pais: 'Italia', bandera: '🇮🇹' },
  { codigo: '+33', pais: 'Francia', bandera: '🇫🇷' },
  { codigo: '+49', pais: 'Alemania', bandera: '🇩🇪' },
  { codigo: '+44', pais: 'Reino Unido', bandera: '🇬🇧' },
  { codigo: '+61', pais: 'Australia', bandera: '🇦🇺' },
  { codigo: '+81', pais: 'Japón', bandera: '🇯🇵' },
  { codigo: '+86', pais: 'China', bandera: '🇨🇳' },
];

export default function RegisterScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    codigoPais: '+598',
    telefono: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [codigoPaisModalVisible, setCodigoPaisModalVisible] = useState(false);

  const handleInputChange = (field, value) => {
    if (field === 'telefono') {
      value = value.replace(/\D/g, '');
    }
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validarEmail = (email) => {
    if (!email || !email.trim()) return 'El email es requerido';
    if (!email.includes('@')) return 'El email debe contener @';
    if (!email.includes('.')) return 'El email debe contener un punto (.)';
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email.trim())) return 'Ingresa un email válido (ej: nombre@dominio.com)';
    return null;
  };

  const validarTelefono = (telefono) => {
    if (!telefono || !telefono.trim()) return 'El teléfono es requerido';
    if (!/^\d+$/.test(telefono)) return 'El teléfono debe contener solo números';
    if (telefono.length < 8) return 'Ingresa un número de teléfono válido (mín. 8 dígitos)';
    return null;
  };

  const validarContrasena = (password) => {
    if (!password || !password.trim()) {
      return 'La contraseña es requerida';
    }
    if (password.length < 8) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    if (!/[A-Z]/.test(password)) {
      return 'La contraseña debe tener al menos una letra mayúscula';
    }
    if (!/[0-9]/.test(password)) {
      return 'La contraseña debe tener al menos un número';
    }
    if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return 'La contraseña debe tener al menos un carácter especial (!@#$%&* etc.)';
    }
    return null;
  };

  const validateForm = () => {
    setError('');
    
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }
    const errorEmail = validarEmail(formData.email);
    if (errorEmail) {
      setError(errorEmail);
      return false;
    }
    const errorTelefono = validarTelefono(formData.telefono);
    if (errorTelefono) {
      setError(errorTelefono);
      return false;
    }
    const errorPassword = validarContrasena(formData.password);
    if (errorPassword) {
      setError(errorPassword);
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const telefonoCompleto = formData.codigoPais + formData.telefono.trim();
      const registroData = {
        nombre: formData.nombre.trim(),
        email: formData.email.trim().toLowerCase(),
        telefono: telefonoCompleto,
        password: formData.password,
      };

      const response = await apiRequest('/auth/registro', 'POST', registroData);

      if (response.success) {
        setFormData({
          nombre: '',
          email: '',
          codigoPais: '+598',
          telefono: '',
          password: '',
          confirmPassword: '',
        });
        navigation.navigate('RegistroExitoso');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      setError(error.message || 'Error al registrar usuario. Por favor intenta nuevamente.');
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
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.navigate('Login')}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
              <Text style={styles.backButtonText}>Atrás</Text>
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <Ionicons name="person-add" size={80} color="#fff" />
            </View>
            
            <Text style={styles.title}>Crear Cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para hacer pedidos</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nombre *"
                  placeholderTextColor="#999"
                  value={formData.nombre}
                  onChangeText={(value) => {
                    handleInputChange('nombre', value);
                    setError('');
                  }}
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email * (ej: nombre@dominio.com)"
                  placeholderTextColor="#999"
                  value={formData.email}
                  onChangeText={(value) => {
                    handleInputChange('email', value);
                    setError('');
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              <Text style={styles.emailHint}>Debe contener @ y un punto (.)</Text>

              <View style={styles.phoneRow}>
                <TouchableOpacity
                  style={styles.codigoPaisButton}
                  onPress={() => setCodigoPaisModalVisible(true)}
                >
                  <Text style={styles.codigoPaisText}>
                    {CODIGOS_PAISES.find(p => p.codigo === formData.codigoPais)?.bandera || '🌐'} {formData.codigoPais}
                  </Text>
                  <Ionicons name="chevron-down" size={18} color="#666" />
                </TouchableOpacity>
                <View style={[styles.inputContainer, styles.phoneInputContainer]}>
                  <Ionicons name="call-outline" size={20} color="#666" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Solo números *"
                    placeholderTextColor="#999"
                    value={formData.telefono}
                    onChangeText={(value) => {
                      handleInputChange('telefono', value);
                      setError('');
                    }}
                    keyboardType="phone-pad"
                    maxLength={15}
                  />
                </View>
              </View>
              <Text style={styles.phoneHint}>Selecciona tu país y escribe solo dígitos del teléfono</Text>

              <Modal
                visible={codigoPaisModalVisible}
                transparent
                animationType="slide"
                onRequestClose={() => setCodigoPaisModalVisible(false)}
              >
                <View style={styles.modalOverlay}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Código de país</Text>
                      <TouchableOpacity onPress={() => setCodigoPaisModalVisible(false)}>
                        <Ionicons name="close" size={28} color="#333" />
                      </TouchableOpacity>
                    </View>
                    <ScrollView style={styles.modalList}>
                      {CODIGOS_PAISES.map((item) => (
                        <TouchableOpacity
                          key={item.codigo}
                          style={[
                            styles.modalItem,
                            formData.codigoPais === item.codigo && styles.modalItemSelected
                          ]}
                          onPress={() => {
                            handleInputChange('codigoPais', item.codigo);
                            setCodigoPaisModalVisible(false);
                          }}
                        >
                          <Text style={styles.modalItemFlag}>{item.bandera}</Text>
                          <Text style={styles.modalItemPais}>{item.pais}</Text>
                          <Text style={styles.modalItemCodigo}>{item.codigo}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              </Modal>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Contraseña *"
                  placeholderTextColor="#999"
                  value={formData.password}
                  onChangeText={(value) => {
                    handleInputChange('password', value);
                    setError('');
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
              <Text style={styles.passwordHint}>
                8 caracteres, al menos una mayúscula, un número y un carácter especial (!@#$%&*)
              </Text>

              <View style={[
                styles.inputContainer,
                formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && styles.inputContainerError
              ]}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Repetir contraseña *"
                  placeholderTextColor="#999"
                  value={formData.confirmPassword}
                  onChangeText={(value) => {
                    handleInputChange('confirmPassword', value);
                    setError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color="#666"
                  />
                </TouchableOpacity>
                {formData.confirmPassword.length > 0 && (
                  formData.password === formData.confirmPassword ? (
                    <Ionicons name="checkmark-circle" size={22} color="#28a745" style={styles.confirmIcon} />
                  ) : (
                    <Ionicons name="close-circle" size={22} color="#E94B3C" style={styles.confirmIcon} />
                  )
                )}
              </View>
              {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                <Text style={styles.confirmErrorText}>La contraseña y repetir contraseña deben coincidir</Text>
              )}

              {/* Mensaje de error */}
              {error ? (
                <View style={styles.errorContainer}>
                  <Ionicons name="alert-circle" size={20} color="#E94B3C" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.registerButton, loading && styles.registerButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#4A90E2" />
                ) : (
                  <Text style={styles.registerButtonText}>Registrarse</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.loginLinkText}>
                  ¿Ya tienes cuenta? <Text style={styles.loginLinkBold}>Inicia sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
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
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 30,
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
  inputContainerError: {
    borderWidth: 1,
    borderColor: '#E94B3C',
  },
  confirmIcon: {
    marginLeft: 4,
  },
  confirmErrorText: {
    fontSize: 12,
    color: '#E94B3C',
    marginBottom: 12,
    marginLeft: 4,
  },
  emailHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    marginLeft: 4,
  },
  phoneRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  codigoPaisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 14,
    minWidth: 100,
    height: 50,
  },
  codigoPaisText: {
    fontSize: 16,
    color: '#333',
  },
  phoneInputContainer: {
    flex: 1,
    marginBottom: 0,
  },
  phoneHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalList: {
    padding: 10,
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
  },
  modalItemSelected: {
    backgroundColor: '#E8F0FE',
  },
  modalItemFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  modalItemPais: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  modalItemCodigo: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  passwordHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 12,
    marginLeft: 4,
  },
  roleContainer: {
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#4A90E2',
  },
  roleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  roleButtonTextActive: {
    color: '#fff',
  },
  registerButton: {
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonDisabled: {
    opacity: 0.6,
  },
  registerButtonText: {
    color: '#4A90E2',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#fff',
    fontSize: 14,
  },
  loginLinkBold: {
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

