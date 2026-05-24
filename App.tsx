import React from "react";
import { Provider as PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AppNavigator from "./src/navigation/AppNavigator";

import { View, Platform } from "react-native";

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider>
        <AppNavigator />
      </PaperProvider>
    </SafeAreaProvider>
  );
}