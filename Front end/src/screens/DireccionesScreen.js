import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  obtenerDirecciones, 
  crearDireccion, 
  actualizarDireccion, 
  eliminarDireccion 
} from '../services/direccion.service';
import { useFocusEffect } from '@react-navigation/native';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
];

export default function DireccionesScreen({ navigation }) {
  const [direcciones, setDirecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [departamentoModalVisible, setDepartamentoModalVisible] = useState(false);
  const [editingDireccion, setEditingDireccion] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    calle: '',
    numeroPuerta: '',
    numeroApartamento: '',
    ciudad: '',
    departamento: '',
    codigoPostal: '',
  });

  useEffect(() => {
    loadDirecciones();
  }, []);

  // Recargar direcciones cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadDirecciones();
    }, [])
  );

  const loadDirecciones = async () => {
    try {
      setLoading(true);
      const direccionesData = await obtenerDirecciones();
      setDirecciones(direccionesData);
    } catch (error) {
      console.error('Error al cargar direcciones:', error);
      Alert.alert('Error', 'No se pudieron cargar las direcciones. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddDireccion = () => {
    setEditingDireccion(null);
    setFormData({
      nombre: '',
      calle: '',
      numeroPuerta: '',
      numeroApartamento: '',
      ciudad: '',
      departamento: '',
      codigoPostal: '',
    });
    setModalVisible(true);
  };

  const handleEditDireccion = (direccion) => {
    setEditingDireccion(direccion);
    setFormData({
      nombre: direccion.nombre || '',
      calle: direccion.calle || '',
      numeroPuerta: direccion.numeroPuerta || '',
      numeroApartamento: direccion.numeroApartamento || '',
      ciudad: direccion.ciudad || '',
      departamento: direccion.departamento || '',
      codigoPostal: direccion.codigoPostal || '',
    });
    setModalVisible(true);
  };

  const handleSaveDireccion = async () => {
    if (!formData.calle.trim() || !formData.numeroPuerta.trim() || !formData.ciudad.trim() || !formData.departamento || !formData.codigoPostal.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos requeridos (Calle, N° de puerta, Ciudad, Departamento y Código postal)');
      return;
    }

    try {
      const direccionData = {
        nombre: formData.nombre.trim() || 'Sin nombre',
        calle: formData.calle.trim(),
        numeroPuerta: formData.numeroPuerta.trim(),
        numeroApartamento: formData.numeroApartamento.trim(),
        ciudad: formData.ciudad.trim(),
        departamento: formData.departamento,
        codigoPostal: formData.codigoPostal.trim(),
      };

      if (editingDireccion) {
        // Actualizar dirección existente
        await actualizarDireccion(editingDireccion._id || editingDireccion.id, direccionData);
        Alert.alert('Éxito', 'Dirección actualizada');
      } else {
        // Crear nueva dirección
        await crearDireccion(direccionData);
        Alert.alert('Éxito', 'Dirección guardada');
      }

      setModalVisible(false);
      loadDirecciones(); // Recargar direcciones
    } catch (error) {
      console.error('Error al guardar dirección:', error);
      Alert.alert('Error', error.message || 'No se pudo guardar la dirección');
    }
  };

  const handleDeleteDireccion = (direccion) => {
    Alert.alert(
      'Eliminar Dirección',
      '¿Estás seguro de eliminar esta dirección?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarDireccion(direccion._id || direccion.id);
              Alert.alert('Éxito', 'Dirección eliminada');
              loadDirecciones(); // Recargar direcciones
            } catch (error) {
              console.error('Error al eliminar dirección:', error);
              Alert.alert('Error', error.message || 'No se pudo eliminar la dirección');
            }
          },
        },
      ]
    );
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
    return texto;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  // Verificar si viene de navegación stack o tab
  const canGoBack = navigation.canGoBack && navigation.canGoBack();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        {canGoBack && (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        )}
        <Text style={[styles.headerTitle, !canGoBack && styles.headerTitleCentered]}>Mis Direcciones</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddDireccion}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {direcciones.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No tienes direcciones guardadas</Text>
          <Text style={styles.emptySubtext}>Agrega una dirección para facilitar tus pedidos</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleAddDireccion}>
            <Text style={styles.emptyButtonText}>Agregar Dirección</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {direcciones.map((direccion) => (
            <View key={direccion._id || direccion.id} style={styles.direccionCard}>
              <View style={styles.direccionHeader}>
                <View style={styles.direccionIcon}>
                  <Ionicons name="location" size={24} color="#4A90E2" />
                </View>
                <View style={styles.direccionInfo}>
                  <Text style={styles.direccionNombre}>{direccion.nombre}</Text>
                  <Text style={styles.direccionTexto}>{formatDireccion(direccion)}</Text>
                  {direccion.codigoPostal && (
                    <Text style={styles.direccionCodigo}>CP: {direccion.codigoPostal}</Text>
                  )}
                </View>
              </View>
              <View style={styles.direccionActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEditDireccion(direccion)}
                >
                  <Ionicons name="pencil" size={20} color="#4A90E2" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDeleteDireccion(direccion)}
                >
                  <Ionicons name="trash" size={20} color="#E94B3C" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

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
                {editingDireccion ? 'Editar Dirección' : 'Nueva Dirección'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <Text style={styles.label}>Nombre (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Casa, Trabajo, etc."
                value={formData.nombre}
                onChangeText={(value) => handleInputChange('nombre', value)}
              />

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Calle *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre de la calle"
                    value={formData.calle}
                    onChangeText={(value) => handleInputChange('calle', value)}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>N° de puerta *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={formData.numeroPuerta}
                    onChangeText={(value) => handleInputChange('numeroPuerta', value)}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>N° apartamento</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Apt. 4B"
                    value={formData.numeroApartamento}
                    onChangeText={(value) => handleInputChange('numeroApartamento', value)}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Ciudad *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ciudad"
                    value={formData.ciudad}
                    onChangeText={(value) => handleInputChange('ciudad', value)}
                  />
                </View>
              </View>

              <Text style={styles.label}>Departamento *</Text>
              <View style={styles.selectContainer}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.selectIcon} />
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setDepartamentoModalVisible(true)}
                >
                  <Text style={[styles.selectText, !formData.departamento && styles.selectPlaceholder]}>
                    {formData.departamento || 'Seleccione'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Código postal *</Text>
              <TextInput
                style={styles.input}
                placeholder="11000"
                value={formData.codigoPostal}
                onChangeText={(value) => handleInputChange('codigoPostal', value)}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveDireccion}>
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

      {/* Modal de Selección de Departamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={departamentoModalVisible}
        onRequestClose={() => setDepartamentoModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.departamentoModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Departamento</Text>
              <TouchableOpacity onPress={() => setDepartamentoModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.departamentoList}>
              {DEPARTAMENTOS_URUGUAY.map((depto, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.departamentoItem,
                    formData.departamento === depto && styles.departamentoItemSelected
                  ]}
                  onPress={() => {
                    handleInputChange('departamento', depto);
                    setDepartamentoModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.departamentoItemText,
                    formData.departamento === depto && styles.departamentoItemTextSelected
                  ]}>
                    {depto}
                  </Text>
                  {formData.departamento === depto && (
                    <Ionicons name="checkmark" size={20} color="#4A90E2" />
                  )}
                </TouchableOpacity>
              ))}
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
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    marginLeft: 50,
  },
  headerTitleCentered: {
    marginLeft: 0,
    textAlign: 'center',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  emptyButton: {
    marginTop: 20,
    backgroundColor: '#4A90E2',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
    marginBottom: 15,
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
    marginBottom: 5,
  },
  direccionCodigo: {
    fontSize: 12,
    color: '#999',
  },
  direccionActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
    maxHeight: '90%',
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 50,
  },
  selectIcon: {
    marginRight: 10,
  },
  selectButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    color: '#999',
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
  departamentoModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  departamentoList: {
    marginTop: 10,
  },
  departamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  departamentoItemSelected: {
    backgroundColor: '#4A90E220',
  },
  departamentoItemText: {
    fontSize: 16,
    color: '#333',
  },
  departamentoItemTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
