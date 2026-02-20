import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { obtenerPedidos } from '../services/pedido.service';
import { useFocusEffect } from '@react-navigation/native';

export default function MisPedidosScreen({ navigation, route }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [filter, setFilter] = useState(route?.params?.initialFilter ?? 'Todos'); // Todos, Pendiente, Confirmado, En Proceso, Completado

  useEffect(() => {
    loadPedidos();
  }, []);

  // Aplicar filtro cuando se navega desde Home con initialFilter (ej. al tocar Pendientes, Confirmados, etc.)
  useEffect(() => {
    const initial = route?.params?.initialFilter;
    if (initial && ['Todos', 'Pendiente', 'Confirmado', 'En Proceso', 'Completado'].includes(initial)) {
      setFilter(initial);
    }
  }, [route?.params?.initialFilter]);

  // Recargar pedidos cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadPedidos();
    }, [])
  );

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const pedidosData = await obtenerPedidos();
      
      // Transformar datos del backend al formato esperado
      const pedidosFormateados = pedidosData.map((pedido, index) => ({
        id: pedido._id,
        numero: String(index + 1).padStart(3, '0'),
        servicios: [pedido.servicio.nombre],
        total: pedido.servicio.precio,
        estado: mapearEstado(pedido.estado),
        fecha: new Date(pedido.createdAt).toLocaleDateString('es-UY'),
        fechaEntrega: pedido.horarioEntrega,
        pedidoCompleto: pedido // Guardar el pedido completo para el modal
      }));
      
      setPedidos(pedidosFormateados);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos. Por favor intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  const mapearEstado = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'confirmado': 'Confirmado',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completado':
        return '#50C878';
      case 'Confirmado':
      case 'En Proceso':
        return '#F5A623';
      case 'Pendiente':
        return '#E94B3C';
      default:
        return '#666';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'Completado':
        return 'checkmark-circle';
      case 'Confirmado':
      case 'En Proceso':
        return 'time';
      case 'Pendiente':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  const filteredPedidos = filter === 'Todos' 
    ? pedidos 
    : pedidos.filter(p => {
        const estadoMapeado = mapearEstado(p.pedidoCompleto?.estado || p.estado);
        return estadoMapeado === filter;
      });

  const openPedidoDetails = (pedido) => {
    setSelectedPedido(pedido);
    setModalVisible(true);
  };

  const handleNuevoPedido = () => {
    navigation?.navigate('Servicios');
  };

  const formatearNumeroPedido = (numero) => {
    const numeroParseado = Number(numero);
    if (Number.isFinite(numeroParseado) && numeroParseado > 0) {
      return numeroParseado;
    }
    return numero;
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const date = new Date(fecha);
    if (isNaN(date.getTime())) {
      return String(fecha);
    }
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
        <Text style={styles.loadingText}>Cargando pedidos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <Text style={styles.headerTitle}>Mis Pedidos</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleNuevoPedido}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Todos', 'Pendiente', 'Confirmado', 'En Proceso', 'Completado'].map((filtro) => (
            <TouchableOpacity
              key={filtro}
              style={[styles.filterButton, filter === filtro && styles.filterButtonActive]}
              onPress={() => setFilter(filtro)}
            >
              <Text style={[styles.filterText, filter === filtro && styles.filterTextActive]}>
                {filtro}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredPedidos.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="list-outline" size={80} color="#ccc" />
          <Text style={styles.emptyText}>
            {filter === 'Todos' 
              ? 'No tienes pedidos aún' 
              : `No tienes pedidos ${filter.toLowerCase()}s`}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'Todos' 
              ? 'Solicita un servicio para comenzar' 
              : 'Los pedidos con este estado aparecerán aquí'}
          </Text>
          {filter === 'Todos' && (
            <TouchableOpacity style={styles.emptyButton} onPress={handleNuevoPedido}>
              <Text style={styles.emptyButtonText}>Solicitar Servicio</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredPedidos.map((pedido) => (
            <TouchableOpacity
              key={pedido.id}
              style={styles.pedidoCard}
              onPress={() => openPedidoDetails(pedido)}
            >
              <View style={styles.pedidoHeader}>
                <View style={styles.pedidoLeft}>
                  <View style={[styles.estadoIconContainer, { backgroundColor: `${getEstadoColor(pedido.estado)}20` }]}>
                    <Ionicons name={getEstadoIcon(pedido.estado)} size={24} color={getEstadoColor(pedido.estado)} />
                  </View>
                  <View>
                    <Text style={styles.pedidoNumero}>Pedido N°{formatearNumeroPedido(pedido.numero)}</Text>
                    <Text style={styles.pedidoFecha}>{formatFecha(pedido.fecha)}</Text>
                  </View>
                </View>
                <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(pedido.estado) }]}>
                  <Text style={styles.estadoText}>{pedido.estado}</Text>
                </View>
              </View>

              <View style={styles.pedidoInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="shirt-outline" size={16} color="#666" />
                  <Text style={styles.infoText}>
                    {pedido.servicios.length} servicio{pedido.servicios.length > 1 ? 's' : ''}
                  </Text>
                </View>
                {pedido.fechaEntrega && (
                  <View style={styles.infoRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      Entrega: {formatFecha(pedido.fechaEntrega)}
                    </Text>
                  </View>
                )}
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
                  <Text style={styles.modalTitle}>Pedido N°{formatearNumeroPedido(selectedPedido.numero)}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <View style={[styles.estadoBadge, { backgroundColor: getEstadoColor(selectedPedido.estado) }]}>
                      <Text style={styles.estadoText}>{selectedPedido.estado}</Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Servicio</Text>
                    <View style={styles.servicioItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                      <Text style={styles.detailValue}>
                        {selectedPedido.pedidoCompleto?.servicio?.nombre || selectedPedido.servicios[0]}
                      </Text>
                    </View>
                    {selectedPedido.pedidoCompleto?.servicio?.descripcion && (
                      <Text style={[styles.detailValue, { marginLeft: 24, fontSize: 14, color: '#666' }]}>
                        {selectedPedido.pedidoCompleto.servicio.descripcion}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Dirección de Recogida</Text>
                    {selectedPedido.pedidoCompleto?.direccionRecogida && (
                      <Text style={styles.detailValue}>
                        {selectedPedido.pedidoCompleto.direccionRecogida.calle} {selectedPedido.pedidoCompleto.direccionRecogida.numeroPuerta}
                        {selectedPedido.pedidoCompleto.direccionRecogida.numeroApartamento ? `, Apt. ${selectedPedido.pedidoCompleto.direccionRecogida.numeroApartamento}` : ''}
                        {'\n'}{selectedPedido.pedidoCompleto.direccionRecogida.ciudad}, {selectedPedido.pedidoCompleto.direccionRecogida.departamento}
                        {'\n'}CP: {selectedPedido.pedidoCompleto.direccionRecogida.codigoPostal}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Dirección de Entrega</Text>
                    {selectedPedido.pedidoCompleto?.direccionEntrega && (
                      <Text style={styles.detailValue}>
                        {selectedPedido.pedidoCompleto.direccionEntrega.calle} {selectedPedido.pedidoCompleto.direccionEntrega.numeroPuerta}
                        {selectedPedido.pedidoCompleto.direccionEntrega.numeroApartamento ? `, Apt. ${selectedPedido.pedidoCompleto.direccionEntrega.numeroApartamento}` : ''}
                        {'\n'}{selectedPedido.pedidoCompleto.direccionEntrega.ciudad}, {selectedPedido.pedidoCompleto.direccionEntrega.departamento}
                        {'\n'}CP: {selectedPedido.pedidoCompleto.direccionEntrega.codigoPostal}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Horario de Recogida</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.pedidoCompleto?.horarioRecogida || selectedPedido.fechaEntrega}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Horario de Entrega</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.pedidoCompleto?.horarioEntrega || selectedPedido.fechaEntrega}
                    </Text>
                  </View>

                  {selectedPedido.pedidoCompleto?.notas && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>{selectedPedido.pedidoCompleto.notas}</Text>
                    </View>
                  )}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Fecha de Solicitud</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.pedidoCompleto?.createdAt 
                        ? formatFecha(selectedPedido.pedidoCompleto.createdAt)
                        : formatFecha(selectedPedido.fecha)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      ${(selectedPedido.pedidoCompleto?.servicio?.precio || selectedPedido.total).toLocaleString()}
                    </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
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
  filtersContainer: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 10,
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
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
    alignItems: 'center',
    marginBottom: 15,
  },
  pedidoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  estadoIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  pedidoNumero: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  pedidoFecha: {
    fontSize: 14,
    color: '#666',
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
    marginLeft: 8,
  },
  servicioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
});
