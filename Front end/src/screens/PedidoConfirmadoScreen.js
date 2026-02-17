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
  const { pedido, error, servicioNombre, emailEnviado } = route.params || {};
  const exito = !error && pedido;

  useEffect(() => {
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
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.infoText, { marginLeft: 0 }]}>
                  Te contactaremos pronto para confirmar los detalles de recogida y entrega.
                </Text>
                {emailEnviado === false && (
                  <Text style={[styles.infoText, { marginLeft: 0, color: '#E94B3C', marginTop: 8 }]}>
                    No se pudo enviar el email de confirmación al negocio. El pedido está registrado; si hace falta, contacta a lavaderojmm@gmail.com.
                  </Text>
                )}
              </View>
            </View>
            {pedido?.lavanderia?.nombre ? (
              <View style={styles.lavanderiaBox}>
                <Ionicons name="business" size={24} color="#4A90E2" />
                <View style={styles.lavanderiaTextWrap}>
                  <Text style={styles.lavanderiaLabel}>Lavandería asignada a tu pedido</Text>
                  <Text style={styles.lavanderiaNombre}>{pedido.lavanderia.nombre}</Text>
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
      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginTop: 0,
  },
  content: {
    flex: 1,
    padding: 30,
    paddingBottom: 20,
    alignItems: 'center',
  },
  bottomSpacer: {
    height: 40,
    minHeight: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  titleError: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E94B3C',
    marginBottom: 15,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
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
  },
  lavanderiaTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  lavanderiaLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  lavanderiaNombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  redirectText: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
  },
  button: {
    borderRadius: 25,
    overflow: 'hidden',
    width: '100%',
    maxWidth: 320,
    marginBottom: 24,
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
