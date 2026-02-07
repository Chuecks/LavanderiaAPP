import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerDirecciones } from '../services/direccion.service';
import { useFocusEffect } from '@react-navigation/native';

export default function SeleccionarDireccionScreen({ route, navigation }) {
  const { tipo } = route.params || {}; // 'recogida' o 'entrega'
  
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar direcciones cuando la pantalla recibe foco (se refresca automáticamente)
  useFocusEffect(
    React.useCallback(() => {
      console.log('SeleccionarDireccionScreen - Recibiendo foco, recargando direcciones...');
      loadDirecciones();
    }, [])
  );

  const loadDirecciones = async () => {
    try {
      setLoading(true);
      console.log('Cargando direcciones desde backend...');
      // Cargar desde el backend
      const direccionesData = await obtenerDirecciones();
      console.log('Direcciones cargadas:', direccionesData);
      setDirecciones(direccionesData || []);
    } catch (error) {
      console.error('Error al cargar direcciones desde backend:', error);
      // Fallback a AsyncStorage si el backend falla
      try {
        const data = await AsyncStorage.getItem('direcciones');
        if (data) {
          const parsed = JSON.parse(data);
          console.log('Direcciones cargadas desde AsyncStorage:', parsed);
          setDirecciones(parsed);
        } else {
          console.log('No hay direcciones en AsyncStorage');
          setDirecciones([]);
        }
      } catch (fallbackError) {
        console.error('Error al cargar direcciones desde AsyncStorage:', fallbackError);
        setDirecciones([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDireccion = (direccion) => {
    let texto = `${direccion.calle} ${direccion.numeroPuerta}`;
    if (direccion.numeroApartamento) {
      texto += `, Apt. ${direccion.numeroApartamento}`;
    }
    if (direccion.ciudad) {
      texto += `, ${direccion.ciudad}`;
    }
    if (direccion.departamento) {
      texto += `, ${direccion.departamento}`;
    }
    if (direccion.codigoPostal) {
      texto += ` (CP: ${direccion.codigoPostal})`;
    }
    return texto;
  };

  const handleSelectDireccion = async (direccion) => {
    try {
      // Guardar la dirección seleccionada temporalmente en AsyncStorage
      const dataToSave = {
        direccion: {
          calle: direccion.calle || '',
          numeroPuerta: direccion.numeroPuerta || '',
          numeroApartamento: direccion.numeroApartamento || '',
          ciudad: direccion.ciudad || '',
          departamento: direccion.departamento || '',
          codigoPostal: direccion.codigoPostal || '',
        },
        tipo: tipo || 'recogida',
      };
      
      await AsyncStorage.setItem('direccionTemporal', JSON.stringify(dataToSave));
      
      // Navegar de vuelta
      navigation.goBack();
    } catch (error) {
      console.error('Error al guardar dirección temporal:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          Seleccionar Dirección de {tipo === 'recogida' ? 'Recogida' : 'Entrega'}
        </Text>
      </LinearGradient>

      {direcciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
          <Text style={styles.emptySubtext}>
            Agrega una dirección en la pantalla de Direcciones para poder seleccionarla aquí
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton} 
            onPress={async () => {
              // Navegar a Direcciones y cuando vuelva, recargar
              navigation.navigate('Direcciones');
            }}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.emptyButtonGradient}
            >
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Agregar Dirección</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {direcciones.map((direccion) => (
            <TouchableOpacity
              key={direccion._id || direccion.id || direccion.nombre}
              style={styles.direccionCard}
              onPress={() => handleSelectDireccion(direccion)}
            >
              <View style={styles.direccionHeader}>
                <View style={styles.direccionIcon}>
                  <Ionicons name="location" size={24} color="#4A90E2" />
                </View>
                <View style={styles.direccionInfo}>
                  <Text style={styles.direccionNombre}>{direccion.nombre}</Text>
                  <Text style={styles.direccionTexto}>{formatDireccion(direccion)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
    textAlign: 'center',
    marginBottom: 30,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingVertical: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  direccionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  direccionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  direccionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E220',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  direccionInfo: {
    flex: 1,
  },
  direccionNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  direccionTexto: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});
