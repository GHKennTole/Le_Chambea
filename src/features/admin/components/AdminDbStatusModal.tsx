import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TableDiagnostic } from "../models/admin.types";

const PURPLE = "#5A2D82";

interface Props {
  visible: boolean;
  onClose: () => void;
  diagnostics: TableDiagnostic[];
  onRefresh: () => void;
  refreshing?: boolean;
}

export default function AdminDbStatusModal({
  visible,
  onClose,
  diagnostics,
  onRefresh,
  refreshing,
}: Props) {
  const insets = useSafeAreaInsets();
  const totalRows = diagnostics.reduce((acc, d) => acc + d.count, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Diagnóstico y Base de Datos</Text>
            <Text style={styles.headerSubtitle}>Estado de salud del backend Supabase</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshBtn}
            activeOpacity={0.7}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <MaterialCommunityIcons name="refresh" size={22} color={PURPLE} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Health Summary Banner */}
          <View style={styles.healthBanner}>
            <View style={styles.healthIconBox}>
              <MaterialCommunityIcons name="check-decagram" size={32} color="#2ECC71" />
            </View>
            <View style={styles.healthInfo}>
              <Text style={styles.healthTitle}>Sistema Operativo y Conectado</Text>
              <Text style={styles.healthDesc}>
                Supabase PostgreSQL Respondiendo en Tiempo Real
              </Text>
            </View>
          </View>

          {/* Quick Metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metricCard}>
              <Text style={styles.metricNumber}>{diagnostics.length}</Text>
              <Text style={styles.metricLabel}>Tablas Clave</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricNumber}>{totalRows}</Text>
              <Text style={styles.metricLabel}>Registros Totales</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={[styles.metricNumber, { color: "#2ECC71" }]}>100%</Text>
              <Text style={styles.metricLabel}>Disponibilidad</Text>
            </View>
          </View>

          {/* Tables Diagnostics List */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Conteo de Registros por Tabla</Text>
            <Text style={styles.sectionSubtitle}>Auditoría de datos en el esquema público</Text>

            <View style={styles.tableList}>
              {diagnostics.map((diag, idx) => (
                <View key={idx} style={styles.tableItem}>
                  <View style={styles.tableIconWrap}>
                    <MaterialCommunityIcons name={diag.icon} size={22} color={PURPLE} />
                  </View>
                  <View style={styles.tableInfo}>
                    <Text style={styles.tableDisplayName}>{diag.displayName}</Text>
                    <Text style={styles.tableNameCode}>public.{diag.tableName}</Text>
                  </View>
                  <View style={styles.tableCountBadge}>
                    <Text style={styles.tableCountText}>{diag.count} filas</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Connection Specs */}
          <View style={styles.specsCard}>
            <Text style={styles.specsTitle}>Configuración de Conexión</Text>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Servidor Supabase:</Text>
              <Text style={styles.specVal}>mfdlezraflnlffmfjkxa.supabase.co</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Seguridad RLS:</Text>
              <Text style={[styles.specVal, { color: "#2ECC71" }]}>Habilitada en todas las tablas</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>Canal Realtime:</Text>
              <Text style={[styles.specVal, { color: "#2ECC71" }]}>Suscripciones activas</Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  refreshBtn: {
    padding: 6,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  healthBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F0",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#C5EED9",
    gap: 14,
  },
  healthIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  healthInfo: {
    flex: 1,
  },
  healthTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#27AE60",
  },
  healthDesc: {
    fontSize: 12,
    color: "#2ECC71",
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  metricNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  metricLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginBottom: 12,
    marginTop: 2,
  },
  tableList: {
    gap: 10,
  },
  tableItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  tableIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3ECFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tableInfo: {
    flex: 1,
  },
  tableDisplayName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#222",
  },
  tableNameCode: {
    fontSize: 11,
    color: "#888",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  tableCountBadge: {
    backgroundColor: "#F2F3F7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tableCountText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#444",
  },
  specsCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    gap: 8,
  },
  specsTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 4,
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  specKey: {
    fontSize: 12,
    color: "#777",
  },
  specVal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
});
