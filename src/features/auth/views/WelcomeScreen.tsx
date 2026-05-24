import React from "react";
import { View, StyleSheet, Text, Image, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";
import type { RootStackParamList } from "../../../core/navigation/types";

type Nav = NativeStackNavigationProp<RootStackParamList, "Welcome">;

export default function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    SansitaBoldItalic: Sansita_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#8E44AD" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>

      <View style={styles.mainContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Image
              source={require("../../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.appTitle}>LE CHAMBEA</Text>
        </View>
      </View>

      <View style={[styles.bottomSection, { marginBottom: insets.bottom }]}>
        <TouchableOpacity
          style={styles.loginButton}
          onPress={() => navigation.navigate("Login")}
          activeOpacity={0.8}
        >
          <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
        </TouchableOpacity>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>¿Aún no tienes una cuenta? </Text>
          <TouchableOpacity onPress={() => navigation.navigate("Register")}>
            <Text style={styles.registerLink}>Regístrate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  mainContent: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 24 },
  logoContainer: { alignItems: "center" },
  logoCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.1)' } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
      }
    }),
  },
  logo: { width: 250, height: 250 },
  appTitle: {
    fontSize: 45,
    fontFamily: "SansitaBoldItalic",
    color: "#333333",
    letterSpacing: 1.2,
    marginBottom: 8,
    transform: [{ skewX: "-5deg" }],
    ...Platform.select({
      web: { textShadow: '0px 4px 4px rgba(0,0,0,0.25)' } as any,
      default: {
        textShadowColor: "rgba(0, 0, 0, 0.25)",
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 4,
      }
    }),
  },
  bottomSection: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 1,
    paddingBottom: 10,
    alignItems: "center",
    borderTopWidth: 0,
    backgroundColor: "#ffffff",
  },
  loginButton: {
    backgroundColor: "#816ab4",
    width: "100%",
    maxWidth: 280,
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(91,92,156,0.3)' } as any,
      default: {
        shadowColor: "#5b5c9c",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      }
    }),
  },
  loginButtonText: { color: "white", fontSize: 19, fontWeight: "bold", fontFamily: "roboto" },
  registerContainer: { flexDirection: "row", alignItems: "center" },
  registerText: { fontSize: 15, color: "#000000", fontFamily: "roboto" },
  registerLink: { fontSize: 15, color: "#007bffa1", fontWeight: "600", textDecorationLine: "underline" },

  devButton: {
    position: "absolute",
    zIndex: 9999,
    backgroundColor: "#5b5c9c",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    ...Platform.select({
      web: { boxShadow: '0px 3px 5px rgba(0,0,0,0.25)' } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        elevation: 5,
      }
    }),
  },
  devButtonText: {
    color: "white",
    fontWeight: "900",
    fontSize: 12,
    letterSpacing: 0.5,
  },
});