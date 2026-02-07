import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
  ActivityIndicator,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerEstadisticas } from '../services/pedido.service';
import { cerrarSesion } from '../services/auth.service';
import { apiRequest } from '../config/api';
import { useAuth } from '../context/AuthContext';

const EMAIL_SOPORTE = 'lavaderojmm@gmail.com';

export default function PerfilScreen({ navigation }) {
  const { setIsLoggedIn } = useAuth();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completados: 0
  });
  const [modalCambiarContrasenaVisible, setModalCambiarContrasenaVisible] = useState(false);
  const [contraseñaActual, setContraseñaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [repetirContrasena, setRepetirContrasena] = useState('');
  const [loadingCambiar, setLoadingCambiar] = useState(false);
  const [errorCambiar, setErrorCambiar] = useState('');

  useEffect(() => {
    loadUserData();
    loadEstadisticas();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEstadisticas = async () => {
    try {
      const stats = await obtenerEstadisticas();
      if (stats && typeof stats === 'object') {
        setEstadisticas({
          total: stats.total ?? 0,
          pendientes: stats.pendientes ?? 0,
          enProceso: stats.enProceso ?? 0,
          completados: stats.completados ?? 0
        });
      }
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const performLogout = async () => {
    try {
      try {
        await cerrarSesion();
      } catch (backendError) {
        // Si falla el backend, continuar con el logout local
      }
      await AsyncStorage.multiRemove([
        'authToken',
        'userData',
        'servicioTemporal',
        'direccionTemporal',
        'direcciones'
      ]);
      if (setIsLoggedIn && typeof setIsLoggedIn === 'function') {
        setIsLoggedIn(false);
      } else {
        const parentNav = navigation?.getParent?.();
        if (parentNav?.reset) {
          parentNav.reset({ index: 0, routes: [{ name: 'Login' }] });
        }
      }
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      if (Platform.OS !== 'web') {
        Alert.alert('Error', 'Ocurrió un error al cerrar sesión. Por favor intenta nuevamente.');
      } else if (typeof window !== 'undefined') {
        window.alert('Ocurrió un error al cerrar sesión. Por favor intenta nuevamente.');
      }
    }
  };

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
        performLogout();
      }
      return;
    }
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: performLogout },
      ],
      { cancelable: true }
    );
  };

  const validarNuevaContrasena = (password) => {
    if (!password || password.length < 8) return 'Al menos 8 caracteres';
    if (!/[A-Z]/.test(password)) return 'Al menos una mayúscula';
    if (!/[0-9]/.test(password)) return 'Al menos un número';
    if (!/[!@#$%&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return 'Al menos un carácter especial';
    return null;
  };

  const handleCambiarContrasena = async () => {
    setErrorCambiar('');
    if (!contraseñaActual.trim()) {
      setErrorCambiar('Ingresa tu contraseña actual');
      return;
    }
    const errorNueva = validarNuevaContrasena(nuevaContrasena);
    if (errorNueva) {
      setErrorCambiar(`Nueva contraseña: ${errorNueva}`);
      return;
    }
    if (nuevaContrasena !== repetirContrasena) {
      setErrorCambiar('La nueva contraseña y la repetición no coinciden');
      return;
    }
    setLoadingCambiar(true);
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        setErrorCambiar('Sesión expirada. Cierra sesión e inicia de nuevo.');
        return;
      }
      await apiRequest('/auth/cambiar-contrasena', 'POST', {
        contraseñaActual: contraseñaActual.trim(),
        nuevaContrasena: nuevaContrasena,
      }, token);
      setModalCambiarContrasenaVisible(false);
      setContraseñaActual('');
      setNuevaContrasena('');
      setRepetirContrasena('');
      const parentNav = navigation?.getParent?.();
      if (parentNav?.navigate) {
        parentNav.navigate('ContrasenaCambiada');
      } else if (navigation?.navigate) {
        navigation.navigate('ContrasenaCambiada');
      } else if (Platform.OS !== 'web') {
        Alert.alert('Listo', 'Tu contraseña se actualizó correctamente.');
      } else if (typeof window !== 'undefined') {
        window.alert('Tu contraseña se actualizó correctamente.');
      }
    } catch (err) {
      const msg = (err && err.message) ? String(err.message) : 'Error al cambiar la contraseña. Intenta más tarde.';
      setErrorCambiar(msg);
    } finally {
      setLoadingCambiar(false);
    }
  };

  const menuItems = [
    {
      icon: 'location-outline',
      title: 'Mis Direcciones',
      onPress: () => {
        const parentNav = navigation.getParent();
        if (parentNav && parentNav.navigate) {
          parentNav.navigate('Direcciones');
        } else {
          navigation.navigate('Direcciones');
        }
      },
    },
    {
      icon: 'document-text-outline',
      title: 'Mis Pedidos',
      onPress: () => navigation.navigate('Mis Pedidos'),
    },
    {
      icon: 'notifications-outline',
      title: 'Notificaciones',
      onPress: () => Alert.alert('Notificaciones', 'Gestiona tus preferencias de notificaciones'),
    },
    {
      icon: 'key-outline',
      title: 'Cambiar contraseña',
      onPress: () => {
        setContraseñaActual('');
        setNuevaContrasena('');
        setRepetirContrasena('');
        setErrorCambiar('');
        setModalCambiarContrasenaVisible(true);
      },
    },
    {
      icon: 'help-circle-outline',
      title: 'Ayuda y Soporte',
      onPress: () => {
        if (Platform.OS !== 'web') {
          Alert.alert('Ayuda y Soporte', `¿Necesitas ayuda? Escríbenos a:\n\n${EMAIL_SOPORTE}`);
        } else if (typeof window !== 'undefined') {
          window.alert(`Ayuda y Soporte\n\nEscríbenos a: ${EMAIL_SOPORTE}`);
        }
      },
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  const userName = userData?.nombre || 'Usuario';
  const userEmail = userData?.email || 'usuario@lavadero.com';
  const userPhone = userData?.telefono || 'Sin teléfono';

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color="#fff" />
          </View>
        </View>
        <Text style={styles.name}>{userName}</Text>
        <Text style={styles.email}>{userEmail}</Text>
        {userPhone && userPhone !== 'Sin teléfono' && (
          <View style={styles.phoneContainer}>
            <Ionicons name="call-outline" size={16} color="#fff" />
            <Text style={styles.phone}>{userPhone}</Text>
          </View>
        )}
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="list" size={24} color="#4A90E2" style={styles.statIcon} />
            <Text style={styles.statValue}>{estadisticas.total}</Text>
            <Text style={styles.statLabel}>Pedidos</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={24} color="#4A90E2" style={styles.statIcon} />
            <Text style={styles.statValue}>{estadisticas.enProceso}</Text>
            <Text style={styles.statLabel}>En Proceso</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle-outline" size={24} color="#4A90E2" style={styles.statIcon} />
            <Text style={styles.statValue}>{estadisticas.completados}</Text>
            <Text style={styles.statLabel}>Completados</Text>
          </View>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <Ionicons name={item.icon} size={24} color="#4A90E2" />
                <Text style={styles.menuItemText}>{item.title}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && { opacity: 0.85 }]}
          onPress={handleLogout}
        >
          <LinearGradient
            colors={['#E94B3C', '#C0392B']}
            style={styles.logoutButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            pointerEvents="none"
          >
            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.logoutIcon} />
            <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
          </LinearGradient>
        </Pressable>
      </View>

      {/* Modal Cambiar contraseña */}
      <Modal
        visible={modalCambiarContrasenaVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalCambiarContrasenaVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setModalCambiarContrasenaVisible(false)} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cambiar contraseña</Text>
              <TouchableOpacity onPress={() => setModalCambiarContrasenaVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalHint}>Ingresa tu contraseña actual y la nueva. La nueva debe tener 8+ caracteres, mayúscula, número y carácter especial.</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contraseña actual *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Tu contraseña actual"
                placeholderTextColor="#999"
                value={contraseñaActual}
                onChangeText={(t) => { setContraseñaActual(t); setErrorCambiar(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nueva contraseña *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nueva contraseña (8+ caracteres)"
                placeholderTextColor="#999"
                value={nuevaContrasena}
                onChangeText={(t) => { setNuevaContrasena(t); setErrorCambiar(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Repetir nueva contraseña *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Repite la nueva contraseña"
                placeholderTextColor="#999"
                value={repetirContrasena}
                onChangeText={(t) => { setRepetirContrasena(t); setErrorCambiar(''); }}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>
            {errorCambiar ? (
              <View style={styles.errorCambiarContainer}>
                <Ionicons name="alert-circle" size={18} color="#E94B3C" />
                <Text style={styles.errorCambiarText}>{errorCambiar}</Text>
              </View>
            ) : null}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setModalCambiarContrasenaVisible(false)}
                disabled={loadingCambiar}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButtonOk, loadingCambiar && { opacity: 0.7 }]}
                onPress={handleCambiarContrasena}
                disabled={loadingCambiar}
              >
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.modalButtonOkGradient}
                >
                  {loadingCambiar ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.modalButtonOkText}>Cambiar contraseña</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phone: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginLeft: 5,
  },
  content: {
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statIcon: {
    marginBottom: 8,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
    marginTop: 5,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  logoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    width: '100%',
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    width: '100%',
  },
  logoutIcon: {
    marginRight: 10,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  modalHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  errorCambiarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorCambiarText: {
    color: '#E94B3C',
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalButtonOk: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalButtonOkGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonOkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
