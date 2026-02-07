import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerEstadisticas, obtenerPedidos } from '../services/pedido.service';
import { useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [userData, setUserData] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    pendientes: 0,
    enProceso: 0,
    completados: 0
  });
  const [pedidosRecientes, setPedidosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
    loadData();
  }, []);

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
          numero: String(index + 1).padStart(3, '0'),
          servicio: (pedido.servicio && pedido.servicio.nombre) ? pedido.servicio.nombre : 'Servicio',
          estado: mapearEstado(pedido.estado),
          fecha: calcularFechaRelativa(pedido.createdAt || Date.now())
        }));
        setPedidosRecientes(pedidosFormateados);
      } catch (e) {
        console.error('Error al cargar pedidos:', e);
        setPedidosRecientes([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const mapearEstado = (estado) => {
    const estados = {
      'pendiente': 'Pendiente',
      'en_proceso': 'En Proceso',
      'completado': 'Completado',
      'cancelado': 'Cancelado'
    };
    return estados[estado] || estado;
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

  const stats = [
    { label: 'Mis Pedidos', value: estadisticas.total.toString(), icon: 'list', color: '#4A90E2' },
    { label: 'En Proceso', value: estadisticas.enProceso.toString(), icon: 'time', color: '#F5A623' },
    { label: 'Completados', value: estadisticas.completados.toString(), icon: 'checkmark-circle', color: '#50C878' },
    { label: 'Pendientes', value: estadisticas.pendientes.toString(), icon: 'hourglass', color: '#E94B3C' },
  ];

  const quickActions = [
    { title: 'Solicitar Servicio', icon: 'add-circle', color: '#4A90E2', screen: 'Servicios' },
    { title: 'Mis Pedidos', icon: 'list', color: '#50C878', screen: 'Mis Pedidos' },
    { title: 'Direcciones', icon: 'location', color: '#F5A623', screen: 'Direcciones' },
    { title: 'Mi Perfil', icon: 'person', color: '#E94B3C', screen: 'Perfil' },
  ];

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <Text style={styles.headerTitle}>
          Bienvenido{userData?.nombre ? `, ${userData.nombre.split(' ')[0]}` : ''}
        </Text>
        <Text style={styles.headerSubtitle}>Gestiona tus servicios de lavandería</Text>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: `${stat.color}20` }]}>
                <Ionicons name={stat.icon} size={24} color={stat.color} />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
                onPress={() => navigation.navigate(action.screen)}
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
                  <Text style={styles.orderNumber}>Pedido #{pedido.numero}</Text>
                  <Text style={styles.orderService}>{pedido.servicio}</Text>
                  <Text style={styles.orderDate}>{pedido.fecha}</Text>
                </View>
                <View style={styles.orderStatus}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: pedido.estado === 'Completado' ? '#50C878' : pedido.estado === 'En Proceso' ? '#F5A623' : '#E94B3C' }
                  ]}>
                    <Text style={styles.statusText}>{pedido.estado}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </View>
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
});

