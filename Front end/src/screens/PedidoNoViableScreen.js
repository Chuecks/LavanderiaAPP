import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function PedidoNoViableScreen({ route, navigation }) {
  const mensaje = route?.params?.mensaje || 'No podemos tomar tu pedido: la dirección de recogida o de entrega está fuera de la zona de cobertura (máx. 5 km de una lavandería).';

  const volverAEspecificacion = () => {
    try {
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        const parentNav = navigation.getParent?.();
        if (parentNav?.navigate) parentNav.navigate('Main', { screen: 'Servicios' });
        else navigation.navigate('Main');
      }
    } catch (e) {
      navigation.navigate('Main');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#E94B3C', '#C0392B']} style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="close-circle" size={72} color="#fff" />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>Pedido no realizado</Text>
        <Text style={styles.subtitle}>
          Tu pedido no pudo realizarse: la dirección de recogida o de entrega está fuera del rango permitido (máx. 5 km de la lavandería).
        </Text>
        <View style={styles.infoBox}>
          <Ionicons name="location-outline" size={24} color="#E94B3C" />
          <Text style={styles.infoText}>
            {mensaje}
          </Text>
        </View>
        <View style={styles.suggestionBox}>
          <Ionicons name="bulb-outline" size={24} color="#4A90E2" />
          <Text style={styles.suggestionText}>
            Usa direcciones de recogida y de entrega a menos de 5 km de alguna lavandería (Montevideo y alrededores).
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={volverAEspecificacion}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.buttonGradient}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
            <Text style={styles.buttonText}>Volver a especificar pedido</Text>
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
    justifyContent: 'center',
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
  subtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFE5E5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'flex-start',
    borderLeftWidth: 4,
    borderLeftColor: '#E94B3C',
  },
  infoText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 12,
    lineHeight: 22,
  },
  suggestionBox: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionText: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    marginLeft: 12,
    lineHeight: 22,
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
