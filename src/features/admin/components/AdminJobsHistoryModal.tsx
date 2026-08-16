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
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredJobs = jobs.filter((j) => {
    const clientName = `${j.cliente?.nombre || ""} ${j.cliente?.apellidos || ""}`.toLowerCase();
    const proName = `${j.profesional?.nombre || ""} ${j.profesional?.apellidos || ""}`.toLowerCase();
    const prof = (j.profesional?.profesion || "").toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || clientName.includes(query) || proName.includes(query) || prof.includes(query);
    const matchesStatus = !statusFilter || j.estado === statusFilter;

    return matchesSearch && matchesStatus;
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
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Historial Global de Trabajos</Text>
            <Text style={styles.headerSubtitle}>{jobs.length} solicitudes registradas en la app</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{filteredJobs.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por cliente, profesional o servicio..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
        >
          <TouchableOpacity
            style={[styles.chip, statusFilter === null && styles.chipActive]}
            onPress={() => setStatusFilter(null)}
          >
            <Text style={[styles.chipText, statusFilter === null && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, statusFilter === "pending" && styles.chipActive]}
            onPress={() => setStatusFilter(statusFilter === "pending" ? null : "pending")}
          >
            <Text style={[styles.chipText, statusFilter === "pending" && styles.chipTextActive]}>Pendientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, statusFilter === "accepted" && styles.chipActive]}
            onPress={() => setStatusFilter(statusFilter === "accepted" ? null : "accepted")}
          >
            <Text style={[styles.chipText, statusFilter === "accepted" && styles.chipTextActive]}>En Curso</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, statusFilter === "completed" && styles.chipActive]}
            onPress={() => setStatusFilter(statusFilter === "completed" ? null : "completed")}
          >
            <Text style={[styles.chipText, statusFilter === "completed" && styles.chipTextActive]}>Completados</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredJobs.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons name="briefcase-clock-outline" size={50} color="#BBB" />
              <Text style={styles.emptyTitle}>No hay trabajos registrados</Text>
              <Text style={styles.emptySubtitle}>Las solicitudes de servicios entre clientes y profesionales aparecerán aquí</Text>
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
                      <Text style={styles.jobIdText}>ID: {job.id.substring(0, 8)}...</Text>
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
  badgeCount: {
    backgroundColor: "#EAF9EC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: "#2ECC71",
    fontSize: 12,
    fontWeight: "bold",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "white",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#222",
  },
  chipsScroll: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    maxHeight: 48,
  },
  chipsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F2F3F7",
  },
  chipActive: {
    backgroundColor: PURPLE,
  },
  chipText: {
    fontSize: 12,
    color: "#666",
  },
  chipTextActive: {
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
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});
