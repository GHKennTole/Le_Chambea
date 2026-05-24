import React from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
  Image,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFonts, Sansita_700Bold_Italic } from '@expo-google-fonts/sansita';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  
  let [fontsLoaded] = useFonts({
    'SansitaBoldItalic': Sansita_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#FFD700" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.contenido}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          {/* Texto principal con efecto dropshadow negro */}
          <Text style={styles.appName}>LE CHAMBEA</Text>
        </View>

        {/* Spinner en dorado para contraste con fondo morado */}
        <ActivityIndicator 
          size="large" 
          color="white"
          style={styles.spinner}
        />

        {/* Texto secundario en blanco semitransparente */}
        <Text style={styles.loadingText}>Cargando Aplicacion...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#5b5c9c', // Fondo morado principal
  },
  contenido: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 220,
    height: 220,
    marginBottom: 16,
    // Si tu logo es oscuro, puedes agregar un borde blanco sutil
    // borderWidth: 2,
    // borderColor: 'rgba(255, 255, 255, 0.2)',
    // borderRadius: 10,
  },
  appName: {
    fontSize: 36,
    fontFamily: 'SansitaBoldItalic',
    color: '#000000',
    letterSpacing: 1.2,
    transform: [{ skewX: '-5deg' }],
    ...Platform.select({
      web: { textShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)' } as any,
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.25)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
      }
    }),
  },
  spinner: {
    marginVertical: 20,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 10,
    fontWeight: 'bold',
    ...Platform.select({
      web: { textShadow: '0px 1px 2px rgba(0, 0, 0, 0.3)' } as any,
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
      }
    }),
  },
});