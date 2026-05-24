import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RegisterStackParamList } from "../../../core/navigation/types";
import { RegisterSharedProps } from "../models/register.types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";

const { width } = Dimensions.get("window");

type Props = NativeStackScreenProps<RegisterStackParamList, "RegisterWelcome"> & RegisterSharedProps;


export default function RegisterWelcome({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const [fontsLoaded] = useFonts({
    SansitaBoldItalic: Sansita_700Bold_Italic,
  });

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#816ab4" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Botón flotante atrás */}
      <FloatingBackButton
        position="top-right"
        backgroundColor="#5b5c9c"
        iconColor="white"
        onPress={() => navigation.getParent()?.goBack()}
      />

      {/* Contenido */}
      <View style={styles.contenido}>
        <Image
          source={require("../../../assets/images/login.png")}
          style={styles.image}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Únete a <Text style={styles.brandText}>LE CHAMBEA</Text>
        </Text>

        <Text style={styles.subtitle}>
          Crea una cuenta para encontrar servicios, ofrecer tu trabajo y conectar
          con personas cerca de ti.
        </Text>

        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("RegisterName")}
        >
          <Text style={styles.primaryButtonText}>Crear cuenta nueva</Text>
        </TouchableOpacity>
      </View>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  contenido: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  image: {
    width: Math.min(width * 2, 300),
    height: Math.min(width * 2, 300),
    marginBottom: -20,
  },

  title: {
    fontSize: 30,
    color: "#333333",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "600",
  },

  brandText: {
    fontFamily: "SansitaBoldItalic",
    letterSpacing: 1.2,
    color: "#333333",
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

  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 22,
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    width: "100%",
    maxWidth: 320,
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
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

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },


});
