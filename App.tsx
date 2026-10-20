import React from "react";
import { Provider as PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View, Platform } from "react-native";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";
import AppNavigator from "./src/navigation/AppNavigator";

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  let meta = document.querySelector('meta[name="viewport"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, interactive-widget=resizes-content, viewport-fit=cover';

  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', () => {
      if (window.scrollY !== 0 || window.scrollX !== 0) {
        window.scrollTo(0, 0);
      }
    }, { passive: true });
  }

  const style = document.createElement('style');
  style.textContent = `
    html, body, #root {
      height: 100%;
      width: 100%;
      margin: 0;
      padding: 0;
      overflow: hidden;
      position: fixed;
      left: 0;
      top: 0;
      right: 0;
      bottom: 0;
      -webkit-tap-highlight-color: transparent;
      -webkit-touch-callout: none;
      overscroll-behavior: none;
    }
    input, textarea, [contenteditable] {
      outline: none !important;
      -webkit-tap-highlight-color: transparent;
    }
    /* Estilo sutil y nativo para barras de scroll en web móvil/desktop */
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(90, 45, 130, 0.25);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-track {
      background: transparent;
    }
  `;
  document.head.appendChild(style);
}

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    onSurface: "#1a1a1a",
    onSurfaceVariant: "#a89fbf",
    primary: "#816ab4",
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    SansitaBoldItalic: Sansita_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#5A2D82" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}