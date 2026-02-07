import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function ContrasenaCambiadaScreen({ navigation }) {
  const volverAlPerfil = () => {
    try {
      if (navigation?.canGoBack?.()) {
        navigation.goBack();
      } else {
        navigation.navigate('Main');
      }
    } catch (e) {
      navigation.navigate('Main');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="checkmark-circle" size={100} color="#fff" />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.title}>¡Contraseña actualizada!</Text>
        <Text style={styles.subtitle}>
          Tu contraseña se ha cambiado correctamente. La próxima vez que inicies sesión usa tu nueva contraseña.
        </Text>
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#4A90E2" />
          <Text style={styles.infoText}>
            Tu cuenta sigue abierta en este dispositivo. Cierra sesión si compartes el dispositivo.
          </Text>
        </View>

        <TouchableOpacity style={styles.button} onPress={volverAlPerfil}>
          <LinearGradient
            colors={['#4A90E2', '#357ABD']}
            style={styles.buttonGradient}
          >
            <Ionicons name="person-outline" size={20} color="#fff" />
            <Text style={styles.buttonText}>Volver al Perfil</Text>
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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
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
