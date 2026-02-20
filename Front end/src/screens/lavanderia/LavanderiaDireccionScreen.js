import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { getMiPerfilLavanderia, actualizarDireccionLavanderia } from '../../services/lavanderia.service';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas', 'Canelones', 'Cerro Largo', 'Colonia', 'Durazno', 'Flores', 'Florida',
  'Lavalleja', 'Maldonado', 'Montevideo', 'Paysandú', 'Río Negro', 'Rivera', 'Rocha',
  'Salto', 'San José', 'Soriano', 'Tacuarembó', 'Treinta y Tres',
];

function formatDireccion(perfil) {
  if (!perfil) return '';
  const parts = [
    perfil.calle,
    perfil.numeroPuerta,
    perfil.numeroApartamento ? `Apt. ${perfil.numeroApartamento}` : null,
    perfil.ciudad,
    perfil.departamento,
    perfil.codigoPostal ? `CP ${perfil.codigoPostal}` : null,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function LavanderiaDireccionScreen({ navigation }) {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    calle: '',
    numeroPuerta: '',
    numeroApartamento: '',
    ciudad: '',
    departamento: '',
    codigoPostal: '',
  });
  const [departamentoModalVisible, setDepartamentoModalVisible] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const data = await getMiPerfilLavanderia();
      setPerfil(data);
      setForm({
        calle: data.calle || '',
        numeroPuerta: data.numeroPuerta || '',
        numeroApartamento: data.numeroApartamento || '',
        ciudad: data.ciudad || '',
        departamento: data.departamento || '',
        codigoPostal: data.codigoPostal || '',
      });
    } catch (error) {
      console.error('Error al cargar dirección:', error);
      Alert.alert('Error', 'No se pudo cargar la dirección.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  const abrirEditar = () => {
    if (perfil) {
      setForm({
        calle: perfil.calle || '',
        numeroPuerta: perfil.numeroPuerta || '',
        numeroApartamento: perfil.numeroApartamento || '',
        ciudad: perfil.ciudad || '',
        departamento: perfil.departamento || '',
        codigoPostal: perfil.codigoPostal || '',
      });
    }
    setModalVisible(true);
  };

  const validar = () => {
    if (!form.calle?.trim() || !form.numeroPuerta?.trim() || !form.ciudad?.trim() || !form.departamento || !form.codigoPostal?.trim()) {
      Alert.alert('Campos requeridos', 'Completa calle, n° puerta, ciudad, departamento y código postal.');
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (!validar()) return;
    setSaving(true);
    try {
      await actualizarDireccionLavanderia({
        calle: form.calle.trim(),
        numeroPuerta: form.numeroPuerta.trim(),
        numeroApartamento: (form.numeroApartamento || '').trim(),
        ciudad: form.ciudad.trim(),
        departamento: form.departamento,
        codigoPostal: form.codigoPostal.trim(),
      });
      setModalVisible(false);
      await cargar();
      Alert.alert('Listo', 'Dirección actualizada correctamente.');
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo actualizar la dirección.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }

  const direccionTexto = formatDireccion(perfil);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi dirección</Text>
        <Text style={styles.headerSubtitle}>Dirección del local</Text>
      </LinearGradient>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner}>
        <View style={styles.card}>
          <View style={styles.cardIconWrap}>
            <Ionicons name="location" size={32} color="#4A90E2" />
          </View>
          <Text style={styles.cardLabel}>Dirección actual</Text>
          <Text style={styles.cardAddress}>{direccionTexto || 'Sin dirección registrada'}</Text>
          <TouchableOpacity style={styles.changeButton} onPress={abrirEditar}>
            <Ionicons name="pencil-outline" size={20} color="#fff" />
            <Text style={styles.changeButtonText}>Cambiar dirección</Text>
          </TouchableOpacity>
        </View>
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
                Cambiar dirección
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.form}>
              <View style={styles.row}>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Calle </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Nombre de la calle"
                    value={form.calle}
                    onChangeText={(value) => setForm((f) => ({ ...f, calle: value }))}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>N° de puerta </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="123"
                    value={form.numeroPuerta}
                    onChangeText={(value) => setForm((f) => ({ ...f, numeroPuerta: value }))}
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
                    value={form.numeroApartamento}
                    onChangeText={(value) => setForm((f) => ({ ...f, numeroApartamento: value }))}
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={styles.label}>Ciudad </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ciudad"
                    value={form.ciudad}
                    onChangeText={(value) => setForm((f) => ({ ...f, ciudad: value }))}
                  />
                </View>
              </View>

              <Text style={styles.label}>Departamento </Text>
              <View style={styles.selectContainer}>
                <Ionicons name="location-outline" size={20} color="#666" style={styles.selectIcon} />
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setDepartamentoModalVisible(true)}
                >
                  <Text style={[styles.selectText, !form.departamento && styles.selectPlaceholder]}>
                    {form.departamento || 'Seleccione'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Código postal </Text>
              <TextInput
                style={styles.input}
                placeholder="11000"
                value={form.codigoPostal}
                onChangeText={(value) => setForm((f) => ({ ...f, codigoPostal: value }))}
                keyboardType="numeric"
              />

              <TouchableOpacity style={styles.saveButton} onPress={guardar} disabled={saving}>
                <LinearGradient
                  colors={['#4A90E2', '#357ABD']}
                  style={styles.saveButtonGradient}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>Guardar</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={departamentoModalVisible} transparent animationType="slide" onRequestClose={() => setDepartamentoModalVisible(false)}>
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerContent}>
            <View style={styles.pickerHeader}>
              <Text style={styles.modalTitle}>Departamento</Text>
              <TouchableOpacity onPress={() => setDepartamentoModalVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {DEPARTAMENTOS_URUGUAY.map((depto) => (
                <TouchableOpacity
                  key={depto}
                  style={[styles.pickerItem, form.departamento === depto && styles.pickerItemSelected]}
                  onPress={() => {
                    setForm((f) => ({ ...f, departamento: depto }));
                    setDepartamentoModalVisible(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{depto}</Text>
                  {form.departamento === depto && <Ionicons name="checkmark" size={20} color="#4A90E2" />}
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
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: { marginTop: 12, fontSize: 16, color: '#666' },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  backButtonText: { color: '#fff', fontSize: 16, marginLeft: 6 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  content: { flex: 1 },
  contentInner: { padding: 20, paddingBottom: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(74,144,226,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardLabel: { fontSize: 14, fontWeight: '600', color: '#666', marginBottom: 8 },
  cardAddress: { fontSize: 16, color: '#333', textAlign: 'center', marginBottom: 20, lineHeight: 24 },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    gap: 8,
  },
  changeButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
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
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pickerList: { padding: 12, maxHeight: 320 },
  pickerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
  },
  pickerItemSelected: { backgroundColor: 'rgba(74,144,226,0.15)' },
  pickerItemText: { fontSize: 16, color: '#333' },
});
