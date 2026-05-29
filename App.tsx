import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActivityIndicator, View } from "react-native";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";
import AppNavigator from "./src/navigation/AppNavigator";

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
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}