import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { RegisterStackParamList } from "../../../core/navigation/types";
import { RegisterSharedProps } from "../models/register.types";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../core/navigation/types";

type Props =
  NativeStackScreenProps<RegisterStackParamList, "RegisterGender"> &
  RegisterSharedProps;

const TOTAL_STEPS = 4;
const CURRENT_STEP = 2; // RegisterGender = paso 3/4

type GenderOption = {
  key: "mujer" | "hombre" | "no_especificar";
  label: string;
};

type GenderKey = GenderOption["key"];

const OPTIONS: GenderOption[] = [
  { key: "mujer", label: "Mujer" },
  { key: "hombre", label: "Hombre" },
  { key: "no_especificar", label: "Otro" },
];

export default function RegisterGender({ navigation, formData, setFormData }: Props) {
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

  const selected = String(formData?.genero || "");
  const canContinue = selected.length > 0;

  const setGender = (value: GenderKey) => {
    setFormData((prev) => ({ ...prev, genero: value }));
  };

  const renderDots = () =>
    Array.from({ length: TOTAL_STEPS }).map((_, index) => {
      const isActive = index === CURRENT_STEP;
      const isDone = index < CURRENT_STEP;

      return (
        <View
          key={index}
          style={[
            styles.dot,
            isDone && styles.doneDot,
            isActive && styles.activeDot,
          ]}
        />
      );
    });

  // ✅ parent tipado para navegar a root sin "as never"
  const rootNav =
    navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header flotante: bolitas + botón atrás */}
      <View style={[styles.topOverlay, { paddingTop: insets.top }]}>
        <View style={styles.dotsTop}>{renderDots()}</View>

        <FloatingBackButton
          position="top-right"
          backgroundColor="#5b5c9c"
          iconColor="white"
          onPress={() => navigation.goBack()}
          style={{ top: (insets.top || 0) + 10 }}
        />
      </View>

      {/* Contenido */}
      <View style={styles.contenido}>
        <View style={{ height: 85 }} />

        <Text style={styles.title}>¿Con qué género te identificas?</Text>

        <Text style={styles.subtitle}>
          Esto nos ayuda a personalizar tu experiencia. Puedes cambiarlo cuando
          quieras más adelante.
        </Text>

        <View style={styles.card}>
          {OPTIONS.map((opt) => {
            const isSelected = selected === opt.key;

            return (
              <TouchableOpacity
                key={opt.key}
                activeOpacity={0.8}
                onPress={() => setGender(opt.key)}
                style={styles.optionRow}
              >
                {/* Radio */}
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && styles.radioOuterSelected,
                  ]}
                >
                  {isSelected ? <View style={styles.radioInner} /> : null}
                </View>

                <Text style={styles.optionText}>{opt.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[
            styles.primaryButton,
            !canContinue && styles.primaryButtonDisabled,
          ]}
          activeOpacity={0.85}
          disabled={!canContinue}
          onPress={() => navigation.navigate("RegisterAuth")}
        >
          <Text style={styles.primaryButtonText}>Siguiente</Text>
        </TouchableOpacity>
      </View>

      {/* Footer fijo: Buscar mi cuenta */}
      <View
        style={[
          styles.footerFixed,
          { paddingBottom: Math.max(insets.bottom, 14) },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => rootNav?.navigate("ForgotPassword")}
          style={styles.searchBtn}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={styles.searchAccountText}>Buscar mi cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },

  topOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    zIndex: 50,
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 6,
  },
  dotsTop: {
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
    backgroundColor: "#c7b3f0",
  },
  doneDot: { backgroundColor: "#9b7bd6" },
  activeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#816ab4",
  },

  contenido: {
    flex: 1,
    paddingHorizontal: 24,
    backgroundColor: "#ffffff",
  },

  title: {
    fontSize: 28,
    color: "#333333",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: "700",
  },

  subtitle: {
    fontSize: 16,
    color: "#555555",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 18,
  },

  card: {
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 16,
    paddingVertical: 6,
    marginBottom: 18,
  },

  optionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },

  optionText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
  },

  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#B0B0B0",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },

  radioOuterSelected: {
    borderColor: "#816ab4",
  },

  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#816ab4",
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    width: "100%",
    maxWidth: 360,
    alignSelf: "center",
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
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

  primaryButtonDisabled: {
    opacity: 0.55,
  },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  footerFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  searchBtn: {
    paddingTop: 10,
    paddingBottom: 10,
    marginBottom: 10,
  },

  searchAccountText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
