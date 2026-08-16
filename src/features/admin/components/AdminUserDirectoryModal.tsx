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
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminUser } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  users: AdminUser[];
  initialSelectedUser?: AdminUser | null;
  onToggleSuspend: (userId: string, currentSuspended: boolean) => void;
  onDeleteUser: (userId: string, userName: string) => void;
  onDirectNotice: (user: AdminUser) => void;
  onGoToReviews?: (user: AdminUser) => void;
  onGoToServices?: (user: AdminUser) => void;
  actionLoading?: boolean;
}

export default function AdminUserDirectoryModal({
  visible,
  onClose,
  users,
  initialSelectedUser,
  onToggleSuspend,
  onDeleteUser,
  onDirectNotice,
  onGoToReviews,
  onGoToServices,
  actionLoading,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "cliente" | "profesional" | "suspendido">("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(initialSelectedUser || null);

  React.useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
    }
  }, [initialSelectedUser, visible]);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.nombre || ""} ${u.apellidos || ""}`.toLowerCase();
    const email = (u.correo || "").toLowerCase();
    const phone = (u.telefono || "").toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || fullName.includes(query) || email.includes(query) || phone.includes(query);

    const isPro = (u.perfiles_profesionales && u.perfiles_profesionales.length > 0) || u.rol === "profesional";
    const isSuspended = u.rol === "suspendido" || u.esta_activo === false;

    if (!matchesSearch) return false;

    if (filterRole === "profesional") return isPro && !isSuspended;
    if (filterRole === "cliente") return !isPro && !isSuspended;
    if (filterRole === "suspendido") return isSuspended;

    return true;
  });

  const confirmDelete = (user: AdminUser) => {
    const name = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || user.correo;
    if (Platform.OS === "web") {
      if (confirm(`¿Estás seguro de eliminar permanentemente a "${name}"? Esta acción no se puede deshacer.`)) {
        onDeleteUser(user.id, name);
        setSelectedUser(null);
      }
    } else {
      Alert.alert(
        "Eliminar Usuario",
        `¿Estás seguro de eliminar permanentemente a "${name}"?\nEsta acción borrará sus perfiles y registros de la plataforma.`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar Definitivamente",
            style: "destructive",
            onPress: () => {
              onDeleteUser(user.id, name);
              setSelectedUser(null);
            },
          },
        ]
      );
    }
  };

  const confirmSuspend = (user: AdminUser) => {
    const isSuspended = user.rol === "suspendido" || user.esta_activo === false;
    const actionText = isSuspended ? "reactivar" : "suspender";
    const name = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || user.correo;

    if (Platform.OS === "web") {
      if (confirm(`¿Deseas ${actionText} la cuenta de "${name}"?`)) {
        onToggleSuspend(user.id, isSuspended);
        if (selectedUser?.id === user.id) {
          setSelectedUser({
            ...selectedUser,
            rol: isSuspended ? "usuario" : "suspendido",
            esta_activo: isSuspended,
          });
        }
      }
    } else {
      Alert.alert(
        `${isSuspended ? "Reactivar" : "Suspender"} Cuenta`,
        `¿Deseas ${actionText} la cuenta de "${name}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: isSuspended ? "Reactivar" : "Suspender",
            style: isSuspended ? "default" : "destructive",
            onPress: () => {
              onToggleSuspend(user.id, isSuspended);
              if (selectedUser?.id === user.id) {
                setSelectedUser({
                  ...selectedUser,
                  rol: isSuspended ? "usuario" : "suspendido",
                  esta_activo: isSuspended,
                });
              }
            },
          },
        ]
      );
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
            <Text style={styles.headerTitle}>Directorio de Usuarios</Text>
            <Text style={styles.headerSubtitle}>{users.length} usuarios registrados</Text>
          </View>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>{filteredUsers.length}</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={22} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre, correo o teléfono..."
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

        {/* Filter Chips */}
        <View style={styles.chipsRow}>
          <TouchableOpacity
            style={[styles.chip, filterRole === "all" && styles.chipActive]}
            onPress={() => setFilterRole("all")}
          >
            <Text style={[styles.chipText, filterRole === "all" && styles.chipTextActive]}>Todos</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterRole === "cliente" && styles.chipActive]}
            onPress={() => setFilterRole("cliente")}
          >
            <Text style={[styles.chipText, filterRole === "cliente" && styles.chipTextActive]}>Clientes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterRole === "profesional" && styles.chipActive]}
            onPress={() => setFilterRole("profesional")}
          >
            <Text style={[styles.chipText, filterRole === "profesional" && styles.chipTextActive]}>Profesionales</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, filterRole === "suspendido" && styles.chipActiveDanger]}
            onPress={() => setFilterRole("suspendido")}
          >
            <Text style={[styles.chipText, filterRole === "suspendido" && styles.chipTextActiveDanger]}>Suspendidos</Text>
          </TouchableOpacity>
        </View>

        {/* Users List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-search-outline" size={54} color="#BBB" />
              <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
              <Text style={styles.emptySubtitle}>Intenta ajustar el término de búsqueda o filtro</Text>
            </View>
          ) : (
            filteredUsers.map((user) => {
              const fullName = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || "Usuario sin nombre";
              const isPro = user.perfiles_profesionales && user.perfiles_profesionales.length > 0;
              const isSuspended = user.rol === "suspendido" || user.esta_activo === false;
              const isAdmin = user.rol === "admin" || user.rol === "administrador";

              return (
                <TouchableOpacity
                  key={user.id}
                  style={[styles.userCard, isSuspended && styles.userCardSuspended]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedUser(user)}
                >
                  <View style={styles.avatarWrap}>
                    {user.foto_perfil ? (
                      <Image source={{ uri: user.foto_perfil }} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <MaterialCommunityIcons name="account" size={24} color="#888" />
                      </View>
                    )}
                    {isSuspended && (
                      <View style={styles.suspendedDot}>
                        <MaterialCommunityIcons name="pause" size={10} color="white" />
                      </View>
                    )}
                  </View>

                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {fullName}
                      </Text>
                      {isAdmin && (
                        <View style={styles.badgeAdminPill}>
                          <Text style={styles.badgeAdminText}>ADMIN</Text>
                        </View>
                      )}
                      {isPro && !isAdmin && (
                        <View style={styles.badgeProPill}>
                          <Text style={styles.badgeProText}>PRO</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.userEmail} numberOfLines={1}>
                      {user.correo || "Sin correo"}
                    </Text>

                    <View style={styles.userMetaRow}>
                      {!!user.telefono && (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="phone-outline" size={12} color="#777" />
                          <Text style={styles.metaText}>{user.telefono}</Text>
                        </View>
                      )}
                      {!!user.ciudad && (
                        <View style={styles.metaItem}>
                          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#777" />
                          <Text style={styles.metaText}>{user.ciudad}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  <MaterialCommunityIcons name="chevron-right" size={22} color="#BBB" />
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* Detailed User Inspection Sheet (Modal dentro de Modal) */}
        {selectedUser && (
          <Modal visible={true} transparent={true} animationType="fade">
            <View style={styles.detailOverlay}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <Text style={styles.detailTitle}>Ficha de Usuario</Text>
                  <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeDetailBtn}>
                    <MaterialCommunityIcons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  {/* Avatar & Main */}
                  <View style={styles.detailProfileRow}>
                    {selectedUser.foto_perfil ? (
                      <Image source={{ uri: selectedUser.foto_perfil }} style={styles.detailAvatar} />
                    ) : (
                      <View style={[styles.detailAvatar, styles.avatarPlaceholder]}>
                        <MaterialCommunityIcons name="account" size={36} color="#888" />
                      </View>
                    )}
                    <View style={styles.detailProfileInfo}>
                      <Text style={styles.detailName}>
                        {`${selectedUser.nombre || ""} ${selectedUser.apellidos || ""}`.trim() || "Usuario"}
                      </Text>
                      <Text style={styles.detailEmail}>{selectedUser.correo || "Sin correo"}</Text>
                      <View style={styles.statusPillRow}>
                        <View
                          style={[
                            styles.statusPill,
                            selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                              ? styles.statusPillSuspended
                              : styles.statusPillActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusPillText,
                              selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                                ? styles.statusPillTextSuspended
                                : styles.statusPillTextActive,
                            ]}
                          >
                            {selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                              ? "CUENTA SUSPENDIDA"
                              : "CUENTA ACTIVA"}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Info details table */}
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>ID Usuario:</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {selectedUser.id}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Teléfono:</Text>
                      <Text style={styles.infoValue}>{selectedUser.telefono || "No especificado"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Ciudad:</Text>
                      <Text style={styles.infoValue}>{selectedUser.ciudad || "No especificada"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Fecha Registro:</Text>
                      <Text style={styles.infoValue}>
                        {selectedUser.fecha_creacion
                          ? new Date(selectedUser.fecha_creacion).toLocaleDateString("es-ES")
                          : "N/A"}
                      </Text>
                    </View>
                  </View>

                  {/* Professional Services if any */}
                  {selectedUser.perfiles_profesionales && selectedUser.perfiles_profesionales.length > 0 && (
                    <View style={styles.proServicesSection}>
                      <Text style={styles.proServicesTitle}>
                        Servicios Profesionales ({selectedUser.perfiles_profesionales.length})
                      </Text>
                      {selectedUser.perfiles_profesionales.map((srv) => (
                        <View key={srv.id} style={styles.srvCard}>
                          <View style={styles.srvHeader}>
                            <Text style={styles.srvName}>{srv.profesion}</Text>
                            <View style={styles.srvCatPill}>
                              <Text style={styles.srvCatText}>{srv.categoria}</Text>
                            </View>
                          </View>
                          <Text style={styles.srvDesc} numberOfLines={2}>
                            {srv.descripcion || "Sin descripción de servicio."}
                          </Text>
                          <Text style={styles.srvZone}>Zona: {srv.zona || "General"}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Cross-Navigation Shortcuts to Content Management */}
                  <View style={styles.crossNavSection}>
                    {onGoToReviews && (
                      <TouchableOpacity
                        style={styles.crossNavBtnReviews}
                        activeOpacity={0.8}
                        onPress={() => {
                          const u = selectedUser;
                          setSelectedUser(null);
                          onGoToReviews(u);
                        }}
                      >
                        <MaterialCommunityIcons name="star-box-multiple-outline" size={18} color="#FF9500" />
                        <Text style={styles.crossNavBtnReviewsText}>Ver Reseñas</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#FF9500" />
                      </TouchableOpacity>
                    )}

                    {onGoToServices && selectedUser.perfiles_profesionales && selectedUser.perfiles_profesionales.length > 0 && (
                      <TouchableOpacity
                        style={styles.crossNavBtnServices}
                        activeOpacity={0.8}
                        onPress={() => {
                          const u = selectedUser;
                          setSelectedUser(null);
                          onGoToServices(u);
                        }}
                      >
                        <MaterialCommunityIcons name="briefcase-edit-outline" size={18} color={PURPLE} />
                        <Text style={styles.crossNavBtnServicesText}>Ver Servicios</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color={PURPLE} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Admin Actions for this user */}
                  <View style={styles.actionsSection}>
                    <TouchableOpacity
                      style={styles.actionBtnNotice}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedUser(null);
                        onDirectNotice(selectedUser);
                      }}
                    >
                      <MaterialCommunityIcons name="email-alert-outline" size={20} color={PURPLE} />
                      <Text style={styles.actionBtnNoticeText}>Enviar Notificación Directa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.actionBtnSuspend,
                        (selectedUser.rol === "suspendido" || selectedUser.esta_activo === false) &&
                          styles.actionBtnReactivate,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => confirmSuspend(selectedUser)}
                    >
                      <MaterialCommunityIcons
                        name={
                          selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                            ? "check-circle-outline"
                            : "pause-circle-outline"
                        }
                        size={20}
                        color={
                          selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                            ? "#2ECC71"
                            : "#FF9500"
                        }
                      />
                      <Text
                        style={[
                          styles.actionBtnSuspendText,
                          (selectedUser.rol === "suspendido" || selectedUser.esta_activo === false) && {
                            color: "#2ECC71",
                          },
                        ]}
                      >
                        {selectedUser.rol === "suspendido" || selectedUser.esta_activo === false
                          ? "Reactivar Cuenta"
                          : "Suspender Cuenta"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionBtnDelete}
                      activeOpacity={0.8}
                      onPress={() => confirmDelete(selectedUser)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FF3B30" />
                      <Text style={styles.actionBtnDeleteText}>Eliminar Usuario Definitivamente</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}
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
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  badgeCount: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCountText: {
    color: PURPLE,
    fontSize: 12,
    fontWeight: "bold",
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
  chipsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F2F3F7",
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
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
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
  userCardSuspended: {
    backgroundColor: "#FFF9F9",
    borderColor: "#FFDADA",
  },
  avatarWrap: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarPlaceholder: {
    backgroundColor: "#EBEBF0",
    justifyContent: "center",
    alignItems: "center",
  },
  suspendedDot: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  userName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
    maxWidth: "70%",
  },
  badgeAdminPill: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeAdminText: {
    color: PURPLE,
    fontSize: 9,
    fontWeight: "bold",
  },
  badgeProPill: {
    backgroundColor: "#EBF3FF",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  badgeProText: {
    color: "#007AFF",
    fontSize: 9,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  userMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#777",
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
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  detailCard: {
    backgroundColor: "white",
    borderRadius: 20,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  detailTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  closeDetailBtn: {
    padding: 4,
  },
  detailBody: {
    padding: 16,
  },
  detailProfileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  detailProfileInfo: {
    flex: 1,
  },
  detailName: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  detailEmail: {
    fontSize: 13,
    color: "#666",
    marginTop: 2,
  },
  statusPillRow: {
    marginTop: 6,
  },
  statusPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillActive: {
    backgroundColor: "#E8F8F0",
  },
  statusPillSuspended: {
    backgroundColor: "#FDEAEA",
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  statusPillTextActive: {
    color: "#2ECC71",
  },
  statusPillTextSuspended: {
    color: "#E74C3C",
  },
  infoSection: {
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 12,
    color: "#777",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 12,
    color: "#222",
    fontWeight: "600",
    maxWidth: "60%",
    textAlign: "right",
  },
  proServicesSection: {
    marginBottom: 16,
  },
  proServicesTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  srvCard: {
    backgroundColor: "#F3F5FA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
  },
  srvHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  srvName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#222",
  },
  srvCatPill: {
    backgroundColor: "white",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  srvCatText: {
    fontSize: 10,
    color: PURPLE,
    fontWeight: "600",
  },
  srvDesc: {
    fontSize: 11,
    color: "#666",
  },
  srvZone: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
  },
  crossNavSection: {
    backgroundColor: "#F8F9FC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  crossNavTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#666",
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  crossNavBtnReviews: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FFE8A3",
  },
  crossNavBtnReviewsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: "#B7791F",
  },
  crossNavBtnServices: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E2D3F5",
  },
  crossNavBtnServicesText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "bold",
    color: PURPLE,
  },
  actionsSection: {
    gap: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
    marginBottom: 16,
  },
  actionBtnNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnNoticeText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: "bold",
  },
  actionBtnSuspend: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF5E6",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnReactivate: {
    backgroundColor: "#EAF9EC",
  },
  actionBtnSuspendText: {
    color: "#FF9500",
    fontSize: 14,
    fontWeight: "bold",
  },
  actionBtnDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnDeleteText: {
    color: "#FF3B30",
    fontSize: 14,
    fontWeight: "bold",
  },
});
