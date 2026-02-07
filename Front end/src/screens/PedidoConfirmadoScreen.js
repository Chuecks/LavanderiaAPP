import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PedidoConfirmadoScreen({ route, navigation }) {
  const { pedido, error, servicioNombre } = route.params || {};
  const exito = !error && pedido;

  useEffect(() => {
    // Auto-redirigir a Home después de 3 segundos si es exitoso
    if (exito) {
      const timer = setTimeout(() => {
        navegarAHome();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [exito]);

  const navegarAHome = () => {
    try {
      const parentNav = navigation.getParent();
      if (parentNav && parentNav.navigate) {
        parentNav.navigate('Main', { screen: 'Inicio' });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Main' }],
        });
      }
    } catch (navError) {
      console.error('Error al navegar a Home:', navError);
      navigation.goBack();
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <View style={styles.iconContainer}>
          {exito ? (
            <Ionicons name="checkmark-circle" size={100} color="#fff" />
          ) : (
            <Ionicons name="close-circle" size={100} color="#fff" />
          )}
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {exito ? (
          <>
            <Text style={styles.title}>¡Pedido Confirmado!</Text>
            <Text style={styles.subtitle}>
              Tu pedido de "{servicioNombre || 'Servicio'}" ha sido registrado exitosamente
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#4A90E2" />
              <Text style={styles.infoText}>
                Te contactaremos pronto para confirmar los detalles de recogida y entrega.
              </Text>
            </View>
            {pedido?.lavanderia?.nombre ? (
              <View style={styles.lavanderiaBox}>
                <Ionicons name="business" size={24} color="#4A90E2" />
                <View style={styles.lavanderiaTextWrap}>
                  <Text style={styles.lavanderiaLabel}>Lavandería asignada a tu pedido</Text>
                  <Text style={styles.lavanderiaNombre}>{pedido.lavanderia.nombre}</Text>
                  <Text style={styles.lavanderiaDir}>
                    {[pedido.lavanderia.calle, pedido.lavanderia.numeroPuerta].filter(Boolean).join(' ')}
                    {pedido.lavanderia.numeroApartamento ? `, Apt. ${pedido.lavanderia.numeroApartamento}` : ''}
                    {pedido.lavanderia.barrio ? ` · ${pedido.lavanderia.barrio}` : ''}
                    {pedido.lavanderia.ciudad ? `, ${pedido.lavanderia.ciudad}` : ''}
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.redirectText}>
              Redirigiendo a inicio en 3 segundos...
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.titleError}>Error al Confirmar Pedido</Text>
            <Text style={styles.subtitle}>
              {error || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.'}
            </Text>
            <View style={styles.infoBox}>
              <Ionicons name="alert-circle" size={24} color="#E94B3C" />
              <Text style={styles.infoText}>
                Si el problema persiste, contacta con soporte.
              </Text>
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.button}
          onPress={navegarAHome}
        >
          <LinearGradient
            colors={exito ? ['#4A90E2', '#357ABD'] : ['#E94B3C', '#C0392B']}
            style={styles.buttonGradient}
          >
            <Ionicons 
              name={exito ? "home" : "arrow-back"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.buttonText}>
              {exito ? 'Ir a Inicio' : 'Volver'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 80,
    paddingBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginTop: 20,
  },
  content: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  titleError: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#E94B3C',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 26,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
    lineHeight: 22,
  },
  lavanderiaBox: {
    flexDirection: 'row',
    backgroundColor: '#E8F4FD',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
  },
  lavanderiaTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  lavanderiaLabel: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
    marginBottom: 4,
  },
  lavanderiaNombre: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  lavanderiaDir: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  redirectText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 30,
    fontStyle: 'italic',
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
