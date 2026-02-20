import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerEstadisticas, obtenerPedidos, reasignarPedidoRechazado } from '../services/pedido.service';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const KEY_RECHAZOS_VISTOS = 'pedidosRechazoVistos';

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    confirmados: 0,
    enProceso: 0,
    completados: 0
  });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pedidosRechazados, setPedidosRechazados] = useState([]);
  const [rechazosVistos, setRechazosVistos] = useState([]);
  const [rechazosVistosListos, setRechazosVistosListos] = useState(false);
  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [pedidoRechazoActual, setPedidoRechazoActual] = useState(null);
  const [loadingReasignar, setLoadingReasignar] = useState(false);

  useEffect(() => {
    loadUserData();
    loadData();
  }, []);

  // Cargar lista de rechazos ya mostrados (solo una vez por pedido)
  useEffect(() => {
    (async () => {
      try {
        const data = await AsyncStorage.getItem(KEY_RECHAZOS_VISTOS);
        const list = data ? JSON.parse(data) : [];
        if (Array.isArray(list)) setRechazosVistos(list);
      } catch (e) {
        console.error('Error al cargar rechazos vistos:', e);
      } finally {
        setRechazosVistosListos(true);
      }
    })();
  }, []);

  const marcarRechazoVisto = (pedidoId) => {
    if (!pedidoId) return;
    const idStr = String(pedidoId);
    setRechazosVistos((prev) => {
      const next = prev.includes(idStr) ? prev : [...prev, idStr];
      AsyncStorage.setItem(KEY_RECHAZOS_VISTOS, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  // Recargar datos cuando la pantalla recibe foco
  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        setUserData(JSON.parse(data));
      }
    } catch (error) {
      console.error('Error al cargar datos del usuario:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // Cargar estadísticas (defensivo: primera vez tras registro puede fallar o tardar el token)
      try {
        const stats = await obtenerEstadisticas();
        if (stats && typeof stats === 'object') {
          setEstadisticas({
            total: stats.total ?? 0,
            pendientes: stats.pendientes ?? 0,
            confirmados: stats.confirmados ?? 0,
            enProceso: stats.enProceso ?? 0,
            completados: stats.completados ?? 0
          });
        }
      } catch (e) {
        console.error('Error al cargar estadísticas:', e);
      }

      // Cargar pedidos recientes (defensivo: asegurar que sea array)
      try {
        const pedidos = await obtenerPedidos();
        const lista = Array.isArray(pedidos) ? pedidos : [];
        const pedidosFormateados = lista.slice(0, 3).map((pedido, index) => ({
          id: pedido._id,
          numero: index + 1,
          servicio: (pedido.servicio && pedido.servicio.nombre) ? pedido.servicio.nombre : 'Servicio',
          estado: mapearEstado(pedido.estado),
          fecha: calcularFechaRelativa(pedido.createdAt || Date.now())
        }));
        setPedidosRecientes(pedidosFormateados);
        const rechazados = lista.filter((p) => p.estado === 'cancelado' && p.rechazadoPorLavanderia === true);
        setPedidosRechazados(rechazados);
      } catch (e) {
        console.error('Error al cargar pedidos:', e);
        setPedidosRecientes([]);
        setPedidosRechazados([]);
      }
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

  const getColorPorEstado = (estado) => {
    switch (estado) {
      case 'Completado': return '#50C878';
      case 'Confirmado':
      case 'En Proceso': return estado === 'Confirmado' ? '#F5A623' : '#4A90E2';
      case 'Cancelado': return '#666';
      case 'Pendiente':
      default: return '#E94B3C';
    }
  };

  const calcularFechaRelativa = (fecha) => {
    const ahora = new Date();
    const fechaPedido = new Date(fecha);
    const diffMs = ahora - fechaPedido;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `Hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
    } else {
      return fechaPedido.toLocaleDateString('es-UY');
    }
  };

  const formatearNumeroPedido = (numero) => {
    const numeroParseado = Number(numero);
    if (Number.isFinite(numeroParseado) && numeroParseado > 0) {
      return numeroParseado;
    }
    return numero;
  };

  // Orden: arriba izq Pendientes, arriba der Confirmados, abajo izq En proceso, abajo der Completados
  // filterForMisPedidos debe coincidir con los filtros de MisPedidosScreen: Pendiente, Confirmado, En Proceso, Completado
  const stats = [
    { label: 'Pendientes', value: estadisticas.pendientes.toString(), icon: 'hourglass', color: '#E94B3C', filterForMisPedidos: 'Pendiente' },
    { label: 'Confirmados', value: estadisticas.confirmados.toString(), icon: 'checkmark-circle', color: '#F5A623', filterForMisPedidos: 'Confirmado' },
    { label: 'En Proceso', value: estadisticas.enProceso.toString(), icon: 'time', color: '#4A90E2', filterForMisPedidos: 'En Proceso' },
    { label: 'Completados', value: estadisticas.completados.toString(), icon: 'checkmark-done-circle', color: '#50C878', filterForMisPedidos: 'Completado' },
  ];

  const handleStatPress = (filterForMisPedidos) => {
    navigation.navigate('Mis Pedidos', { initialFilter: filterForMisPedidos });
  };

  const quickActions = [
    { title: 'Servicios', icon: 'shirt', color: '#4A90E2', screen: 'Servicios' },
    { title: 'Direcciones', icon: 'location', color: '#F5A623', screen: 'Direcciones' },
    { title: 'Mis Pedidos', icon: 'list', color: '#50C878', screen: 'Mis Pedidos' },
    { title: 'Perfil', icon: 'person', color: '#E94B3C', screen: 'Perfil' },
  ];

  useEffect(() => {
    if (!rechazosVistosListos || pedidosRechazados.length === 0) return;
    const siguiente = pedidosRechazados.find((p) => !rechazosVistos.includes(String(p._id)));
    if (siguiente) {
      setPedidoRechazoActual(siguiente);
      setModalRechazoVisible(true);
    } else {
      setModalRechazoVisible(false);
      setPedidoRechazoActual(null);
    }
  }, [rechazosVistosListos, pedidosRechazados, rechazosVistos]);

  const cerrarModalRechazo = (pedidoId) => {
    if (pedidoId) marcarRechazoVisto(pedidoId);
    const idsVistos = pedidoId ? [...rechazosVistos, String(pedidoId)] : rechazosVistos;
    const siguiente = pedidosRechazados.find((p) => !idsVistos.includes(String(p._id)));
    if (siguiente) setPedidoRechazoActual(siguiente);
    else {
      setModalRechazoVisible(false);
      setPedidoRechazoActual(null);
    }
  };

  const handleReasignarPedido = async () => {
    if (!pedidoRechazoActual) return;
    setLoadingReasignar(true);
    const idActual = pedidoRechazoActual._id;
    try {
      const res = await reasignarPedidoRechazado(idActual);
      // No marcar como visto: si la nueva lavandería también rechaza, debe volver a aparecer el aviso (mismo pedido _id)
      setModalRechazoVisible(false);
      setPedidoRechazoActual(null);
      loadData();
      Alert.alert('Listo', res.mensaje || 'Pedido reasignado a otra lavandería. Aparecerá como pendiente para que la acepten.');
    } catch (err) {
      const codigo = err.codigo || (err.response && err.response.data && err.response.data.codigo);
      const mensaje = codigo === 'NO_OTRA_LAVANDERIA_CERCANA'
        ? 'No se pudo realizar el pedido ya que no cuenta con otra lavandería cercana.'
        : (err.message || 'No se pudo reasignar el pedido.');
      Alert.alert('Aviso', mensaje);
      marcarRechazoVisto(idActual);
      const newVistos = [...rechazosVistos, String(idActual)];
      const siguiente = pedidosRechazados.find((p) => !newVistos.includes(String(p._id)));
      if (siguiente) setPedidoRechazoActual(siguiente);
      else {
        setModalRechazoVisible(false);
        setPedidoRechazoActual(null);
      }
    } finally {
      setLoadingReasignar(false);
    }
  };

  const handleEntendidoRechazo = () => {
    if (pedidoRechazoActual) marcarRechazoVisto(pedidoRechazoActual._id);
    const idsVistos = pedidoRechazoActual ? [...rechazosVistos, String(pedidoRechazoActual._id)] : rechazosVistos;
    const siguiente = pedidosRechazados.find((p) => !idsVistos.includes(String(p._id)));
    if (siguiente) {
      setPedidoRechazoActual(siguiente);
    } else {
      setModalRechazoVisible(false);
      setPedidoRechazoActual(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <Text style={styles.headerTitle}>
          Bienvenido{userData?.nombre ? `, ${userData.nombre.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.headerSubtitle}>Gestiona tus pedidos de lavandería</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <TouchableOpacity
              key={index}
              style={styles.statCard}
              onPress={() => handleStatPress(stat.filterForMisPedidos)}
              activeOpacity={0.7}
            >
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen, action.params || {})}
              >
                <LinearGradient
                  colors={[action.color, `${action.color}CC`]}
                  style={styles.actionGradient}
                >
                  <Ionicons name={action.icon} size={32} color="#fff" />
                  <Text style={styles.actionTitle}>{action.title}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mis Pedidos Recientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Mis Pedidos')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#4A90E2" />
              <Text style={styles.loadingText}>Cargando pedidos...</Text>
            </View>
          ) : pedidosRecientes.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="list-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>No tienes pedidos aún</Text>
              <Text style={styles.emptySubtext}>Solicita tu primer servicio</Text>
            </View>
          ) : (
            pedidosRecientes.map((pedido) => (
              <TouchableOpacity
                key={pedido.id}
                style={styles.orderCard}
                onPress={() => navigation.navigate('Mis Pedidos')}
              >
                <View style={styles.orderInfo}>
                  <Text style={styles.orderNumber}>Pedido N°{formatearNumeroPedido(pedido.numero)}</Text>
                  <Text style={styles.orderService}>{pedido.servicio}</Text>
                  <Text style={styles.orderDate}>{pedido.fecha}</Text>
                </View>
                <View style={styles.orderStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getColorPorEstado(pedido.estado) }
                  ]}>
                    <Text style={styles.statusText}>{pedido.estado}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>

      <Modal visible={modalRechazoVisible} transparent animationType="fade">
        <View style={styles.modalRechazoOverlay}>
          <View style={styles.modalRechazoContent}>
            <View style={styles.modalRechazoIconWrap}>
              <Ionicons name="alert-circle" size={48} color="#E94B3C" />
            </View>
            <Text style={styles.modalRechazoTitle}>Pedido rechazado</Text>
            <Text style={styles.modalRechazoText}>
              La lavandería rechazó tu pedido. ¿Deseas intentar con la siguiente lavandería más cercana?
            </Text>
            <View style={styles.modalRechazoButtons}>
              <TouchableOpacity
                style={styles.modalRechazoBtnEntendido}
                onPress={handleEntendidoRechazo}
                disabled={loadingReasignar}
              >
                <Text style={styles.modalRechazoBtnEntendidoText}>Entendido</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalRechazoBtnReasignar}
                onPress={handleReasignarPedido}
                disabled={loadingReasignar}
              >
                {loadingReasignar ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalRechazoBtnReasignarText}>Intentar con otra lavandería</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
    padding: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: (width - 45) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
    width: (width - 45) / 2,
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionGradient: {
    padding: 20,
    alignItems: 'center',
    borderRadius: 12,
  },
  actionTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  orderInfo: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  seeAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  orderService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  orderDate: {
    fontSize: 12,
    color: '#999',
  },
  orderStatus: {
    marginLeft: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  modalRechazoOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalRechazoContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalRechazoIconWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalRechazoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalRechazoText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalRechazoButtons: {
  },
  modalRechazoBtnEntendido: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalRechazoBtnEntendidoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  modalRechazoBtnReasignar: {
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    alignItems: 'center',
  },
  modalRechazoBtnReasignarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

