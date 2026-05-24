import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationsDropdown from "./NotificationsDropdown";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";

interface HeaderHomeProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export default function HeaderHome({ searchQuery, onSearchChange }: HeaderHomeProps) {
  const insets = useSafeAreaInsets();
  const [openNoti, setOpenNoti] = useState(false);

  const [fontsLoaded] = useFonts({
    SansitaBoldItalic: Sansita_700Bold_Italic,
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, fontsLoaded && { fontFamily: "SansitaBoldItalic" }]}>
          LE CHAMBEA
        </Text>

        <TouchableOpacity onPress={() => setOpenNoti((v) => !v)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="bell-outline" size={26} color="#5A2D82" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { marginTop: 15, marginBottom: 8 }]}>
        <TextInput 
          placeholder="¿Qué servicio buscas hoy?" 
          style={styles.input} 
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <MaterialCommunityIcons name="magnify" size={22} color="#5A2D82" />
      </View>

      <NotificationsDropdown
        visible={openNoti}
        onClose={() => setOpenNoti(false)}
        notifications={[]} // por ahora vacío => muestra “Aun no hay notificaciones”
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#222",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 8,
  },
});
