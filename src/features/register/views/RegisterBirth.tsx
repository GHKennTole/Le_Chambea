import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import type { RegisterStackParamList } from "../../../core/navigation/types";
import { RegisterSharedProps } from "../models/register.types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = NativeStackScreenProps<RegisterStackParamList, "RegisterBirth"> &
  RegisterSharedProps;

const TOTAL_STEPS = 4;
const CURRENT_STEP = 1; // RegisterBirth = paso 2/4
const MIN_AGE = 16;

const MONTHS = [
  { value: 1, label: "Enero" },
  { value: 2, label: "Febrero" },
  { value: 3, label: "Marzo" },
  { value: 4, label: "Abril" },
  { value: 5, label: "Mayo" },
  { value: 6, label: "Junio" },
  { value: 7, label: "Julio" },
  { value: 8, label: "Agosto" },
  { value: 9, label: "Septiembre" },
  { value: 10, label: "Octubre" },
  { value: 11, label: "Noviembre" },
  { value: 12, label: "Diciembre" },
];

function getDaysInMonth(month: number | null, year: number | null) {
  if (!month) return 31;
  const y = year || 2024;
  return new Date(y, month, 0).getDate();
}

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 101 }, (_, i) => currentYear - i);

function toISODateOnly(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  return date >= min && date <= today;
}

export default function RegisterBirth({ navigation, formData, setFormData }: Props) {
  const insets = useSafeAreaInsets();

  const initialDate = useMemo(() => {
    const iso = String(formData?.birthDate || "");
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) {
      return {
        year: Number(m[1]),
        month: Number(m[2]),
        day: Number(m[3]),
      };
    }
    return { year: null, month: null, day: null };
  }, []);

  const [selectedDay, setSelectedDay] = useState<number | null>(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(initialDate.month);
  const [selectedYear, setSelectedYear] = useState<number | null>(initialDate.year);
  const [activeDropdown, setActiveDropdown] = useState<"day" | "month" | "year" | null>(null);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const maxDays = getDaysInMonth(selectedMonth, selectedYear);
      const validDay = Math.min(selectedDay, maxDays);
      if (validDay !== selectedDay) {
        setSelectedDay(validDay);
      }
      const dt = new Date(selectedYear, selectedMonth - 1, validDay);
      if (
        dt.getFullYear() === selectedYear &&
        dt.getMonth() === selectedMonth - 1 &&
        dt.getDate() === validDay
      ) {
        const iso = toISODateOnly(dt);
        setFormData((prev: any) => ({ ...prev, birthDate: iso }));
      }
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const parsedBirth = useMemo(() => {
    if (!selectedDay || !selectedMonth || !selectedYear) return null;
    const maxDays = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDays) return null;
    return new Date(selectedYear, selectedMonth - 1, selectedDay);
  }, [selectedDay, selectedMonth, selectedYear]);

  const age = useMemo(() => {
    if (!parsedBirth) return null;
    if (!isReasonableBirthDate(parsedBirth)) return null;
    const a = calcAge(parsedBirth);
    return a >= 0 ? a : null;
  }, [parsedBirth]);

  const canContinue =
    !!parsedBirth &&
    isReasonableBirthDate(parsedBirth) &&
    age !== null &&
    age >= MIN_AGE;

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
      {/* Header flotante */}
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
          <Text style={styles.birthLabel}>
            Fecha de nacimiento{" "}
            {age !== null ? (
              <Text style={styles.ageInline}>({age} años)</Text>
            ) : null}
          </Text>

          {/* Selector de 3 campos tipo Facebook: [Día v] [Mes v] [Año v] */}
          <View style={styles.dropdownsRow}>
            {/* Campo Día */}
            <TouchableOpacity
              style={[
                styles.dropdownBox,
                activeDropdown === "day" && styles.dropdownBoxActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setActiveDropdown("day")}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedDay && styles.dropdownPlaceholder,
                ]}
              >
                {selectedDay ? String(selectedDay) : "Día"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={22}
                color={activeDropdown === "day" ? "#816ab4" : "#666666"}
              />
            </TouchableOpacity>

            {/* Campo Mes */}
            <TouchableOpacity
              style={[
                styles.dropdownBox,
                activeDropdown === "month" && styles.dropdownBoxActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setActiveDropdown("month")}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedMonth && styles.dropdownPlaceholder,
                ]}
                numberOfLines={1}
              >
                {selectedMonth
                  ? MONTHS.find((m) => m.value === selectedMonth)?.label
                  : "Mes"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={22}
                color={activeDropdown === "month" ? "#816ab4" : "#666666"}
              />
            </TouchableOpacity>

            {/* Campo Año */}
            <TouchableOpacity
              style={[
                styles.dropdownBox,
                activeDropdown === "year" && styles.dropdownBoxActive,
              ]}
              activeOpacity={0.75}
              onPress={() => setActiveDropdown("year")}
            >
              <Text
                style={[
                  styles.dropdownText,
                  !selectedYear && styles.dropdownPlaceholder,
                ]}
              >
                {selectedYear ? String(selectedYear) : "Año"}
              </Text>
              <MaterialCommunityIcons
                name="chevron-down"
                size={22}
                color={activeDropdown === "year" ? "#816ab4" : "#666666"}
              />
            </TouchableOpacity>
          </View>

          {/* Mensajes de error suaves */}
          {parsedBirth && !isReasonableBirthDate(parsedBirth) && (
            <Text style={styles.errorText}>Elige una fecha válida (no futura).</Text>
          )}

          {parsedBirth &&
            isReasonableBirthDate(parsedBirth) &&
            age !== null &&
            age < MIN_AGE && (
              <Text style={styles.errorText}>
                Debes tener al menos {MIN_AGE} años para unirte.
              </Text>
            )}

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

      {/* Modal Desplegable de Selección (Día / Mes / Año) */}
      <Modal
        transparent
        animationType="fade"
        visible={activeDropdown !== null}
        onRequestClose={() => setActiveDropdown(null)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setActiveDropdown(null)}
        >
          <Pressable
            style={styles.modalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeDropdown === "day" && "Selecciona el Día"}
                {activeDropdown === "month" && "Selecciona el Mes"}
                {activeDropdown === "year" && "Selecciona el Año"}
              </Text>

              <TouchableOpacity
                onPress={() => setActiveDropdown(null)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="close" size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.optionsList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {activeDropdown === "day" &&
                Array.from(
                  { length: getDaysInMonth(selectedMonth, selectedYear) },
                  (_, i) => i + 1
                ).map((d) => {
                  const isSelected = selectedDay === d;
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedDay(d);
                        setActiveDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {d}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="#816ab4"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

              {activeDropdown === "month" &&
                MONTHS.map((m) => {
                  const isSelected = selectedMonth === m.value;
                  return (
                    <TouchableOpacity
                      key={m.value}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedMonth(m.value);
                        setActiveDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {m.label}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="#816ab4"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}

              {activeDropdown === "year" &&
                YEARS.map((y) => {
                  const isSelected = selectedYear === y;
                  return (
                    <TouchableOpacity
                      key={y}
                      style={[
                        styles.optionItem,
                        isSelected && styles.optionItemSelected,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedYear(y);
                        setActiveDropdown(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && styles.optionTextSelected,
                        ]}
                      >
                        {y}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color="#816ab4"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal Bottom Sheet: Por qué */}
      <Modal
        transparent
        animationType="slide"
        visible={showWhy}
        onRequestClose={() => setShowWhy(false)}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => setShowWhy(false)}
        >
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
    color: "#0066cc",
    fontWeight: "bold",
  },

  form: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 360,
  },

  birthLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 8,
  },

  ageInline: {
    fontSize: 14,
    fontWeight: "600",
    color: "#816ab4",
  },

  /* Contenedor de los 3 desplegables */
  dropdownsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  dropdownBox: {
    flex: 1,
    height: 50,
    backgroundColor: "#f4f2f8",
    borderWidth: 1.5,
    borderColor: "#e1dcee",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },

  dropdownBoxActive: {
    borderColor: "#816ab4",
    backgroundColor: "#ffffff",
  },

  dropdownText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1a1a1a",
  },

  dropdownPlaceholder: {
    color: "#a89fbf",
    fontWeight: "500",
  },

  errorText: {
    color: "#b00020",
    fontSize: 12,
    marginTop: 2,
    marginBottom: 10,
    fontWeight: "700",
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    width: "100%",
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 10,
    ...Platform.select({
      web: { boxShadow: "0px 4px 8px rgba(91,92,156,0.3)" } as any,
      default: {
        shadowColor: "#5b5c9c",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
      },
    }),
  },
  primaryButtonDisabled: { opacity: 0.55 },
  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  /* Styles para el Modal Desplegable (Día / Mes / Año) */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },

  modalCard: {
    width: "100%",
    maxWidth: 320,
    maxHeight: 340,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: "0px 10px 25px rgba(0,0,0,0.2)" } as any,
      default: {
        elevation: 10,
      },
    }),
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },

  modalCloseBtn: {
    padding: 4,
  },

  optionsList: {
    maxHeight: 250,
  },

  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
  },

  optionItemSelected: {
    backgroundColor: "#f2ecfa",
  },

  optionText: {
    fontSize: 16,
    color: "#333333",
    fontWeight: "500",
  },

  optionTextSelected: {
    color: "#816ab4",
    fontWeight: "700",
  },

  /* Bottom sheet "Por qué" */
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
});
