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

export default function ClientesScreen() {
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      telefono: '+56 9 1234 5678',
      email: 'juan@email.com',
      direccion: 'Av. Principal 123',
      pedidos: 5,
    },
    {
      id: 2,
      nombre: 'María García',
      telefono: '+56 9 2345 6789',
      email: 'maria@email.com',
      direccion: 'Calle Secundaria 456',
      pedidos: 3,
    },
    {
      id: 3,
      nombre: 'Carlos López',
      telefono: '+56 9 3456 7890',
      email: 'carlos@email.com',
      direccion: 'Pasaje Los Olivos 789',
      pedidos: 8,
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCliente, setEditingCliente] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    email: '',
    direccion: '',
  });

  const filteredClientes = clientes.filter(cliente =>
    cliente.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cliente.telefono.includes(searchQuery)
  );

  const handleAddCliente = () => {
    setEditingCliente(null);
    setFormData({ nombre: '', telefono: '', email: '', direccion: '' });
    setModalVisible(true);
  };

  const handleEditCliente = (cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      email: cliente.email,
      direccion: cliente.direccion,
    });
    setModalVisible(true);
  };

  const handleSaveCliente = () => {
    if (!formData.nombre || !formData.telefono) {
      Alert.alert('Error', 'Por favor completa los campos requeridos');
      return;
    }

    if (editingCliente) {
      setClientes(clientes.map(c =>
        c.id === editingCliente.id
          ? { ...c, ...formData }
          : c
      ));
    } else {
      const newCliente = {
        id: clientes.length + 1,
        ...formData,
        pedidos: 0,
      };
      setClientes([...clientes, newCliente]);
    }

    setModalVisible(false);
    setFormData({ nombre: '', telefono: '', email: '', direccion: '' });
  };

  const handleDeleteCliente = (id) => {
    Alert.alert(
      'Eliminar Cliente',
      '¿Estás seguro de eliminar este cliente?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => setClientes(clientes.filter(c => c.id !== id)),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Clientes</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCliente}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar cliente..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView style={styles.content}>
        {filteredClientes.map((cliente) => (
          <View key={cliente.id} style={styles.clienteCard}>
            <View style={styles.clienteAvatar}>
              <Text style={styles.clienteInitial}>
                {cliente.nombre.charAt(0).toUpperCase()}
              </Text>
            </View>

            <View style={styles.clienteInfo}>
              <Text style={styles.clienteNombre}>{cliente.nombre}</Text>
              <View style={styles.clienteDetail}>
                <Ionicons name="call-outline" size={14} color="#666" />
                <Text style={styles.clienteText}>{cliente.telefono}</Text>
              </View>
              <View style={styles.clienteDetail}>
                <Ionicons name="mail-outline" size={14} color="#666" />
                <Text style={styles.clienteText}>{cliente.email}</Text>
              </View>
              <View style={styles.clienteDetail}>
                <Ionicons name="location-outline" size={14} color="#666" />
                <Text style={styles.clienteText}>{cliente.direccion}</Text>
              </View>
              <View style={styles.pedidosBadge}>
                <Text style={styles.pedidosText}>{cliente.pedidos} pedidos</Text>
              </View>
            </View>

            <View style={styles.clienteActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleEditCliente(cliente)}
              >
                <Ionicons name="pencil" size={20} color="#4A90E2" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDeleteCliente(cliente.id)}
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
                {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Nombre *</Text>
              <TextInput
                style={styles.input}
                value={formData.nombre}
                onChangeText={(text) => setFormData({ ...formData, nombre: text })}
                placeholder="Nombre completo"
              />

              <Text style={styles.label}>Teléfono *</Text>
              <TextInput
                style={styles.input}
                value={formData.telefono}
                onChangeText={(text) => setFormData({ ...formData, telefono: text })}
                placeholder="+56 9 1234 5678"
                keyboardType="phone-pad"
              />

              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                placeholder="email@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Dirección</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.direccion}
                onChangeText={(text) => setFormData({ ...formData, direccion: text })}
                placeholder="Dirección completa"
                multiline
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveCliente}>
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.saveButtonGradient}
                >
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </LinearGradient>
              </TouchableOpacity>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 15,
    paddingHorizontal: 15,
    borderRadius: 10,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  clienteCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clienteAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  clienteInitial: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  clienteInfo: {
    flex: 1,
  },
  clienteNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  clienteDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  clienteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pedidosBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4A90E220',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  pedidosText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
  },
  clienteActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 15,
  },
  actionButton: {
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

