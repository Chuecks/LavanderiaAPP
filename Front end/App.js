import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, Platform, Text } from 'react-native';
import { AuthContext } from './src/context/AuthContext';

// Error Boundary para web: si algo falla, mostramos el error en vez de pantalla en blanco
class AppErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error('AppErrorBoundary:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
          <Text style={{ fontSize: 18, color: '#c00', textAlign: 'center', marginBottom: 12 }}>Algo salió mal</Text>
          <Text style={{ fontSize: 14, color: '#666', textAlign: 'center' }}>{this.state.error?.message || 'Error desconocido'}</Text>
        </View>
      );
    }
    if (!this.props || this.props.children == null) return null;
    return this.props.children;
  }
}

// Screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import OlvideContrasenaScreen from './src/screens/OlvideContrasenaScreen';
import RegistroExitosoScreen from './src/screens/RegistroExitosoScreen';
import ContrasenaCambiadaScreen from './src/screens/ContrasenaCambiadaScreen';
import HomeScreen from './src/screens/HomeScreen';
import ServiciosScreen from './src/screens/ServiciosScreen';
import MisPedidosScreen from './src/screens/MisPedidosScreen';
import EspecificacionPedidoScreen from './src/screens/EspecificacionPedidoScreen';
import DireccionesScreen from './src/screens/DireccionesScreen';
import SeleccionarDireccionScreen from './src/screens/SeleccionarDireccionScreen';
import PedidoConfirmadoScreen from './src/screens/PedidoConfirmadoScreen';
import PedidoNoViableScreen from './src/screens/PedidoNoViableScreen';
import CerrarSesionScreen from './src/screens/CerrarSesionScreen';
import PerfilScreen from './src/screens/PerfilScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'ellipse-outline';
          if (route?.name === 'Inicio') iconName = focused ? 'home' : 'home-outline';
          else if (route?.name === 'Servicios') iconName = focused ? 'shirt' : 'shirt-outline';
          else if (route?.name === 'Direcciones') iconName = focused ? 'location' : 'location-outline';
          else if (route?.name === 'Mis Pedidos') iconName = focused ? 'list' : 'list-outline';
          else if (route?.name === 'Perfil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4A90E2',
        tabBarInactiveTintColor: 'gray',
        headerStyle: { backgroundColor: '#4A90E2' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      })}
    >
      <Tab.Screen name="Inicio" component={HomeScreen} />
      <Tab.Screen name="Servicios" component={ServiciosScreen} />
      <Tab.Screen name="Direcciones" component={DireccionesScreen} />
      <Tab.Screen name="Mis Pedidos" component={MisPedidosScreen} />
      <Tab.Screen name="Perfil" component={PerfilScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar si hay un token guardado al iniciar la app
    checkAuthToken();
  }, []);

  const checkAuthToken = async () => {
    // En web, si la verificación tarda o falla, no quedarse en loading para siempre
    const loadingTimeout = Platform.OS === 'web' ? setTimeout(() => {
      setIsLoading(false);
    }, 5000) : null;

    try {
      // Opción temporal: descomenta la siguiente línea para borrar sesión y ver Login al abrir la app. Luego coméntala de nuevo.
      // await AsyncStorage.multiRemove(['authToken', 'userData']);

      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        // Verificar si el token es válido con el backend
        try {
          const { apiRequest } = require('./src/config/api');
          const response = await apiRequest('/auth/verificar', 'GET', null, token);
          
          if (response.success && response.data.usuario) {
            // Token válido, actualizar datos del usuario
            await AsyncStorage.setItem('userData', JSON.stringify(response.data.usuario));
            setIsLoggedIn(true);
          } else {
            // Token inválido, limpiar
            await AsyncStorage.multiRemove(['authToken', 'userData']);
            setIsLoggedIn(false);
          }
        } catch (verifyError) {
          console.error('Error al verificar token:', verifyError);
          // Si falla la verificación, limpiar y cerrar sesión
          await AsyncStorage.multiRemove(['authToken', 'userData']);
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.error('Error al verificar token:', error);
      setIsLoggedIn(false);
    } finally {
      if (loadingTimeout) clearTimeout(loadingTimeout);
      setIsLoading(false);
    }
  };

  const rootStyle = {
    flex: 1,
    ...(Platform.OS === 'web' && { minHeight: '100vh', width: '100%', height: '100%' }),
  };

  if (isLoading) {
    // Mostrar pantalla de carga mientras se verifica el token
    return (
      <View style={[rootStyle, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#4A90E2' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <AppErrorBoundary>
    <View style={rootStyle}>
    <AuthContext.Provider value={{ isLoggedIn, setIsLoggedIn }}>
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        key={isLoggedIn ? 'logged-in' : 'logged-out'}
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          contentStyle: Platform.OS === 'web' ? { flex: 1, minHeight: '100vh' } : { flex: 1 },
        }}
      >
        {!isLoggedIn ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OlvideContrasena" component={OlvideContrasenaScreen} />
            <Stack.Screen name="RegistroExitoso" component={RegistroExitosoScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="EspecificacionPedido" component={EspecificacionPedidoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Direcciones" component={DireccionesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="SeleccionarDireccion" component={SeleccionarDireccionScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PedidoConfirmado" component={PedidoConfirmadoScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PedidoNoViable" component={PedidoNoViableScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ContrasenaCambiada" component={ContrasenaCambiadaScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CerrarSesion" component={CerrarSesionScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
    </AuthContext.Provider>
    </View>
    </AppErrorBoundary>
  );
}
