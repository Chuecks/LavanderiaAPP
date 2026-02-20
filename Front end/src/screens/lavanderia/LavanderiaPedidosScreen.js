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
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import {
  listarPedidosLavanderia,
  aceptarPedidoLavanderia,
  rechazarPedidoLavanderia,
  cancelarPedidoLavanderia,
  pasarAEnProcesoLavanderia,
  pasarACompletadoLavanderia,
} from '../../services/pedido.service';

const ESTADOS_MOSTRAR = ['pendiente', 'confirmado', 'en_proceso', 'completado'];

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

export default function LavanderiaPedidosScreen({ navigation }) {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('Pendientes'); // Pendientes | Confirmados | En proceso | Completado
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState(null);
  const [accionandoId, setAccionandoId] = useState(null);

  const cargarPedidos = useCallback(async () => {
    try {
      const data = await listarPedidosLavanderia();
      const list = Array.isArray(data) ? data : [];
      setPedidos(list.filter((p) => ESTADOS_MOSTRAR.includes(p.estado)));
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      Alert.alert('Error', 'No se pudieron cargar los pedidos. Intenta de nuevo.');
      setPedidos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    cargarPedidos();
  }, [cargarPedidos]);

  useFocusEffect(
    useCallback(() => {
      cargarPedidos();
    }, [cargarPedidos])
  );

  const onRefresh = () => {
    setRefreshing(true);
    cargarPedidos();
  };

  const mapearEstado = (estado) => {
    const map = {
      pendiente: 'Pendiente',
      confirmado: 'Confirmado',
      en_proceso: 'En proceso',
      completado: 'Completado',
    };
    return map[estado] || estado;
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'Completado':
        return '#50C878';
      case 'En proceso':
      case 'Confirmado':
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
        return 'checkmark-done-circle';
      case 'En proceso':
        return 'time';
      case 'Confirmado':
        return 'checkmark-circle';
      case 'Pendiente':
        return 'hourglass';
      default:
        return 'help-circle';
    }
  };

  const getFilteredPedidos = () => {
    switch (filter) {
      case 'Pendientes':
        return pedidos.filter((p) => p.estado === 'pendiente');
      case 'Confirmados':
        return pedidos.filter((p) => p.estado === 'confirmado');
      case 'En proceso':
        return pedidos.filter((p) => p.estado === 'en_proceso');
      case 'Completado':
        return pedidos.filter((p) => p.estado === 'completado');
      default:
        return pedidos;
    }
  };
  const filteredPedidos = getFilteredPedidos();

  const openDetalle = (pedido) => {
    setSelectedPedido(pedido);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPedido(null);
  };

  const handleAceptar = () => {
    if (!selectedPedido) return;
    Alert.alert(
      'Aceptar pedido',
      `¿Aceptar el pedido de ${selectedPedido.usuario?.nombre || 'cliente'}? El cliente lo verá como confirmado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: async () => {
            setAccionandoId(selectedPedido._id);
            try {
              await aceptarPedidoLavanderia(selectedPedido._id);
              closeModal();
              await cargarPedidos();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo aceptar el pedido.');
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ]
    );
  };

  const handleRechazar = () => {
    if (!selectedPedido) return;
    Alert.alert(
      'Rechazar pedido',
      `¿Rechazar el pedido de ${selectedPedido.usuario?.nombre || 'cliente'}? Desaparecerá de tu lista.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: async () => {
            setAccionandoId(selectedPedido._id);
            try {
              await rechazarPedidoLavanderia(selectedPedido._id);
              closeModal();
              await cargarPedidos();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo rechazar el pedido.');
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ]
    );
  };

  const handlePasarAEnProceso = () => {
    if (!selectedPedido) return;
    Alert.alert(
      'Pasar a en proceso',
      '¿Comenzar a trabajar en este pedido? El cliente lo verá en "En proceso" y dejará de aparecer en Confirmados.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, en proceso',
          onPress: async () => {
            setAccionandoId(selectedPedido._id);
            try {
              await pasarAEnProcesoLavanderia(selectedPedido._id);
              closeModal();
              await cargarPedidos();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo actualizar.');
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ]
    );
  };

  const handlePasarACompletado = () => {
    if (!selectedPedido) return;
    Alert.alert(
      'Marcar como completado',
      '¿Este pedido ya está terminado y entregado? Quedará como completado de forma permanente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, completado',
          onPress: async () => {
            setAccionandoId(selectedPedido._id);
            try {
              await pasarACompletadoLavanderia(selectedPedido._id);
              closeModal();
              await cargarPedidos();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo completar.');
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ]
    );
  };

  const handleCancelarPedido = () => {
    if (!selectedPedido) return;
    Alert.alert(
      'Cancelar pedido',
      '¿Cancelar este pedido? El cliente recibirá un aviso y podrá intentar con otra lavandería si lo desea.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, cancelar',
          style: 'destructive',
          onPress: async () => {
            setAccionandoId(selectedPedido._id);
            try {
              await cancelarPedidoLavanderia(selectedPedido._id);
              closeModal();
              await cargarPedidos();
            } catch (e) {
              Alert.alert('Error', e.message || 'No se pudo cancelar el pedido.');
            } finally {
              setAccionandoId(null);
            }
          },
        },
      ]
    );
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    const d = new Date(fecha);
    return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDireccion = (dir) => {
    if (!dir) return '-';
    const parts = [
      dir.calle,
      dir.numeroPuerta,
      dir.numeroApartamento ? `Apt. ${dir.numeroApartamento}` : null,
      dir.ciudad,
      dir.departamento,
      dir.codigoPostal ? `CP ${dir.codigoPostal}` : null,
    ].filter(Boolean);
    return parts.join(', ');
  };

  const llamarTelefono = (telefono) => {
    if (!telefono || !telefono.trim()) return;
    const num = telefono.replace(/\s/g, '');
    Linking.openURL(`tel:${num}`).catch(() => {});
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
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Pedidos</Text>
        </View>
      </LinearGradient>

      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['Pendientes', 'Confirmados', 'En proceso', 'Completado'].map((filtro) => (
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
            {filter === 'Pendientes' && 'No hay pedidos pendientes'}
            {filter === 'Confirmados' && 'No hay pedidos confirmados'}
            {filter === 'En proceso' && 'No hay pedidos en proceso'}
            {filter === 'Completado' && 'No hay pedidos completados'}
          </Text>
          <Text style={styles.emptySubtext}>
            {filter === 'Pendientes' && 'Los nuevos pedidos asignados a tu lavandería aparecerán aquí'}
            {filter === 'Confirmados' && 'Los pedidos que aceptes se verán aquí'}
            {filter === 'En proceso' && 'Al pasar un pedido confirmado a "en proceso" aparecerá aquí'}
            {filter === 'Completado' && 'Los pedidos que marques como completados quedarán aquí'}
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentInner}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4A90E2']} />
          }
        >
          {filteredPedidos.map((pedido, index) => {
            const estadoLabel = mapearEstado(pedido.estado);
            const usuario = pedido.usuario || {};
            return (
              <TouchableOpacity
                key={pedido._id}
                style={styles.pedidoCard}
                onPress={() => openDetalle(pedido)}
                activeOpacity={0.7}
              >
                <View style={styles.pedidoHeader}>
                  <View style={styles.pedidoLeft}>
                    <View
                      style={[
                        styles.estadoIconContainer,
                        { backgroundColor: `${getEstadoColor(estadoLabel)}20` },
                      ]}
                    >
                      <Ionicons
                        name={getEstadoIcon(estadoLabel)}
                        size={24}
                        color={getEstadoColor(estadoLabel)}
                      />
                    </View>
                    <View>
                      <Text style={styles.pedidoNumero}>
                        {usuario.nombre || 'Cliente'}
                      </Text>
                      <Text style={styles.pedidoFecha}>
                        {formatearFecha(pedido.createdAt)}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.estadoBadge,
                      { backgroundColor: getEstadoColor(estadoLabel) },
                    ]}
                  >
                    <Text style={styles.estadoText}>{estadoLabel}</Text>
                  </View>
                </View>
                <View style={styles.pedidoInfo}>
                  <View style={styles.infoRow}>
                    <Ionicons name="shirt-outline" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {pedido.servicio?.nombre || 'Servicio'}
                    </Text>
                  </View>
                  {pedido.horarioEntrega && (
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={16} color="#666" />
                      <Text style={styles.infoText}>
                        Entrega: {pedido.horarioEntrega}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.pedidoFooter}>
                  <Text style={styles.totalText}>
                    Total: $
                    {(pedido.servicio?.precio != null
                      ? Number(pedido.servicio.precio)
                      : 0
                    ).toLocaleString()}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#4A90E2" />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedPedido && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>
                    {selectedPedido.usuario?.nombre || 'Cliente'}
                  </Text>
                  <TouchableOpacity onPress={closeModal}>
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Estado</Text>
                    <View
                      style={[
                        styles.estadoBadge,
                        {
                          backgroundColor: getEstadoColor(
                            mapearEstado(selectedPedido.estado)
                          ),
                        },
                      ]}
                    >
                      <Text style={styles.estadoText}>
                        {mapearEstado(selectedPedido.estado)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Servicio</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.servicio?.nombre || '-'}
                    </Text>
                    {selectedPedido.servicio?.descripcion && (
                      <Text style={[styles.detailValue, styles.detailSecondary]}>
                        {selectedPedido.servicio.descripcion}
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Dirección de Recogida</Text>
                    <Text style={styles.detailValue}>
                      {formatDireccion(selectedPedido.direccionRecogida)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Dirección de Entrega</Text>
                    <Text style={styles.detailValue}>
                      {formatDireccion(selectedPedido.direccionEntrega)}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Horario de Recogida</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.horarioRecogida || '-'}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Horario de Entrega</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.horarioEntrega || '-'}
                    </Text>
                  </View>

                  {selectedPedido.notas ? (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Notas</Text>
                      <Text style={styles.detailValue}>
                        {selectedPedido.notas}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Cliente</Text>
                    <Text style={styles.detailValue}>
                      {selectedPedido.usuario?.nombre || '-'}
                    </Text>
                    {selectedPedido.usuario?.email && (
                      <Text style={[styles.detailValue, styles.detailSecondary]}>
                        {selectedPedido.usuario.email}
                      </Text>
                    )}
                    {selectedPedido.usuario?.telefono ? (
                      <TouchableOpacity
                        style={styles.telefonoRow}
                        onPress={() =>
                          llamarTelefono(selectedPedido.usuario.telefono)
                        }
                      >
                        <Ionicons name="call-outline" size={20} color="#4A90E2" />
                        <Text style={styles.telefonoText}>
                          {selectedPedido.usuario.telefono}
                        </Text>
                        <Text style={styles.telefonoHint}>(tocar para llamar)</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.detailValue, styles.detailSecondary]}>
                        Sin teléfono registrado
                      </Text>
                    )}
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Total</Text>
                    <Text style={styles.totalValue}>
                      $
                      {(selectedPedido.servicio?.precio != null
                        ? Number(selectedPedido.servicio.precio)
                        : 0
                      ).toLocaleString()}
                    </Text>
                  </View>

                  {selectedPedido.estado === 'pendiente' && (
                    <View style={styles.modalActions}>
                      <TouchableOpacity
                        style={styles.btnRechazar}
                        onPress={handleRechazar}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Rechazar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnAceptar}
                        onPress={handleAceptar}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Aceptar</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedPedido.estado === 'confirmado' && (
                    <View style={styles.modalActionsRow}>
                      <TouchableOpacity
                        style={styles.btnCancelarPedido}
                        onPress={handleCancelarPedido}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Cancelar pedido</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnEnProceso}
                        onPress={handlePasarAEnProceso}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="time-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Pasar a en proceso</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}

                  {selectedPedido.estado === 'en_proceso' && (
                    <View style={styles.modalActionsRow}>
                      <TouchableOpacity
                        style={styles.btnCancelarPedido}
                        onPress={handleCancelarPedido}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="close-circle-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Cancelar pedido</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.btnCompletado}
                        onPress={handlePasarACompletado}
                        disabled={!!accionandoId}
                      >
                        {accionandoId === selectedPedido._id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-done-circle-outline" size={22} color="#fff" />
                            <Text style={styles.btnText}>Marcar como completado</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  )}
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
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
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
  content: {
    flex: 1,
  },
  contentInner: {
    padding: 15,
    paddingBottom: 32,
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
    maxHeight: '85%',
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
  detailSecondary: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4A90E2',
  },
  telefonoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    marginLeft: 8,
    gap: 8,
  },
  telefonoText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  telefonoHint: {
    fontSize: 12,
    color: '#999',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  modalActionsSingle: {
    marginTop: 24,
    marginBottom: 10,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 10,
  },
  btnCancelarPedido: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#c62828',
    gap: 8,
  },
  btnEnProceso: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    gap: 8,
  },
  btnCompletado: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#50C878',
    gap: 8,
  },
  btnRechazar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#c62828',
    gap: 8,
  },
  btnAceptar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    gap: 8,
  },
  btnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});
