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
import { MaterialCommunityIcons } from "@expo/vector-icons";

const PURPLE = "#5A2D82";

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

function toISODateOnly(year: number, month: number, day: number) {
  const yyyy = String(year);
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function parseDateInput(val?: string) {
  if (!val) return { day: null, month: null, year: null };
  const str = String(val).trim();
  const mIso = /^(\d{4})-(\d{2})-(\d{2})/.exec(str);
  if (mIso) {
    return { year: Number(mIso[1]), month: Number(mIso[2]), day: Number(mIso[3]) };
  }
  const mLat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(str);
  if (mLat) {
    return { day: Number(mLat[1]), month: Number(mLat[2]), year: Number(mLat[3]) };
  }
  return { day: null, month: null, year: null };
}

interface DatePickerDropdownsProps {
  value?: string;
  onChange: (isoDate: string) => void;
  accentColor?: string;
  disabled?: boolean;
}

export default function DatePickerDropdowns({
  value,
  onChange,
  accentColor = PURPLE,
  disabled = false,
}: DatePickerDropdownsProps) {
  const parsed = useMemo(() => parseDateInput(value), [value]);

  const [selectedDay, setSelectedDay] = useState<number | null>(parsed.day);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(parsed.month);
  const [selectedYear, setSelectedYear] = useState<number | null>(parsed.year);
  const [activeDropdown, setActiveDropdown] = useState<"day" | "month" | "year" | null>(null);

  useEffect(() => {
    const fresh = parseDateInput(value);
    if (fresh.day !== selectedDay) setSelectedDay(fresh.day);
    if (fresh.month !== selectedMonth) setSelectedMonth(fresh.month);
    if (fresh.year !== selectedYear) setSelectedYear(fresh.year);
  }, [value]);

  const handleSelect = (day: number | null, month: number | null, year: number | null) => {
    if (day && month && year) {
      const maxDays = getDaysInMonth(month, year);
      const validDay = Math.min(day, maxDays);
      const iso = toISODateOnly(year, month, validDay);
      onChange(iso);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dropdownsRow}>
        {/* Campo Día */}
        <TouchableOpacity
          style={[
            styles.dropdownBox,
            activeDropdown === "day" && { borderColor: accentColor, backgroundColor: "#ffffff" },
          ]}
          activeOpacity={0.75}
          disabled={disabled}
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
            color={activeDropdown === "day" ? accentColor : "#666666"}
          />
        </TouchableOpacity>

        {/* Campo Mes */}
        <TouchableOpacity
          style={[
            styles.dropdownBox,
            activeDropdown === "month" && { borderColor: accentColor, backgroundColor: "#ffffff" },
          ]}
          activeOpacity={0.75}
          disabled={disabled}
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
            color={activeDropdown === "month" ? accentColor : "#666666"}
          />
        </TouchableOpacity>

        {/* Campo Año */}
        <TouchableOpacity
          style={[
            styles.dropdownBox,
            activeDropdown === "year" && { borderColor: accentColor, backgroundColor: "#ffffff" },
          ]}
          activeOpacity={0.75}
          disabled={disabled}
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
            color={activeDropdown === "year" ? accentColor : "#666666"}
          />
        </TouchableOpacity>
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
                        isSelected && { backgroundColor: accentColor === PURPLE ? "#F3ECFA" : "#f2ecfa" },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedDay(d);
                        setActiveDropdown(null);
                        handleSelect(d, selectedMonth, selectedYear);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && { color: accentColor, fontWeight: "700" },
                        ]}
                      >
                        {d}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color={accentColor}
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
                        isSelected && { backgroundColor: accentColor === PURPLE ? "#F3ECFA" : "#f2ecfa" },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedMonth(m.value);
                        setActiveDropdown(null);
                        handleSelect(selectedDay, m.value, selectedYear);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && { color: accentColor, fontWeight: "700" },
                        ]}
                      >
                        {m.label}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color={accentColor}
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
                        isSelected && { backgroundColor: accentColor === PURPLE ? "#F3ECFA" : "#f2ecfa" },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setSelectedYear(y);
                        setActiveDropdown(null);
                        handleSelect(selectedDay, selectedMonth, y);
                      }}
                    >
                      <Text
                        style={[
                          styles.optionText,
                          isSelected && { color: accentColor, fontWeight: "700" },
                        ]}
                      >
                        {y}
                      </Text>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check"
                          size={20}
                          color={accentColor}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  dropdownsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  dropdownBox: {
    flex: 1,
    height: 48,
    backgroundColor: "#F6F6F8",
    borderWidth: 1.5,
    borderColor: "#E1DCEE",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  dropdownPlaceholder: {
    color: "#a89fbf",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    maxHeight: 360,
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      web: { boxShadow: "0px 10px 25px rgba(0,0,0,0.2)" } as any,
      default: { elevation: 10 },
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
    maxHeight: 260,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginVertical: 2,
  },
  optionText: {
    fontSize: 15,
    color: "#333333",
    fontWeight: "500",
  },
});
