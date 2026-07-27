import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import MainLayout from "../../../shared/components/MainLayout";

const PURPLE = "#5A2D82";

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <MainLayout active="Home" hideBottomNav={false}>
      <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
        <View style={styles.card}>
          <MaterialCommunityIcons name="magnify" size={60} color={PURPLE} />
          <Text style={styles.title}>Pantalla de Búsqueda</Text>
          <Text style={styles.subtitle}>
            La búsqueda de servicios y profesionales se realiza directamente desde la barra de búsqueda en Inicio.
          </Text>

          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="home-outline" size={20} color="white" />
            <Text style={styles.exitButtonText}>Salir y Regresar a Inicio</Text>
          </TouchableOpacity>
        </View>

        <FloatingBackButton />
      </View>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F8",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    maxWidth: 450,
    width: "100%",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.1)" } as any,
      default: {
        elevation: 4,
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 24,
  },
  exitButton: {
    backgroundColor: PURPLE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
    width: "100%",
  },
  exitButtonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
