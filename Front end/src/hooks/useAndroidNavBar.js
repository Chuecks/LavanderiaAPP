import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { useFocusEffect } from '@react-navigation/native';

const DEFAULT_BG = '#ffffff';
const DEFAULT_BUTTONS = 'dark';

/**
 * Hook para asegurar que la barra de navegación Android tenga el color correcto
 * cada vez que la pantalla está enfocada (useFocusEffect evita problemas con
 * pantallas que no se desmontan al navegar).
 *
 * Uso: useAndroidNavBar('#357ABD')
 */
export default function useAndroidNavBar(color = '#357ABD') {
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return undefined;

      let mounted = true;
      (async () => {
        try {
          await NavigationBar.setBackgroundColorAsync(color);
          await NavigationBar.setButtonStyleAsync('light');
        } catch (e) {
          // no-op
        }
      })();

      return () => {
        if (!mounted) return;
        NavigationBar.setBackgroundColorAsync(DEFAULT_BG);
        NavigationBar.setButtonStyleAsync(DEFAULT_BUTTONS);
        mounted = false;
      };
    }, [color])
  );
}
