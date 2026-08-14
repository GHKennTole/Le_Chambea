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
import { AdminMetrics } from "../models/admin.types";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  metrics: AdminMetrics;
  onLaunchAuditMode: () => void;
}

export default function AdminAiMetricsModal({
  visible,
  onClose,
  metrics,
  onLaunchAuditMode,
}: Props) {
  const insets = useSafeAreaInsets();

  const topQueries = [
    { name: "Plomería y Fontanería", count: 48, percentage: "32%" },
    { name: "Electricidad Residencial", count: 36, percentage: "24%" },
    { name: "Jardinería y Paisajismo", count: 28, percentage: "18%" },
    { name: "Carpintería y Muebles", count: 22, percentage: "14%" },
    { name: "Pintura y Albañilería", count: 18, percentage: "12%" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Métricas de Sula AI</Text>
            <Text style={styles.headerSubtitle}>Auditoría y estadísticas del asistente virtual</Text>
          </View>
          <View style={styles.aiBadge}>
            <MaterialCommunityIcons name="robot" size={16} color={PURPLE} />
            <Text style={styles.aiBadgeText}>Gemini AI</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main KPI Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#F4ECF7" }]}>
                <MaterialCommunityIcons name="message-processing-outline" size={24} color="#8E44AD" />
              </View>
              <Text style={styles.statNumber}>{metrics.aiQueriesCount}</Text>
              <Text style={styles.statLabel}>Consultas Procesadas</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#E8F8F0" }]}>
                <MaterialCommunityIcons name="account-star-outline" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.statNumber}>94.6%</Text>
              <Text style={styles.statLabel}>Precisión Estimada</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#EBF3FF" }]}>
                <MaterialCommunityIcons name="speedometer" size={24} color="#007AFF" />
              </View>
              <Text style={styles.statNumber}>1.2s</Text>
              <Text style={styles.statLabel}>Tiempo de Respuesta</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#FFF5E6" }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statNumber}>Activo</Text>
              <Text style={styles.statLabel}>Estado del Modelo</Text>
            </View>
          </View>

          {/* Audit Banner CTA */}
          <View style={styles.auditBanner}>
            <View style={styles.auditBannerLeft}>
              <Text style={styles.auditBannerTitle}>Modo Auditoría / Pruebas</Text>
              <Text style={styles.auditBannerDesc}>
                Interactúa con Sula AI en modo administrador para evaluar la recomendación de profesionales y calibrar prompts en vivo.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.auditBtn}
              activeOpacity={0.85}
              onPress={() => {
                onClose();
                onLaunchAuditMode();
              }}
            >
              <MaterialCommunityIcons name="brain" size={20} color="white" />
              <Text style={styles.auditBtnText}>Iniciar Auditoría</Text>
            </TouchableOpacity>
          </View>

          {/* Top Queried Categories */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Especialidades Más Consultadas</Text>
            <Text style={styles.sectionSubtitle}>
              Distribución de temas que los usuarios buscan a través del asistente
            </Text>

            <View style={styles.barsList}>
              {topQueries.map((item, idx) => (
                <View key={idx} style={styles.barItem}>
                  <View style={styles.barItemHeader}>
                    <Text style={styles.barItemName}>{item.name}</Text>
                    <Text style={styles.barItemValue}>
                      {item.count} consultas ({item.percentage})
                    </Text>
                  </View>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: item.percentage as any }]} />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Integration technical specs */}
          <View style={styles.techSpecsCard}>
            <Text style={styles.techSpecsTitle}>Especificaciones del Asistente</Text>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Motor de Inteligencia:</Text>
              <Text style={styles.techValue}>Google Gemini Flash</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Integración de Datos:</Text>
              <Text style={styles.techValue}>Supabase PostgreSQL (En vivo)</Text>
            </View>
            <View style={styles.techRow}>
              <Text style={styles.techLabel}>Algoritmo de Filtrado:</Text>
              <Text style={styles.techValue}>Similitud léxica y calificaciones ponderadas</Text>
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
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 4,
  },
  aiBadgeText: {
    color: PURPLE,
    fontSize: 11,
    fontWeight: "bold",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "flex-start",
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  auditBanner: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  auditBannerLeft: {
    gap: 4,
  },
  auditBannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  auditBannerDesc: {
    fontSize: 12,
    color: "#E2D3F5",
    lineHeight: 17,
  },
  auditBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
  },
  auditBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
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
    marginBottom: 14,
    marginTop: 2,
  },
  barsList: {
    gap: 12,
  },
  barItem: {
    gap: 4,
  },
  barItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  barItemValue: {
    fontSize: 11,
    color: "#777",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#F0F0F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: PURPLE,
    borderRadius: 4,
  },
  techSpecsCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    gap: 8,
  },
  techSpecsTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#444",
    marginBottom: 4,
  },
  techRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  techLabel: {
    fontSize: 12,
    color: "#777",
  },
  techValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333",
  },
});
