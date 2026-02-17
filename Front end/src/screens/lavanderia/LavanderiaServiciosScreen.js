import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getServicios } from '../../services/servicio.service';
import { getMiPerfilLavanderia, actualizarServiciosLavanderia } from '../../services/lavanderia.service';

export default function LavanderiaServiciosScreen({ navigation }) {
  const [serviciosOfrecidos, setServiciosOfrecidos] = useState([]);
  const [serviciosDisponibles, setServiciosDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalAgregarVisible, setModalAgregarVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [perfil, servicios] = await Promise.all([
        getMiPerfilLavanderia(),
        getServicios(),
      ]);
      setServiciosOfrecidos(perfil.serviciosOfrecidos || []);
      setServiciosDisponibles(servicios || []);
    } catch (error) {
      console.error('Error al cargar servicios:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargar();
  };

  const agregarServicio = (nombre) => {
    if (!serviciosOfrecidos.includes(nombre)) {
      setServiciosOfrecidos((prev) => [...prev, nombre]);
    }
    setModalAgregarVisible(false);
  };

  const quitarServicio = (nombre) => {
    setServiciosOfrecidos((prev) => prev.filter((s) => s !== nombre));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      await actualizarServiciosLavanderia(serviciosOfrecidos);
      Alert.alert('Listo', 'Servicios actualizados correctamente.');
    } catch (error) {
      console.error('Error al guardar:', error);
      Alert.alert('Error', error.message || 'No se pudieron guardar los servicios.');
    } finally {
      setSaving(false);
    }
  };

  const serviciosParaAgregar = serviciosDisponibles.filter(
    (s) => !serviciosOfrecidos.includes(s.nombre)
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando...</Text>
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
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis servicios</Text>
        <Text style={styles.headerSubtitle}>Servicios que ofrece tu lavandería</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentInner}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
        }
      >
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Servicios ofrecidos</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setModalAgregarVisible(true)}
            >
              <Ionicons name="add-circle-outline" size={22} color="#4A90E2" />
              <Text style={styles.addButtonText}>Añadir</Text>
            </TouchableOpacity>
          </View>

          {serviciosOfrecidos.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="shirt-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes servicios configurados</Text>
              <Text style={styles.emptySubtext}>Toca "Añadir" para ofrecer servicios</Text>
              <TouchableOpacity
                style={styles.emptyAddButton}
                onPress={() => setModalAgregarVisible(true)}
              >
                <Text style={styles.emptyAddButtonText}>Añadir servicio</Text>
              </TouchableOpacity>
            </View>
          ) : (
            serviciosOfrecidos.map((nombre) => {
              const info = serviciosDisponibles.find((s) => s.nombre === nombre);
              return (
                <View key={nombre} style={styles.serviceCard}>
                  <View style={styles.serviceCardLeft}>
                    <View style={styles.serviceIconWrap}>
                      <Ionicons name="shirt" size={22} color="#4A90E2" />
                    </View>
                    <View>
                      <Text style={styles.serviceName}>{nombre}</Text>
                      {info && info.descripcion ? (
                        <Text style={styles.serviceDesc} numberOfLines={1}>{info.descripcion}</Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => quitarServicio(nombre)}
                  >
                    <Ionicons name="trash-outline" size={22} color="#E94B3C" />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {serviciosOfrecidos.length > 0 && (
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={guardar}
            disabled={saving}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.saveButtonGradient}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="save-outline" size={20} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar cambios</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Modal
        visible={modalAgregarVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalAgregarVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Añadir servicio</Text>
              <TouchableOpacity onPress={() => setModalAgregarVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {serviciosParaAgregar.length === 0 ? (
                <Text style={styles.modalEmpty}>Ya ofreces todos los servicios disponibles</Text>
              ) : (
                serviciosParaAgregar.map((srv) => (
                  <TouchableOpacity
                    key={srv.id || srv.nombre}
                    style={styles.modalItem}
                    onPress={() => agregarServicio(srv.nombre)}
                  >
                    <Text style={styles.modalItemName}>{srv.nombre}</Text>
                    <Ionicons name="add-circle-outline" size={22} color="#4A90E2" />
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 6,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  addButtonText: {
    fontSize: 15,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 6,
  },
  emptyBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 6,
  },
  emptyAddButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90E2',
    borderRadius: 10,
  },
  emptyAddButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  serviceCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  serviceIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(74,144,226,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  serviceDesc: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  saveButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
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
    padding: 16,
    maxHeight: 400,
  },
  modalEmpty: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    padding: 24,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#f9f9f9',
    marginBottom: 8,
  },
  modalItemName: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
});
