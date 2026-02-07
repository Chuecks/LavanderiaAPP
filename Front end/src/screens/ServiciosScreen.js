import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ServiciosScreen({ navigation }) {
  const [servicios, setServicios] = useState([
    { id: 1, nombre: 'Lavado Básico', precio: 5000, descripcion: 'Lavado y secado básico' },
    { id: 2, nombre: 'Planchado', precio: 3000, descripcion: 'Planchado de prendas' },
    { id: 3, nombre: 'Lavado Premium', precio: 8000, descripcion: 'Lavado, secado y planchado' },
    { id: 4, nombre: 'Limpieza en Seco', precio: 12000, descripcion: 'Limpieza especializada' },
  ]);


  const handleSolicitarServicio = async (servicio) => {
    try {
      console.log('handleSolicitarServicio - Servicio:', servicio);
      console.log('Navigation object:', navigation);
      
      // Guardar el servicio en AsyncStorage como respaldo
      await AsyncStorage.setItem('servicioTemporal', JSON.stringify(servicio));
      console.log('Servicio guardado en AsyncStorage');
      
      // Intentar navegar usando el Stack Navigator padre
      // Desde un Tab Navigator dentro de un Stack Navigator, necesitamos usar getParent()
      const parentNav = navigation.getParent();
      console.log('Parent navigator:', parentNav);
      
      if (parentNav && parentNav.navigate) {
        console.log('Navegando con parent navigator a EspecificacionPedido');
        parentNav.navigate('EspecificacionPedido', { servicio });
      } else {
        console.log('No hay parent navigator válido, intentando navegación directa');
        // Fallback: intentar navegar directamente (puede funcionar en algunos casos)
        navigation.navigate('EspecificacionPedido', { servicio });
      }
    } catch (error) {
      console.error('Error en handleSolicitarServicio:', error);
      Alert.alert('Error', `No se pudo abrir la pantalla: ${error.message}`);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <Text style={styles.headerTitle}>Servicios Disponibles</Text>
        <Text style={styles.headerSubtitle}>Elige el servicio que necesitas</Text>
      </LinearGradient>

      <ScrollView style={styles.content}>
        {servicios.map((servicio) => (
          <View key={servicio.id} style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <View style={styles.serviceHeader}>
                <View style={styles.serviceIconContainer}>
                  <Ionicons name="shirt" size={24} color="#4A90E2" />
                </View>
                <Text style={styles.serviceName}>{servicio.nombre}</Text>
              </View>
              <Text style={styles.serviceDescription}>{servicio.descripcion}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Precio:</Text>
                <Text style={styles.servicePrice}>${servicio.precio.toLocaleString()}</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.solicitarButton}
              onPress={() => handleSolicitarServicio(servicio)}
            >
              <LinearGradient
                colors={['#4A90E2', '#357ABD']}
                style={styles.solicitarButtonGradient}
              >
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.solicitarButtonText}>Solicitar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>

    </View>
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
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceInfo: {
    marginBottom: 15,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  serviceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  serviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
  },
  servicePrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  solicitarButton: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  solicitarButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  solicitarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

