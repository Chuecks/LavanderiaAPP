import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

// Logo: colócalo en Front end/Imagenes/ClickCleanLogo.png
// (si tu archivo es "Click Clean Logo.png", renómbralo a ClickCleanLogo.png)
const logoSource = require('../../Imagenes/ClickCleanLogo.png');

export default function AppLogo({ size = 240, style }) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={logoSource}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
