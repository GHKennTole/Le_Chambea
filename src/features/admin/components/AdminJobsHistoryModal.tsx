import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminJob } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  jobs: AdminJob[];
}

export default function AdminJobsHistoryModal({ visible, onClose, jobs }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "accepted" | "completed" | "rejected">("all");

  const filteredJobs = jobs.filter((j) => {
    const clientName = `${j.cliente?.nombre || ""} ${j.cliente?.apellidos || ""}`.toLowerCase();
    const proName = `${j.profesional?.nombre || ""} ${j.profesional?.apellidos || ""}`.toLowerCase();
    const prof = (j.profesional?.profesion || "").toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || clientName.includes(query) || proName.includes(query) || prof.includes(query);
    if (!matchesSearch) return false;

    if (filterStatus === "pending") return j.estado === "pending";
    if (filterStatus === "accepted") return j.estado === "accepted";
    if (filterStatus === "completed") return j.estado === "completed";
    if (filterStatus === "rejected") return j.estado === "rejected";

    return true;
  });

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case "completed":
        return { label: "Completado", bg: "#E8F8F0", color: "#2ECC71", icon: "check-circle" };
      case "accepted":
        return { label: "En Curso", bg: "#EBF3FF", color: "#007AFF", icon: "clock-outline" };
      case "rejected":
        return { label: "Rechazado", bg: "#FDEDEC", color: "#E74C3C", icon: "close-circle" };
      case "pending":
      default:
        return { label: "Pendiente", bg: "#FFF5E6", color: "#FF9500", icon: "alert-circle-outline" };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
          {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.select({
                web: 14,
                android: (insets.top || 24) + 6,
                ios: insets.top > 0 ? insets.top : 12,
                default: 14,
              }),
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Historial de Servicios</Text>
            <Text style={styles.headerSubtitle}>Historial de servicios realizados en la plataforma</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={22} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente, profesional o servicio..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips Scrollable */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsRow}
        >
          <TouchableOpacity
            style={[styles.chip, filterStatus === "all" && styles.chipActive]}
            onPress={() => setFilterStatus("all")}
          >
            <Text style={[styles.chipText, filterStatus === "all" && styles.chipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === "pending" && styles.chipActive]}
            onPress={() => setFilterStatus("pending")}
          >
            <Text style={[styles.chipText, filterStatus === "pending" && styles.chipTextActive]}>
              Pendientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === "accepted" && styles.chipActive]}
            onPress={() => setFilterStatus("accepted")}
          >
            <Text style={[styles.chipText, filterStatus === "accepted" && styles.chipTextActive]}>
              En Curso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === "completed" && styles.chipActive]}
            onPress={() => setFilterStatus("completed")}
          >
            <Text style={[styles.chipText, filterStatus === "completed" && styles.chipTextActive]}>
              Completados
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterStatus === "rejected" && styles.chipActiveDanger]}
            onPress={() => setFilterStatus("rejected")}
          >
            <Text style={[styles.chipText, filterStatus === "rejected" && styles.chipTextActiveDanger]}>
              Rechazados
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Contador previo a la lista de servicios */}
          <View style={styles.listCountHeader}>
            <Text style={styles.listCountText}>Total de Servicios: {filteredJobs.length}</Text>
          </View>

          {filteredJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="briefcase-clock-outline" size={54} color="#BBB" />
              <Text style={styles.emptyTitle}>
                {search.trim().length > 0
                  ? `No se encontraron servicios para "${search.trim()}"`
                  : filterStatus === "pending"
                  ? "No se encontraron servicios pendientes"
                  : filterStatus === "accepted"
                  ? "No se encontraron servicios en curso"
                  : filterStatus === "completed"
                  ? "No se encontraron servicios completados"
                  : filterStatus === "rejected"
                  ? "No se encontraron servicios rechazados"
                  : "No se encontraron servicios"}
              </Text>
            </View>
          ) : (
            filteredJobs.map((job) => {
              const clientName = `${job.cliente?.nombre || ""} ${job.cliente?.apellidos || ""}`.trim() || "Cliente";
              const proName = `${job.profesional?.nombre || ""} ${job.profesional?.apellidos || ""}`.trim() || "Profesional";
              const badge = getStatusBadge(job.estado);

              return (
                <View key={job.id} style={styles.jobCard}>
                  <View style={styles.jobHeader}>
                    <View style={styles.jobIdCol}>
                      <Text style={styles.serviceName}>{job.profesional?.profesion || "Servicio General"}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <MaterialCommunityIcons name={badge.icon as any} size={13} color={badge.color} />
                      <Text style={[styles.statusBadgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.partiesRow}>
                    <View style={styles.partyBox}>
                      <Text style={styles.partyRole}>CLIENTE SOLICITANTE</Text>
                      <Text style={styles.partyName} numberOfLines={1}>
                        {clientName}
                      </Text>
                      <Text style={styles.partyEmail} numberOfLines={1}>
                        {job.cliente?.correo || "Sin correo"}
                      </Text>
                    </View>

                    <MaterialCommunityIcons name="arrow-right" size={18} color="#CCC" />

                    <View style={styles.partyBox}>
                      <Text style={styles.partyRole}>PROFESIONAL ASIGNADO</Text>
                      <Text style={styles.partyName} numberOfLines={1}>
                        {proName}
                      </Text>
                      <Text style={styles.partyEmail} numberOfLines={1}>
                        {job.profesional?.correo || "Sin correo"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.jobFooter}>
                    <Text style={styles.jobDate}>
                      Creado:{" "}
                      {job.fecha_creacion
                        ? new Date(job.fecha_creacion).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "N/A"}
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
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
  listCountHeader: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  listCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "white",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#222",
  },
  chipsScroll: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    flexGrow: 0,
    flexShrink: 0,
  },
  chipsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F2F3F7",
    flexShrink: 0,
    ...Platform.select({
      web: { cursor: "pointer", whiteSpace: "nowrap" } as any,
    }),
  },
  chipActive: {
    backgroundColor: PURPLE,
  },
  chipActiveDanger: {
    backgroundColor: "#FF3B30",
  },
  chipText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "500",
  },
  chipTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  chipTextActiveDanger: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  jobCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  jobIdCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  jobIdText: {
    fontSize: 10,
    color: "#999",
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "bold",
  },
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9FB",
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginBottom: 8,
  },
  partyBox: {
    flex: 1,
  },
  partyRole: {
    fontSize: 9,
    fontWeight: "bold",
    color: "#888",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  partyName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  partyEmail: {
    fontSize: 11,
    color: "#777",
  },
  jobFooter: {
    alignItems: "flex-end",
  },
  jobDate: {
    fontSize: 11,
    color: "#999",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#888",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
