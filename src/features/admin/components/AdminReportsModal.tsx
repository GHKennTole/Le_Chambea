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
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminReport, AdminUser } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";

interface Props {
  visible: boolean;
  onClose: () => void;
  reports: AdminReport[];
  users: AdminUser[];
  onToggleResolved: (reportId: string, currentResolved: boolean) => void;
  onDeleteReport: (reportId: string) => void;
  onDirectNotice: (user: AdminUser, reportContext?: AdminReport) => void;
}

export default function AdminReportsModal({
  visible,
  onClose,
  reports,
  users,
  onToggleResolved,
  onDeleteReport,
  onDirectNotice,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"pending" | "resolved">("pending");

  const pendingReports = reports.filter((r) => !r.leido);
  const resolvedReports = reports.filter((r) => r.leido);

  const displayedReports = (filterTab === "pending" ? pendingReports : resolvedReports).filter((r) => {
    const title = (r.titulo || "").toLowerCase();
    const body = (r.cuerpo || "").toLowerCase();
    const userName = `${r.usuario?.nombre || ""} ${r.usuario?.apellidos || ""}`.toLowerCase();
    const query = search.toLowerCase().trim();

    return !query || title.includes(query) || body.includes(query) || userName.includes(query);
  });

  const confirmDelete = (report: AdminReport) => {
    if (Platform.OS === "web") {
      if (confirm("¿Estás seguro de eliminar este reporte de la bandeja?")) {
        onDeleteReport(report.id);
      }
    } else {
      Alert.alert(
        "Eliminar Reporte",
        "¿Estás seguro de eliminar este reporte de la bandeja?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: () => onDeleteReport(report.id),
          },
        ]
      );
    }
  };

  const handleNotifyUser = (report: AdminReport) => {
    let targetUser: AdminUser | undefined;
    if (report.usuario_id) {
      targetUser = users.find((u) => u.id === report.usuario_id);
    }
    if (!targetUser) {
      // Fallback pseudo user object if user ID is present
      targetUser = {
        id: report.usuario_id || "",
        nombre: report.usuario?.nombre || "Usuario Reportante",
        apellidos: report.usuario?.apellidos || "",
        correo: report.usuario?.correo || "",
        telefono: "",
        ciudad: "",
        foto_perfil: report.usuario?.foto_perfil || null,
        rol: "usuario",
        onboarding_completado: true,
        fecha_creacion: "",
      };
    }
    onDirectNotice(targetUser, report);
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
            <Text style={styles.headerTitle}>Bandeja de Reportes de Usuarios</Text>
            <Text style={styles.headerSubtitle}>Atención a disputas, quejas e incongruencias</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{pendingReports.length} pendientes</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, filterTab === "pending" && styles.tabBtnActiveDanger]}
            onPress={() => setFilterTab("pending")}
          >
            <MaterialCommunityIcons
              name="alert-octagon"
              size={18}
              color={filterTab === "pending" ? "#E74C3C" : "#777"}
            />
            <Text style={[styles.tabBtnText, filterTab === "pending" && styles.tabBtnTextDanger]}>
              Pendientes ({pendingReports.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, filterTab === "resolved" && styles.tabBtnActiveSuccess]}
            onPress={() => setFilterTab("resolved")}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color={filterTab === "resolved" ? "#2ECC71" : "#777"}
            />
            <Text style={[styles.tabBtnText, filterTab === "resolved" && styles.tabBtnTextSuccess]}>
              Resueltos ({resolvedReports.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar reporte o usuario..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
          </View>
        </View>

        {/* Reports List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {displayedReports.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name={filterTab === "pending" ? "shield-check" : "check-all"}
                size={54}
                color="#BBB"
              />
              <Text style={styles.emptyTitle}>
                {filterTab === "pending"
                  ? "¡Excelente! No hay reportes pendientes"
                  : "No hay reportes archivados"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filterTab === "pending"
                  ? "Todas las denuncias e incidencias han sido atendidas"
                  : "Los reportes que marques como resueltos aparecerán aquí"}
              </Text>
            </View>
          ) : (
            displayedReports.map((report) => {
              const isResolved = report.leido;
              const senderName = report.usuario
                ? `${report.usuario.nombre || ""} ${report.usuario.apellidos || ""}`.trim() || "Usuario"
                : "Sistema / Anónimo";

              return (
                <View key={report.id} style={[styles.card, isResolved && styles.cardResolved]}>
                  {/* Top Bar */}
                  <View style={styles.cardTop}>
                    <View style={styles.typeIconBox}>
                      <MaterialCommunityIcons
                        name={isResolved ? "check-circle" : "alert-decagram"}
                        size={20}
                        color={isResolved ? "#2ECC71" : "#E74C3C"}
                      />
                    </View>
                    <View style={styles.titleCol}>
                      <Text style={styles.reportTitle} numberOfLines={1}>
                        {report.titulo}
                      </Text>
                      <Text style={styles.reportDate}>
                        {report.fecha_creacion
                          ? new Date(report.fecha_creacion).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Fecha N/A"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isResolved ? styles.statusPillResolved : styles.statusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isResolved ? styles.statusPillTextResolved : styles.statusPillTextPending,
                        ]}
                      >
                        {isResolved ? "RESUELTO" : "PENDIENTE"}
                      </Text>
                    </View>
                  </View>

                  {/* Body Content */}
                  <View style={styles.bodyBox}>
                    <Text style={styles.bodyText}>{report.cuerpo || "Sin descripción de reporte."}</Text>
                  </View>

                  {/* Sender Info */}
                  <View style={styles.senderRow}>
                    <MaterialCommunityIcons name="account-outline" size={16} color="#777" />
                    <Text style={styles.senderText}>
                      Remitente: <Text style={styles.senderName}>{senderName}</Text>
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.cardActions}>
                    {/* Direct notice button */}
                    <TouchableOpacity
                      style={styles.btnNotice}
                      activeOpacity={0.8}
                      onPress={() => handleNotifyUser(report)}
                    >
                      <MaterialCommunityIcons name="email-fast-outline" size={16} color={PURPLE} />
                      <Text style={styles.btnNoticeText}>Notificar Usuario</Text>
                    </TouchableOpacity>

                    {/* Toggle resolved */}
                    <TouchableOpacity
                      style={[styles.btnResolve, isResolved && styles.btnReopen]}
                      activeOpacity={0.8}
                      onPress={() => onToggleResolved(report.id, isResolved)}
                    >
                      <MaterialCommunityIcons
                        name={isResolved ? "refresh" : "check"}
                        size={16}
                        color={isResolved ? "#FF9500" : "#2ECC71"}
                      />
                      <Text style={[styles.btnResolveText, { color: isResolved ? "#FF9500" : "#2ECC71" }]}>
                        {isResolved ? "Reabrir" : "Resolver"}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete */}
                    <TouchableOpacity
                      style={styles.btnDelete}
                      activeOpacity={0.8}
                      onPress={() => confirmDelete(report)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                    </TouchableOpacity>
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
    backgroundColor: "#FDEDEC",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: "#E74C3C",
    fontSize: 11,
    fontWeight: "bold",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F2F3F7",
    gap: 6,
  },
  tabBtnActiveDanger: {
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  tabBtnActiveSuccess: {
    backgroundColor: "#E8F8F0",
    borderWidth: 1,
    borderColor: "#C5EED9",
  },
  tabBtnText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  tabBtnTextDanger: {
    color: "#E74C3C",
  },
  tabBtnTextSuccess: {
    color: "#2ECC71",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
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
  cardResolved: {
    backgroundColor: "#FAFBFD",
    borderColor: "#E5E9F0",
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIconBox: {
    marginRight: 8,
  },
  titleCol: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  reportDate: {
    fontSize: 11,
    color: "#888",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: "#FDEDEC",
  },
  statusPillResolved: {
    backgroundColor: "#E8F8F0",
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  statusPillTextPending: {
    color: "#E74C3C",
  },
  statusPillTextResolved: {
    color: "#2ECC71",
  },
  bodyBox: {
    backgroundColor: "#F9F9FB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    color: "#333",
    lineHeight: 18,
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  senderText: {
    fontSize: 12,
    color: "#777",
  },
  senderName: {
    color: "#333",
    fontWeight: "600",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
  },
  btnNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  btnNoticeText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "bold",
  },
  btnResolve: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  btnReopen: {
    backgroundColor: "#FFF5E6",
  },
  btnResolveText: {
    fontSize: 12,
    fontWeight: "bold",
  },
  btnDelete: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#FFF0F0",
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
  },
});
