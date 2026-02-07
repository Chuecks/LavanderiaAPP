import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ServiciosScreen() {
  const [servicios, setServicios] = useState([
    { id: 1, nombre: 'Lavado Básico', precio: 5000, descripcion: 'Lavado y secado básico' },
    { id: 2, nombre: 'Planchado', precio: 3000, descripcion: 'Planchado de prendas' },
    { id: 3, nombre: 'Lavado Premium', precio: 8000, descripcion: 'Lavado, secado y planchado' },
    { id: 4, nombre: 'Limpieza en Seco', precio: 12000, descripcion: 'Limpieza especializada' },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', precio: '', descripcion: '' });

  const handleAddService = () => {
    setEditingService(null);
    setFormData({ nombre: '', precio: '', descripcion: '' });
    setModalVisible(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setFormData({
      nombre: service.nombre,
      precio: service.precio.toString(),
      descripcion: service.descripcion,
    });
    setModalVisible(true);
  };

  const handleSaveService = () => {
    if (!formData.nombre || !formData.precio) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos');
      return;
    }

    if (editingService) {
      setServicios(servicios.map(s =>
        s.id === editingService.id
          ? { ...s, ...formData, precio: parseFloat(formData.precio) }
          : s
      ));
    } else {
      const newService = {
        id: servicios.length + 1,
        nombre: formData.nombre,
        precio: parseFloat(formData.precio),
        descripcion: formData.descripcion || '',
      };
      setServicios([...servicios, newService]);
    }

    setModalVisible(false);
    setFormData({ nombre: '', precio: '', descripcion: '' });
  };

  const handleDeleteService = (id) => {
    Alert.alert(
      'Eliminar Servicio',
      '¿Estás seguro de eliminar este servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setServicios(servicios.filter(s => s.id !== id)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Servicios</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddService}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {servicios.map((servicio) => (
          <View key={servicio.id} style={styles.serviceCard}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceName}>{servicio.nombre}</Text>
              <Text style={styles.serviceDescription}>{servicio.descripcion}</Text>
              <Text style={styles.servicePrice}>${servicio.precio.toLocaleString()}</Text>
            </View>
            <View style={styles.serviceActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => handleEditService(servicio)}
              >
                <Ionicons name="pencil" size={20} color="#4A90E2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteService(servicio.id)}
              >
                <Ionicons name="trash" size={20} color="#E94B3C" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>Nombre del Servicio</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                placeholder="Ej: Lavado Básico"
              />

              <Text style={styles.label}>Precio</Text>
              <TextInput
                style={styles.input}
                value={formData.precio}
                onChangeText={(text) => setFormData({ ...formData, precio: text })}
                placeholder="Ej: 5000"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.descripcion}
                onChangeText={(text) => setFormData({ ...formData, descripcion: text })}
                placeholder="Descripción del servicio"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveService}>
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
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
  header: {
    backgroundColor: '#4A90E2',
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  serviceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  serviceActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 15,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 15,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 25,
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    padding: 15,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

