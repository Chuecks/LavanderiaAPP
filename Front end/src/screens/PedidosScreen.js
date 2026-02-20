import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { obtenerPedidos, actualizarEstadoPedido } from '../services/pedido.service';
import { useFocusEffect } from '@react-navigation/native';

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  try {
    // Intentar parsear como ISO string o timestamp
    let date;
    if (typeof fecha === 'string') {
      date = new Date(fecha);
    } else if (typeof fecha === 'number') {
      date = new Date(fecha);
    } else if (fecha instanceof Date) {
      date = fecha;
    } else {
      return String(fecha);
    }

    // Validar que sea una fecha válida
    if (isNaN(date.getTime())) {
      return String(fecha);
    }

    return date.toLocaleDateString('es-UY', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.log('Error al formatear fecha:', fecha, error);
    return String(fecha);
  }
};

const formatearNumeroPedido = (numero) => {
  const numeroParseado = Number(numero);
  if (Number.isFinite(numeroParseado) && numeroParseado > 0) {
    return numeroParseado;
  }
  return numero;
};

export default function PedidosScreen() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);

  // Cargar pedidos cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadPedidos();
    }, [])
  );

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await obtenerPedidos();
      setPedidos(data);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completado':
        return '#50C878';
      case 'En Proceso':
        return '#F5A623';
      case 'Pendiente':
        return '#E94B3C';
      default:
        return '#666';
    }
  };

  const handleChangeEstado = async (pedido, nuevoEstado) => {
    try {
      setLoading(true);
      await actualizarEstadoPedido(pedido._id || pedido.id, { estado: nuevoEstado });
      setPedidos(pedidos.map(p =>
        (p._id === pedido._id || p.id === pedido.id) ? { ...p, estado: nuevoEstado } : p
      ));
      setSelectedPedido({ ...selectedPedido, estado: nuevoEstado });
      setModalVisible(false);
      Alert.alert('Éxito', `Estado cambiado a ${nuevoEstado}`);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cambiar el estado del pedido');
    } finally {
      setLoading(false);
    }
  };

  const openPedidoDetails = (pedido) => {
    setSelectedPedido(pedido);
    setModalVisible(true);
  };

  const handleNuevoPedido = () => {
    Alert.alert('Nuevo Pedido', 'Funcionalidad en desarrollo');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Pedidos</Text>
        </View>
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#4A90E2" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Pedidos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNuevoPedido}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {pedidos.length === 0 ? (
        <View style={[styles.content, { justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name="document-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>No hay pedidos</Text>
          <Text style={styles.emptySubtext}>Los pedidos aparecerán aquí</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
        {pedidos.map((pedido) => (
          <TouchableOpacity
            key={pedido._id || pedido.id}
            style={styles.pedidoCard}
            onPress={() => openPedidoDetails(pedido)}
          >
            <View style={styles.pedidoHeader}>
              <View style={styles.pedidoHeaderLeft}>
                <Text style={styles.pedidoNumero}>Pedido N°{formatearNumeroPedido(pedido.numero)}</Text>
              </View>
              <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(pedido.estado) }]}>
                <Text style={styles.estadoText}>{pedido.estado}</Text>
              </View>
            </View>

            <View style={styles.pedidoInfo}>
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{pedido.cliente}</Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="shirt-outline" size={16} color="#666" />
                <Text style={styles.infoText}>{pedido.servicios.length} servicio(s)</Text>
              </View>
            </View>

            <View style={styles.pedidoFooter}>
              <Text style={styles.totalText}>Total: ${pedido.total.toLocaleString()}</Text>
              <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
            </View>
          </TouchableOpacity>
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
            {selectedPedido && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>dadPedido N°{formatearNumeroPedido(selectedPedido.numero)}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Cliente</Text>
                    <Text style={styles.detailValue}>{selectedPedido.cliente}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Servicios</Text>
                    {selectedPedido.servicios.map((servicio, index) => (
                      <Text key={index} style={styles.detailValue}>• {servicio}</Text>
                    ))}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(selectedPedido.estado) }]}>
                      <Text style={styles.estadoText}>{selectedPedido.estado}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Fecha de Entrega</Text>
                    <Text style={styles.detailValue}>
                      {formatearFecha(selectedPedido.fechaEntrega || selectedPedido.horarioEntrega || selectedPedido.deliveryDate || selectedPedido.fecha) || 'No especificada'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.totalValue}>${selectedPedido.total.toLocaleString()}</Text>
                  </View>

                  <View style={styles.actionsSection}>
                    <Text style={styles.actionsTitle}>Cambiar Estado</Text>
                    <View style={styles.estadoButtons}>
                    <TouchableOpacity
                      style={[styles.estadoButton, selectedPedido.estado === 'Pendiente' && styles.estadoButtonActive]}
                      onPress={() => handleChangeEstado(selectedPedido, 'Pendiente')}
                    >
                      <Text style={styles.estadoButtonText}>Pendiente</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.estadoButton, selectedPedido.estado === 'En Proceso' && styles.estadoButtonActive]}
                      onPress={() => handleChangeEstado(selectedPedido, 'En Proceso')}
                    >
                      <Text style={styles.estadoButtonText}>En Proceso</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.estadoButton, selectedPedido.estado === 'Completado' && styles.estadoButtonActive]}
                      onPress={() => handleChangeEstado(selectedPedido, 'Completado')}
                    >
                      <Text style={styles.estadoButtonText}>Completado</Text>
                    </TouchableOpacity>
                    </View>
                  </View>
                </ScrollView>
              </>
            )}
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
  content: {
    flex: 1,
    padding: 15,
  },
  pedidoCard: {
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
  pedidoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    gap: 10,
  },
  pedidoHeaderLeft: {
    flex: 1,
  },
  pedidoNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  pedidoFecha: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  estadoBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  estadoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  pedidoInfo: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  pedidoFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4A90E2',
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
  modalBody: {
    marginTop: 10,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  actionsSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  estadoButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  estadoButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  estadoButtonActive: {
    backgroundColor: '#4A90E2',
  },
  estadoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});

