import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { RegisterStackParamList } from "../../../core/navigation/types";
import { RegisterSharedProps } from "../models/register.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

type Props = NativeStackScreenProps<RegisterStackParamList, "RegisterName"> & RegisterSharedProps;

const TOTAL_STEPS = 4;
const CURRENT_STEP = 0; // RegisterName = paso 1/4

// ✅ Letras (incluye acentos), espacios, guion y apóstrofe. Sin números.
const NAME_REGEX = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]+$/;

function normalizeNameInput(raw: string) {
  const allowed = raw.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, "");
  const singleSpaced = allowed.replace(/\s{2,}/g, " ");
  return singleSpaced.slice(0, 40);
}

function isValidHumanName(value: string) {
  const v = value.trim();

  if (v.length < 3) return false;

  const hasLetter = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(v);
  if (!hasLetter) return false;

  if (!NAME_REGEX.test(v)) return false;

  if (/^[-']/.test(v) || /[-']$/.test(v)) return false;

  return true;
}

export default function RegisterName({ navigation, formData, setFormData }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [touched, setTouched] = useState({ name: false, lastName: false });



  const nameValue = String(formData?.name || "");
  const lastNameValue = String(formData?.lastName || "");

  const nameOk = isValidHumanName(nameValue);
  const lastNameOk = isValidHumanName(lastNameValue);
  const canContinue = nameOk && lastNameOk;

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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ✅ Header flotante: bolitas arriba + botón atrás */}
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
        {/* Spacer para dejar espacio al header flotante */}
        <View style={{ height: 85 }} />

        <Text style={styles.title}>¿Cómo te llamas?</Text>
        <Text style={styles.subtitle}>Ingresa tu nombre verdadero.</Text>

        <View style={styles.form}>
          <TextInput
            label="Nombre"
            value={nameValue}
            onChangeText={(text) => {
              const clean = normalizeNameInput(text);
              setFormData((prev: any) => ({ ...prev, name: clean }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, name: true }))}
            style={styles.input}
            mode="outlined"
            outlineColor="#E0E0E0"
            activeOutlineColor="#816ab4"
            textColor="#1a1a1a"
            autoCapitalize="words"
            left={<TextInput.Icon icon="account" />}
          />

          {touched.name && !nameOk && (
            <Text style={styles.errorText}>
              Escribe un nombre válido, con mínimo 3 letras (sin números ni símbolos).
            </Text>
          )}

          <TextInput
            label="Apellido"
            value={lastNameValue}
            onChangeText={(text) => {
              const clean = normalizeNameInput(text);
              setFormData((prev: any) => ({ ...prev, lastName: clean }));
            }}
            onBlur={() => setTouched((p) => ({ ...p, lastName: true }))}
            style={styles.input}
            mode="outlined"
            outlineColor="#E0E0E0"
            activeOutlineColor="#816ab4"
            textColor="#1a1a1a"
            autoCapitalize="words"
            left={<TextInput.Icon icon="account-outline" />}
          />

          {touched.lastName && !lastNameOk && (
            <Text style={styles.errorText}>
              Escribe un apellido válido con mínimo 3 letras (sin números ni símbolos).
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !canContinue && styles.primaryButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!canContinue}
            onPress={() => navigation.navigate("RegisterBirth")}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
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
    backgroundColor: "transparent",
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

  doneDot: {
    backgroundColor: "#9b7bd6",
  },

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
    fontSize: 30,
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

  form: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
  },

  input: {
    backgroundColor: "#ffffff",
    marginBottom: 12,
  },

  errorText: {
    color: "#b00020",
    fontSize: 12,
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    width: "100%",
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


});
