import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
  Platform,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import type { RegisterStackParamList } from "../../../core/navigation/types";
import { RegisterSharedProps } from "../models/register.types";
import { useFonts, Sansita_700Bold_Italic } from "@expo-google-fonts/sansita";
import { TextInput } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../core/navigation/types";

type Props =
  NativeStackScreenProps<RegisterStackParamList, "RegisterBirth"> &
  RegisterSharedProps;

const TOTAL_STEPS = 4;
const CURRENT_STEP = 1; // RegisterBirth = paso 2/4

// ✅ Requisito de edad mínima
const MIN_AGE = 16;

function toISODateOnly(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isoToES(iso: string) {
  // yyyy-mm-dd -> dd/mm/yyyy
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return "";
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function parseESDate(es: string): Date | null {
  // dd/mm/yyyy
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(es);
  if (!m) return null;

  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);

  const dt = new Date(y, mo, d);
  // Validación estricta: evita 32/13/2020, etc.
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt;
}

function calcAge(birth: Date, now = new Date()) {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function isReasonableBirthDate(date: Date) {
  const today = new Date();
  const min = new Date(
    today.getFullYear() - 100,
    today.getMonth(),
    today.getDate()
  );
  const max = today;
  return date >= min && date <= max;
}

function normalizeESInput(text: string) {
  // Mantiene solo números y coloca / automáticamente: dd/mm/yyyy
  const digits = text.replace(/[^0-9]/g, "").slice(0, 8); // ddmmyyyy
  const parts: string[] = [];
  if (digits.length >= 2) parts.push(digits.slice(0, 2));
  else parts.push(digits);

  if (digits.length >= 4) parts.push(digits.slice(2, 4));
  else if (digits.length > 2) parts.push(digits.slice(2));

  if (digits.length > 4) parts.push(digits.slice(4));

  return parts.filter(Boolean).join("/");
}

export default function RegisterBirth({ navigation, formData, setFormData }: Props) {
  const insets = useSafeAreaInsets();

  const [showPicker, setShowPicker] = useState(false);
  const [showWhy, setShowWhy] = useState(false);

  const [fontsLoaded] = useFonts({
    SansitaBoldItalic: Sansita_700Bold_Italic,
  });

  // ✅ Texto editable mostrado en el input (dd/mm/yyyy)
  const [birthText, setBirthText] = useState<string>(() => {
    const iso = String(formData?.birthDate || "");
    return iso ? isoToES(iso) : "";
  });

  const parsedBirth = useMemo(() => parseESDate(birthText), [birthText]);
  const age = useMemo(() => {
    if (!parsedBirth) return null;
    if (!isReasonableBirthDate(parsedBirth)) return null;
    const a = calcAge(parsedBirth);
    return a >= 0 ? a : null;
  }, [parsedBirth]);

  // ✅ Ahora también valida edad mínima
  const canContinue =
    !!parsedBirth &&
    isReasonableBirthDate(parsedBirth) &&
    age !== null &&
    age >= MIN_AGE;

  const onOpenPicker = () => setShowPicker(true);

  const onChangeDate = (event: DateTimePickerEvent, selected?: Date) => {
    // Si cancela en Android, selected viene undefined
    if (Platform.OS === "android") setShowPicker(false);

    // iOS puede emitir "dismissed" también
    if (event.type === "dismissed") return;

    if (selected) {
      // Guardamos en formData como ISO, pero mostramos ES
      const iso = toISODateOnly(selected);
      setFormData((prev) => ({ ...prev, birthDate: iso }));
      setBirthText(isoToES(iso));
    }
  };

  const onChangeBirthText = (text: string) => {
    const normalized = normalizeESInput(text);
    setBirthText(normalized);

    // Si ya está completa y válida, la guardamos en formData
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) {
      const dt = parseESDate(normalized);
      if (dt && isReasonableBirthDate(dt)) {
        setFormData((prev) => ({ ...prev, birthDate: toISODateOnly(dt) }));
      }
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#816ab4" />
      </View>
    );
  }

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

  // Picker abre en HOY si no hay fecha válida
  const pickerDate =
    parsedBirth && isReasonableBirthDate(parsedBirth) ? parsedBirth : new Date();



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

        <Text style={styles.title}>¿Cuándo naciste?</Text>

        <Text style={styles.subtitle}>
          Elige una fecha de nacimiento, podrás configurarla como privada más
          adelante.{" "}
          <Text style={styles.whyLink} onPress={() => setShowWhy(true)}>
            ¿Por qué tengo que indicar mi fecha de nacimiento?
          </Text>
        </Text>

        <View style={styles.form}>
          {/* ✅ MISMO BLOQUE: se escribe + icono calendario */}
          <View style={styles.birthRow}>
            <Text style={styles.birthLabel}>
              Fecha de nacimiento{" "}
              {age !== null ? (
                <Text style={styles.ageInline}>({age} años)</Text>
              ) : null}
            </Text>

            <View style={styles.birthInputRow}>
              <TextInput
                value={birthText}
                onChangeText={onChangeBirthText}
                placeholder="dd/mm/aaaa"
                mode="outlined"
                style={styles.birthInput}
                outlineColor="#E0E0E0"
                activeOutlineColor="#816ab4"
                keyboardType="number-pad"
                returnKeyType="done"
              />

              <TouchableOpacity
                style={styles.calendarBtn}
                activeOpacity={0.8}
                onPress={onOpenPicker}
              >
                <MaterialCommunityIcons
                  name="calendar-month"
                  size={22}
                  color="#5b5c9c"
                />
              </TouchableOpacity>
            </View>

            {/* Mensajes de error suaves */}
            {birthText.length > 0 && !parsedBirth && birthText.length === 10 && (
              <Text style={styles.errorText}>Fecha inválida. Usa dd/mm/aaaa.</Text>
            )}
            {parsedBirth && !isReasonableBirthDate(parsedBirth) && (
              <Text style={styles.errorText}>Elige una fecha válida (no futura).</Text>
            )}

            {/* ✅ Error por edad mínima */}
            {parsedBirth &&
              isReasonableBirthDate(parsedBirth) &&
              age !== null &&
              age < MIN_AGE && (
                <Text style={styles.errorText}>
                  Debes tener al menos {MIN_AGE} años para unirte.
                </Text>
              )}
          </View>

          <TouchableOpacity
            style={[
              styles.primaryButton,
              !canContinue && styles.primaryButtonDisabled,
            ]}
            activeOpacity={0.85}
            disabled={!canContinue}
            onPress={() => {
              if (!canContinue) return;
              navigation.navigate("RegisterGender");
            }}
          >
            <Text style={styles.primaryButtonText}>Siguiente</Text>
          </TouchableOpacity>
        </View>
      </View>



      {/* Bottom sheet: Por qué */}
      <Modal
        transparent
        animationType="slide"
        visible={showWhy}
        onRequestClose={() => setShowWhy(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setShowWhy(false)}>
          <Pressable
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 14) },
            ]}
          >
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>¿Por qué pedimos tu fecha?</Text>

              <TouchableOpacity
                onPress={() => setShowWhy(false)}
                activeOpacity={0.8}
                style={styles.sheetCloseBtn}
              >
                <Text style={styles.closeXText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sheetText}>
              La fecha de nacimiento nos ayuda a:
              {"\n\n"}• Mejorar la seguridad y proteger cuentas.
              {"\n"}• Ofrecer una experiencia adecuada a la edad.
              {"\n"}• Personalizar algunas funciones más adelante.
              {"\n\n"}Puedes configurarla como privada cuando quieras.
            </Text>

            <TouchableOpacity
              style={[styles.primaryButton, { marginTop: 14 }]}
              activeOpacity={0.85}
              onPress={() => setShowWhy(false)}
            >
              <Text style={styles.primaryButtonText}>Entendido</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Picker */}
      {showPicker && Platform.OS === "android" && (
        <DateTimePicker
          value={pickerDate}
          mode="date"
          display="calendar"
          onChange={onChangeDate}
          maximumDate={new Date()}
        />
      )}

      {showPicker && Platform.OS === "ios" && (
        <Modal transparent animationType="fade" visible={showPicker}>
          <Pressable
            style={styles.pickerBackdrop}
            onPress={() => setShowPicker(false)}
          >
            <Pressable
              style={[
                styles.pickerCard,
                { paddingBottom: Math.max(insets.bottom, 14) },
              ]}
            >
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Selecciona tu fecha</Text>

                <TouchableOpacity
                  onPress={() => setShowPicker(false)}
                  activeOpacity={0.8}
                  style={styles.closeX}
                >
                  <Text style={styles.closeXText}>×</Text>
                </TouchableOpacity>
              </View>

              <DateTimePicker
                value={pickerDate}
                mode="date"
                display="spinner"
                onChange={onChangeDate}
                maximumDate={new Date()}
              />

              <TouchableOpacity
                style={[styles.primaryButton, { marginTop: 14 }]}
                activeOpacity={0.85}
                onPress={() => setShowPicker(false)}
              >
                <Text style={styles.primaryButtonText}>Listo</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>
      )}
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

  whyLink: {
    color: "#1D4ED8",
    fontWeight: "700",
  },

  form: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
  },

  birthRow: {
    marginBottom: 12,
  },

  birthLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "800",
    marginBottom: 6,
  },

  ageInline: {
    color: "#333",
    fontWeight: "900",
  },

  birthInputRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  birthInput: {
    flex: 1,
    backgroundColor: "#ffffff",
  },

  calendarBtn: {
    marginLeft: 10,
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },

  errorText: {
    color: "#b00020",
    fontSize: 12,
    marginTop: 6,
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    width: "100%",
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
    shadowColor: "#5b5c9c",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 6,
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },



  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 18,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
  },
  sheetCloseBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#5b5c9c",
    justifyContent: "center",
    alignItems: "center",
  },
  closeXText: {
    color: "white",
    fontSize: 28,
    marginTop: -2,
    fontWeight: "900",
  },
  sheetText: {
    color: "#555",
    fontSize: 14,
    lineHeight: 20,
  },

  pickerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  pickerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
  },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#333",
  },
  closeX: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#5b5c9c",
    justifyContent: "center",
    alignItems: "center",
  },
});
