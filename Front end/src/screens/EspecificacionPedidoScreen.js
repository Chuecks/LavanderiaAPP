import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { crearPedido } from '../services/pedido.service';

const DEPARTAMENTOS_URUGUAY = [
  'Artigas',
  'Canelones',
  'Cerro Largo',
  'Colonia',
  'Durazno',
  'Flores',
  'Florida',
  'Lavalleja',
  'Maldonado',
  'Montevideo',
  'Paysandú',
  'Río Negro',
  'Rivera',
  'Rocha',
  'Salto',
  'San José',
  'Soriano',
  'Tacuarembó',
  'Treinta y Tres',
];

export default function EspecificacionPedidoScreen({ route, navigation }) {
  // Obtener servicio de los parámetros o AsyncStorage
  const params = route?.params || {};
  const [servicio, setServicio] = useState(params?.servicio || null);
  
  // Estados del formulario
  const [formData, setFormData] = useState({
    // Dirección de Recogida
    calleRecogida: '',
    numeroPuertaRecogida: '',
    numeroApartamentoRecogida: '',
    ciudadRecogida: '',
    departamentoRecogida: '',
    codigoPostalRecogida: '',
    // Dirección de Entrega
    calleEntrega: '',
    numeroPuertaEntrega: '',
    numeroApartamentoEntrega: '',
    ciudadEntrega: '',
    departamentoEntrega: '',
    codigoPostalEntrega: '',
    // Horarios
    horarioRecogida: '',
    horarioEntrega: '',
    notas: '',
  });

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [departamentoModalVisible, setDepartamentoModalVisible] = useState({ recogida: false, entrega: false });
  const [departamentoModalTipo, setDepartamentoModalTipo] = useState(null);
  const [direccionesGuardadas, setDireccionesGuardadas] = useState([]); // Para verificar si hay direcciones y mostrar el botón
  const [horarioRecogidaModalVisible, setHorarioRecogidaModalVisible] = useState(false);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(null);
  const [horaSeleccionada, setHoraSeleccionada] = useState(null);
  const [pasoRecogida, setPasoRecogida] = useState('dia'); // 'dia' o 'hora'
  const [horarioEntregaModalVisible, setHorarioEntregaModalVisible] = useState(false);
  const [fechaEntregaSeleccionada, setFechaEntregaSeleccionada] = useState(null);
  const [horaEntregaSeleccionada, setHoraEntregaSeleccionada] = useState(null);
  const [pasoEntrega, setPasoEntrega] = useState('dia'); // 'dia' o 'hora'

  // Cargar servicio y direcciones guardadas
  useEffect(() => {
    loadServicio();
    loadDireccionesGuardadas();
  }, []);

  // Detectar cuando se vuelve de SeleccionarDireccionScreen
  useFocusEffect(
    React.useCallback(() => {
      const checkDireccionTemporal = async () => {
        try {
          const data = await AsyncStorage.getItem('direccionTemporal');
          if (data) {
            const { direccion, tipo } = JSON.parse(data);
            if (direccion && tipo) {
              const suffix = tipo === 'recogida' ? 'Recogida' : 'Entrega';
              
              setFormData(prev => ({
                ...prev,
                [`calle${suffix}`]: direccion.calle || '',
                [`numeroPuerta${suffix}`]: direccion.numeroPuerta || '',
                [`numeroApartamento${suffix}`]: direccion.numeroApartamento || '',
                [`ciudad${suffix}`]: direccion.ciudad || '',
                [`departamento${suffix}`]: direccion.departamento || '',
                [`codigoPostal${suffix}`]: direccion.codigoPostal || '',
              }));
              
              // Limpiar el dato temporal
              await AsyncStorage.removeItem('direccionTemporal');
            }
          }
        } catch (error) {
          console.error('Error al cargar dirección temporal:', error);
        }
      };
      
      checkDireccionTemporal();
    }, [])
  );

  const loadServicio = async () => {
    try {
      if (!servicio) {
        const data = await AsyncStorage.getItem('servicioTemporal');
        if (data) {
          const servicioTemp = JSON.parse(data);
          setServicio(servicioTemp);
          await AsyncStorage.removeItem('servicioTemporal');
        }
      }
    } catch (error) {
      console.error('Error al cargar servicio:', error);
    }
  };

  const loadDireccionesGuardadas = async () => {
    try {
      // Intentar cargar desde el backend
      const { obtenerDirecciones } = await import('../services/direccion.service');
      const direccionesData = await obtenerDirecciones();
      setDireccionesGuardadas(direccionesData);
    } catch (error) {
      console.error('Error al cargar direcciones desde backend:', error);
      // Fallback a AsyncStorage si el backend falla
      try {
        const data = await AsyncStorage.getItem('direcciones');
        if (data) {
          setDireccionesGuardadas(JSON.parse(data));
        }
      } catch (fallbackError) {
        console.error('Error al cargar direcciones desde AsyncStorage:', fallbackError);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleSelectDepartamento = (departamento, tipo) => {
    const field = tipo === 'recogida' ? 'departamentoRecogida' : 'departamentoEntrega';
    handleInputChange(field, departamento);
    setDepartamentoModalVisible(prev => ({ ...prev, [tipo]: false }));
  };

  const handleUsarDireccionGuardada = (tipo) => {
    navigation.navigate('SeleccionarDireccion', { tipo });
  };

  // Obtener los próximos días laborables (lunes a viernes)
  const obtenerDiasLaborables = () => {
    const dias = [];
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Nombres de los días
    const nombresDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const nombresMeses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                          'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    // Buscar los próximos 21 días laborables (3 semanas)
    let contador = 0;
    let fecha = new Date(hoy);
    
    while (contador < 21) {
      const diaSemana = fecha.getDay();
      // 1 = Lunes, 5 = Viernes
      if (diaSemana >= 1 && diaSemana <= 5) {
        dias.push({
          fecha: new Date(fecha),
          label: `${nombresDias[diaSemana]}, ${fecha.getDate()} de ${nombresMeses[fecha.getMonth()]}`,
          value: fecha.toISOString().split('T')[0]
        });
        contador++;
      }
      fecha.setDate(fecha.getDate() + 1);
    }
    
    return dias;
  };

  // Obtener horas disponibles (8:00 a 17:00)
  const obtenerHorasDisponibles = () => {
    const horas = [];
    for (let i = 8; i <= 17; i++) {
      horas.push({
        value: i,
        label: `${i.toString().padStart(2, '0')}:00`
      });
    }
    return horas;
  };

  // Parsea horario "Lunes, 3 de Febrero, 08:00" a Date (año actual; si ya pasó, año siguiente)
  const parsearHorarioDisplay = (str) => {
    if (!str || typeof str !== 'string') return null;
    const partes = str.split(', ').map(p => p.trim());
    if (partes.length < 3) return null;
    const tiempo = partes[partes.length - 1];
    const fechaParte = partes[partes.length - 2];
    const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const matchFecha = fechaParte.match(/^(\d{1,2})\s+de\s+(.+)$/i);
    if (!matchFecha) return null;
    const dia = parseInt(matchFecha[1], 10);
    const mesStr = matchFecha[2].toLowerCase();
    const mes = meses.findIndex(m => mesStr.startsWith(m));
    if (mes < 0 || dia < 1 || dia > 31) return null;
    const matchHora = tiempo.match(/^(\d{1,2}):(\d{2})$/);
    const hora = matchHora ? parseInt(matchHora[1], 10) : 0;
    const min = matchHora ? parseInt(matchHora[2], 10) : 0;
    const year = new Date().getFullYear();
    let d = new Date(year, mes, dia, hora, min, 0, 0);
    if (d.getTime() < Date.now()) d = new Date(year + 1, mes, dia, hora, min, 0, 0);
    return d;
  };

  const MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA = 3;
  const UNA_HORA_MS = 60 * 60 * 1000;

  // Horas disponibles para recogida: si el día seleccionado es hoy, solo horas al menos 1 h desde ahora
  const obtenerHorasDisponiblesRecogida = () => {
    const base = obtenerHorasDisponibles();
    if (pasoRecogida !== 'hora' || !fechaSeleccionada) return base;
    const hoy = new Date().toISOString().split('T')[0];
    if (fechaSeleccionada !== hoy) return base;
    const ahora = new Date();
    const minimo = new Date(ahora.getTime() + UNA_HORA_MS);
    const horaMin = minimo.getHours() + (minimo.getMinutes() > 0 || minimo.getSeconds() > 0 ? 1 : 0);
    return base.filter((h) => h.value >= horaMin);
  };

  // Horas disponibles para entrega: al menos 1 h desde ahora y al menos 3 h después del horario de recogida
  const obtenerHorasDisponiblesEntrega = () => {
    const base = obtenerHorasDisponibles();
    if (pasoEntrega !== 'hora' || !fechaEntregaSeleccionada) return base;
    const recogidaDate = parsearHorarioDisplay(formData.horarioRecogida);
    const hoy = new Date().toISOString().split('T')[0];
    let horaMin = 8;
    if (fechaEntregaSeleccionada === hoy) {
      const ahora = new Date();
      const minimo = new Date(ahora.getTime() + UNA_HORA_MS);
      horaMin = minimo.getHours() + (minimo.getMinutes() > 0 || minimo.getSeconds() > 0 ? 1 : 0);
    }
    if (recogidaDate) {
      const [y, m, d] = fechaEntregaSeleccionada.split('-').map(Number);
      const recogidaY = recogidaDate.getFullYear();
      const recogidaM = recogidaDate.getMonth();
      const recogidaD = recogidaDate.getDate();
      if (y === recogidaY && m === recogidaM + 1 && d === recogidaD) {
        const horaMinRecogida = recogidaDate.getHours() + MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA;
        if (horaMinRecogida > horaMin) horaMin = horaMinRecogida;
      }
    }
    return base.filter((h) => h.value >= horaMin);
  };

  // Abrir modal de selección de horario
  const abrirModalHorarioRecogida = () => {
    setHorarioRecogidaModalVisible(true);
    setFechaSeleccionada(null);
    setHoraSeleccionada(null);
    setPasoRecogida('dia'); // Empezar seleccionando el día
  };

  // Seleccionar día de recogida y avanzar a selección de hora
  const seleccionarDiaRecogida = (diaValue) => {
    setFechaSeleccionada(diaValue);
    setPasoRecogida('hora'); // Cambiar a selección de hora
  };

  // Volver a selección de día
  const volverADiaRecogida = () => {
    setPasoRecogida('dia');
    setHoraSeleccionada(null);
  };

  // Confirmar selección de horario de recogida (debe ser al menos 1 h desde ahora)
  const confirmarHorarioRecogida = () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      setError('Por favor selecciona una fecha y hora');
      return;
    }
    
    const fecha = obtenerDiasLaborables().find(d => d.value === fechaSeleccionada);
    const hora = obtenerHorasDisponibles().find(h => h.value === horaSeleccionada);
    
    if (fecha && hora) {
      const [y, m, d] = fecha.value.split('-').map(Number);
      const recogidaDate = new Date(y, m - 1, d, hora.value, 0, 0, 0);
      if (recogidaDate.getTime() < Date.now() + UNA_HORA_MS) {
        setError('El horario de recogida debe ser al menos 1 hora después de ahora.');
        return;
      }
      const horarioCompleto = `${fecha.label}, ${hora.label}`;
      handleInputChange('horarioRecogida', horarioCompleto);
      setHorarioRecogidaModalVisible(false);
      setPasoRecogida('dia');
    }
  };

  // Abrir modal de selección de horario de entrega
  const abrirModalHorarioEntrega = () => {
    setHorarioEntregaModalVisible(true);
    setFechaEntregaSeleccionada(null);
    setHoraEntregaSeleccionada(null);
    setPasoEntrega('dia'); // Empezar seleccionando el día
  };

  // Seleccionar día de entrega y avanzar a selección de hora
  const seleccionarDiaEntrega = (diaValue) => {
    setFechaEntregaSeleccionada(diaValue);
    setPasoEntrega('hora'); // Cambiar a selección de hora
  };

  // Volver a selección de día
  const volverADiaEntrega = () => {
    setPasoEntrega('dia');
    setHoraEntregaSeleccionada(null);
  };

  // Confirmar selección de horario de entrega (mín. 1 h desde ahora y mín. 3 h después de recogida)
  const confirmarHorarioEntrega = () => {
    if (!fechaEntregaSeleccionada || !horaEntregaSeleccionada) {
      setError('Por favor selecciona una fecha y hora');
      return;
    }
    
    const fecha = obtenerDiasLaborables().find(d => d.value === fechaEntregaSeleccionada);
    const hora = obtenerHorasDisponibles().find(h => h.value === horaEntregaSeleccionada);
    
    if (fecha && hora) {
      const [y, m, d] = fecha.value.split('-').map(Number);
      const entregaDate = new Date(y, m - 1, d, hora.value, 0, 0, 0);
      if (entregaDate.getTime() < Date.now() + UNA_HORA_MS) {
        setError('El horario de entrega debe ser al menos 1 hora después de ahora.');
        return;
      }
      const recogidaDate = parsearHorarioDisplay(formData.horarioRecogida);
      if (recogidaDate) {
        if (entregaDate.getTime() <= recogidaDate.getTime()) {
          setError('El horario de entrega debe ser posterior al de recogida.');
          return;
        }
        const diffHoras = (entregaDate.getTime() - recogidaDate.getTime()) / (1000 * 60 * 60);
        if (diffHoras < MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA) {
          setError(`Debe haber al menos ${MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA} horas entre la recogida y la entrega.`);
          return;
        }
      }
      const horarioCompleto = `${fecha.label}, ${hora.label}`;
      handleInputChange('horarioEntrega', horarioCompleto);
      setHorarioEntregaModalVisible(false);
      setPasoEntrega('dia');
    }
  };

  const validateForm = () => {
    // Validar dirección de recogida
    if (!formData.calleRecogida.trim() || 
        !formData.numeroPuertaRecogida.trim() || 
        !formData.ciudadRecogida.trim() || 
        !formData.departamentoRecogida || 
        !formData.codigoPostalRecogida.trim()) {
      setError('Completa todos los campos requeridos de la dirección de recogida');
      return false;
    }
    
    // Validar dirección de entrega
    if (!formData.calleEntrega.trim() || 
        !formData.numeroPuertaEntrega.trim() || 
        !formData.ciudadEntrega.trim() || 
        !formData.departamentoEntrega || 
        !formData.codigoPostalEntrega.trim()) {
      setError('Completa todos los campos requeridos de la dirección de entrega');
      return false;
    }
    
    // Validar horarios
    if (!formData.horarioRecogida.trim()) {
      setError('El horario de recogida es requerido');
      return false;
    }
    
    if (!formData.horarioEntrega.trim()) {
      setError('El horario de entrega es requerido');
      return false;
    }

    // Recogida al menos 1 h desde ahora
    const recogidaDate = parsearHorarioDisplay(formData.horarioRecogida);
    if (recogidaDate && recogidaDate.getTime() < Date.now() + UNA_HORA_MS) {
      setError('El horario de recogida debe ser al menos 1 hora después de ahora.');
      return false;
    }

    // Entrega al menos 1 h desde ahora
    const entregaDate = parsearHorarioDisplay(formData.horarioEntrega);
    if (entregaDate && entregaDate.getTime() < Date.now() + UNA_HORA_MS) {
      setError('El horario de entrega debe ser al menos 1 hora después de ahora.');
      return false;
    }

    // Recogida antes que entrega y al menos 3 h entre ambos
    if (recogidaDate && entregaDate) {
      if (recogidaDate.getTime() >= entregaDate.getTime()) {
        setError('El horario de entrega debe ser posterior al de recogida.');
        return false;
      }
      const diffHoras = (entregaDate.getTime() - recogidaDate.getTime()) / (1000 * 60 * 60);
      if (diffHoras < MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA) {
        setError(`Debe haber al menos ${MIN_HORAS_ENTRE_RECOGIDA_Y_ENTREGA} horas entre la recogida y la entrega para poder lavar la ropa.`);
        return false;
      }
    }

    return true;
  };

  const handleConfirmarPedido = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Preparar datos del pedido
      const pedidoData = {
        servicio: {
          nombre: servicio?.nombre || '',
          precio: servicio?.precio || 0,
          descripcion: servicio?.descripcion || ''
        },
        direccionRecogida: {
          calle: formData.calleRecogida,
          numeroPuerta: formData.numeroPuertaRecogida,
          numeroApartamento: formData.numeroApartamentoRecogida,
          ciudad: formData.ciudadRecogida,
          departamento: formData.departamentoRecogida,
          codigoPostal: formData.codigoPostalRecogida
        },
        direccionEntrega: {
          calle: formData.calleEntrega,
          numeroPuerta: formData.numeroPuertaEntrega,
          numeroApartamento: formData.numeroApartamentoEntrega,
          ciudad: formData.ciudadEntrega,
          departamento: formData.departamentoEntrega,
          codigoPostal: formData.codigoPostalEntrega
        },
        horarioRecogida: formData.horarioRecogida,
        horarioEntrega: formData.horarioEntrega,
        notas: formData.notas || ''
      };

      // Crear pedido en el backend
      const pedidoCreado = await crearPedido(pedidoData);

      // Navegar a la pantalla de confirmación con los datos del pedido
      navigation.navigate('PedidoConfirmado', {
        pedido: pedidoCreado,
        servicioNombre: servicio?.nombre || 'Servicio',
        error: null
      });
    } catch (error) {
      console.error('Error al confirmar pedido:', error);
      const errorMessage = error.message || 'Ocurrió un error al procesar tu pedido. Por favor intenta nuevamente.';
      setError(errorMessage);

      if (error.codigo === 'NO_LAVANDERIA_CERCANA' || error.codigo === 'ENTREGA_FUERA_DE_RANGO') {
        navigation.navigate('PedidoNoViable', { mensaje: errorMessage });
        return;
      }

      // Navegar a la pantalla de confirmación con el error para otros errores
      navigation.navigate('PedidoConfirmado', {
        pedido: null,
        servicioNombre: servicio?.nombre || 'Servicio',
        error: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const renderDireccionForm = (tipo, titulo) => {
    const suffix = tipo === 'recogida' ? 'Recogida' : 'Entrega';
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={24} color="#4A90E2" />
          <Text style={styles.sectionTitle}>{titulo}</Text>
          <TouchableOpacity
            style={styles.usarDireccionButton}
            onPress={() => handleUsarDireccionGuardada(tipo)}
          >
            <Ionicons name="bookmark" size={16} color="#4A90E2" />
            <Text style={styles.usarDireccionText}>Usar guardada</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Calle *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Nombre de la calle"
                value={formData[`calle${suffix}`]}
                onChangeText={(value) => handleInputChange(`calle${suffix}`, value)}
              />
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>N° de puerta *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="123"
                value={formData[`numeroPuerta${suffix}`]}
                onChangeText={(value) => handleInputChange(`numeroPuerta${suffix}`, value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>N° apartamento</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Apt. 4B"
                value={formData[`numeroApartamento${suffix}`]}
                onChangeText={(value) => handleInputChange(`numeroApartamento${suffix}`, value)}
              />
            </View>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Ciudad *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Ciudad"
                value={formData[`ciudad${suffix}`]}
                onChangeText={(value) => handleInputChange(`ciudad${suffix}`, value)}
              />
            </View>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Departamento *</Text>
            <TouchableOpacity
              style={styles.selectContainer}
              onPress={() => {
                setDepartamentoModalTipo(tipo);
                setDepartamentoModalVisible(prev => ({ ...prev, [tipo]: true }));
              }}
            >
              <Ionicons name="location-outline" size={20} color="#666" style={styles.selectIcon} />
              <Text style={[styles.selectText, !formData[`departamento${suffix}`] && styles.selectPlaceholder]}>
                {formData[`departamento${suffix}`] || 'Seleccione'}
              </Text>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Código postal *</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="11000"
                value={formData[`codigoPostal${suffix}`]}
                onChangeText={(value) => handleInputChange(`codigoPostal${suffix}`, value)}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  // Si no hay servicio, mostrar mensaje de error
  if (!servicio) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Error</Text>
        </LinearGradient>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            No se pudo cargar la información del servicio. Por favor intenta nuevamente.
          </Text>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => navigation.goBack()}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.confirmButtonGradient}
            >
              <Text style={styles.confirmButtonText}>Volver</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient colors={['#4A90E2', '#357ABD']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Especificar Pedido</Text>
        <Text style={styles.headerSubtitle}>
          {servicio?.nombre || 'Servicio'} - ${servicio?.precio?.toLocaleString() || '0'}
        </Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Dirección de Recogida */}
          {renderDireccionForm('recogida', 'Dirección de Recogida')}

          {/* Horario de Recogida */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={24} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Horario de Recogida *</Text>
            </View>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={abrirModalHorarioRecogida}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.inputText, !formData.horarioRecogida && styles.placeholderText]}>
                {formData.horarioRecogida || 'Selecciona fecha y hora (Lunes a Viernes, 8:00 - 17:00)'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Dirección de Entrega */}
          {renderDireccionForm('entrega', 'Dirección de Entrega')}

          {/* Horario de Entrega */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={24} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Horario de Entrega *</Text>
            </View>
            <TouchableOpacity
              style={styles.inputContainer}
              onPress={abrirModalHorarioEntrega}
              activeOpacity={0.7}
            >
              <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
              <Text style={[styles.inputText, !formData.horarioEntrega && styles.placeholderText]}>
                {formData.horarioEntrega || 'Selecciona fecha y hora (Lunes a Viernes, 8:00 - 17:00)'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Notas Adicionales */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text-outline" size={24} color="#4A90E2" />
              <Text style={styles.sectionTitle}>Notas Adicionales (Opcional)</Text>
            </View>
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Instrucciones especiales o notas adicionales..."
                placeholderTextColor="#999"
                value={formData.notas}
                onChangeText={(value) => handleInputChange('notas', value)}
                multiline
                numberOfLines={4}
              />
            </View>
          </View>

          {/* Mensaje de Error */}
          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={20} color="#E94B3C" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Botón Confirmar */}
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirmarPedido}
            disabled={loading}
          >
            <LinearGradient
              colors={['#4A90E2', '#357ABD']}
              style={styles.confirmButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de Departamentos */}
      <Modal
        visible={departamentoModalVisible.recogida || departamentoModalVisible.entrega}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setDepartamentoModalVisible({ recogida: false, entrega: false })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar Departamento</Text>
              <TouchableOpacity
                onPress={() => setDepartamentoModalVisible({ recogida: false, entrega: false })}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {DEPARTAMENTOS_URUGUAY.map((depto, index) => {
                const tipo = departamentoModalTipo;
                const suffix = tipo === 'recogida' ? 'Recogida' : 'Entrega';
                const isSelected = formData[`departamento${suffix}`] === depto;
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.departamentoItem,
                      isSelected && styles.departamentoItemSelected
                    ]}
                    onPress={() => handleSelectDepartamento(depto, tipo)}
                  >
                    <Text style={[
                      styles.departamentoItemText,
                      isSelected && styles.departamentoItemTextSelected
                    ]}>
                      {depto}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark" size={20} color="#4A90E2" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Horario de Recogida */}
      <Modal
        visible={horarioRecogidaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHorarioRecogidaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {pasoRecogida === 'hora' && (
                  <TouchableOpacity
                    onPress={volverADiaRecogida}
                    style={{ marginRight: 10 }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  {pasoRecogida === 'dia' ? 'Seleccionar Día de Recogida' : 'Seleccionar Hora de Recogida'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setHorarioRecogidaModalVisible(false);
                  setPasoRecogida('dia');
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {pasoRecogida === 'dia' ? (
              <ScrollView style={styles.modalList}>
                <Text style={styles.modalSubtitle}>Selecciona un día (Lunes a Viernes, próximas 3 semanas)</Text>
                {obtenerDiasLaborables().map((dia, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.departamentoItem}
                    onPress={() => seleccionarDiaRecogida(dia.value)}
                  >
                    <Text style={styles.departamentoItemText}>
                      {dia.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.modalList}>
                <Text style={styles.modalSubtitle}>
                  {fechaSeleccionada && obtenerDiasLaborables().find(d => d.value === fechaSeleccionada)?.label}
                </Text>
                <Text style={[styles.modalSubtitle, { marginTop: 10, fontSize: 14, color: '#666' }]}>
                  {fechaSeleccionada === new Date().toISOString().split('T')[0]
                    ? 'Selecciona una hora (mín. 1 h desde ahora)'
                    : 'Selecciona una hora (8:00 - 17:00)'}
                </Text>
                {obtenerHorasDisponiblesRecogida().map((hora, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.departamentoItem,
                      horaSeleccionada === hora.value && styles.departamentoItemSelected
                    ]}
                    onPress={() => setHoraSeleccionada(hora.value)}
                  >
                    <Text style={[
                      styles.departamentoItemText,
                      horaSeleccionada === hora.value && styles.departamentoItemTextSelected
                    ]}>
                      {hora.label}
                    </Text>
                    {horaSeleccionada === hora.value && (
                      <Ionicons name="checkmark" size={20} color="#4A90E2" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setHorarioRecogidaModalVisible(false);
                  setPasoRecogida('dia');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              {pasoRecogida === 'hora' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmarHorarioRecogida}
                  disabled={!horaSeleccionada}
                >
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Confirmar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Horario de Entrega */}
      <Modal
        visible={horarioEntregaModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setHorarioEntregaModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                {pasoEntrega === 'hora' && (
                  <TouchableOpacity
                    onPress={volverADiaEntrega}
                    style={{ marginRight: 10 }}
                  >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                )}
                <Text style={styles.modalTitle}>
                  {pasoEntrega === 'dia' ? 'Seleccionar Día de Entrega' : 'Seleccionar Hora de Entrega'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setHorarioEntregaModalVisible(false);
                  setPasoEntrega('dia');
                }}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {pasoEntrega === 'dia' ? (
              <ScrollView style={styles.modalList}>
                <Text style={styles.modalSubtitle}>Selecciona un día (Lunes a Viernes, próximas 3 semanas)</Text>
                {obtenerDiasLaborables().map((dia, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.departamentoItem}
                    onPress={() => seleccionarDiaEntrega(dia.value)}
                  >
                    <Text style={styles.departamentoItemText}>
                      {dia.label}
                    </Text>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </ScrollView>
            ) : (
              <ScrollView style={styles.modalList}>
                <Text style={styles.modalSubtitle}>
                  {fechaEntregaSeleccionada && obtenerDiasLaborables().find(d => d.value === fechaEntregaSeleccionada)?.label}
                </Text>
                <Text style={[styles.modalSubtitle, { marginTop: 10, fontSize: 14, color: '#666' }]}>
                  {formData.horarioRecogida
                    ? 'Hora mín. 1 h desde ahora y 3 h después de la recogida'
                    : 'Selecciona una hora (8:00 - 17:00)'}
                </Text>
                {obtenerHorasDisponiblesEntrega().map((hora, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.departamentoItem,
                      horaEntregaSeleccionada === hora.value && styles.departamentoItemSelected
                    ]}
                    onPress={() => setHoraEntregaSeleccionada(hora.value)}
                  >
                    <Text style={[
                      styles.departamentoItemText,
                      horaEntregaSeleccionada === hora.value && styles.departamentoItemTextSelected
                    ]}>
                      {hora.label}
                    </Text>
                    {horaEntregaSeleccionada === hora.value && (
                      <Ionicons name="checkmark" size={20} color="#4A90E2" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setHorarioEntregaModalVisible(false);
                  setPasoEntrega('dia');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              {pasoEntrega === 'hora' && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonConfirm]}
                  onPress={confirmarHorarioEntrega}
                  disabled={!horaEntregaSeleccionada}
                >
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    style={styles.modalButtonGradient}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Confirmar</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
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
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  usarDireccionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E220',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#4A90E240',
  },
  usarDireccionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4A90E2',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 5,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 0,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectIcon: {
    marginRight: 10,
  },
  selectText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectPlaceholder: {
    color: '#999',
  },
  placeholderText: {
    color: '#999',
  },
  modalSubtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 10,
    paddingHorizontal: 15,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonConfirm: {
    overflow: 'hidden',
  },
  modalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 12,
  },
  modalButtonTextConfirm: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#E94B3C',
    marginLeft: 8,
  },
  confirmButton: {
    borderRadius: 10,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 20,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    minHeight: 480,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  modalList: {
    flex: 1,
    minHeight: 280,
    maxHeight: 380,
  },
  departamentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  departamentoItemSelected: {
    backgroundColor: '#4A90E210',
  },
  departamentoItemText: {
    fontSize: 16,
    color: '#333',
  },
  departamentoItemTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
});
