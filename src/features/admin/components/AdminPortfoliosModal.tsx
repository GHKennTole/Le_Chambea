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
import { AdminProfessionalService, AdminUser } from "../models/admin.types";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  services: AdminProfessionalService[];
  users: AdminUser[];
  initialSelectedUser?: AdminUser | null;
  onToggleActive: (serviceId: string, currentActive: boolean) => void;
  onDeleteService: (serviceId: string, professionName: string) => void;
  onGoToUserDirectory?: (user: AdminUser) => void;
  onGoToReviews?: (user: AdminUser) => void;
}

export default function AdminPortfoliosModal({
  visible,
  onClose,
  services,
  users,
  initialSelectedUser,
  onToggleActive,
  onDeleteService,
  onGoToUserDirectory,
  onGoToReviews,
}: Props) {
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<"by_pro" | "all">("by_pro");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(initialSelectedUser || null);
  const [selectedService, setSelectedService] = useState<AdminProfessionalService | null>(null);

  React.useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
      setViewMode("by_pro");
    }
  }, [initialSelectedUser, visible]);

  // List of professionals
  const proUsers = users.filter((u) => {
    const isPro = (u.perfiles_profesionales && u.perfiles_profesionales.length > 0) || u.rol === "profesional";
    const name = `${u.nombre || ""} ${u.apellidos || ""}`.toLowerCase();
    const email = (u.correo || "").toLowerCase();
    const query = search.toLowerCase().trim();

    return isPro && (!query || name.includes(query) || email.includes(query));
  });

  const categories = Array.from(new Set(services.map((s) => s.categoria).filter(Boolean)));

  const filteredServices = services.filter((s) => {
    const prof = (s.profesion || "").toLowerCase();
    const cat = (s.categoria || "").toLowerCase();
    const proName = `${s.usuario?.nombre || ""} ${s.usuario?.apellidos || ""}`.toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || prof.includes(query) || cat.includes(query) || proName.includes(query);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && s.esta_activo) ||
      (statusFilter === "suspended" && !s.esta_activo);

    return matchesSearch && matchesStatus;
  });

  const userServices = selectedUser ? services.filter((s) => s.usuario_id === selectedUser.id) : [];

  const confirmToggle = (srv: AdminProfessionalService) => {
    const action = srv.esta_activo ? "desactivar / suspender" : "activar";
    if (Platform.OS === "web") {
      if (confirm(`¿Deseas ${action} el servicio de "${srv.profesion}"?`)) {
        onToggleActive(srv.id, srv.esta_activo);
        if (selectedService?.id === srv.id) {
          setSelectedService({ ...selectedService, esta_activo: !srv.esta_activo });
        }
      }
    } else {
      Alert.alert(
        `${srv.esta_activo ? "Suspender" : "Activar"} Servicio`,
        `¿Deseas ${action} el servicio de "${srv.profesion}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: srv.esta_activo ? "Suspender" : "Activar",
            style: srv.esta_activo ? "destructive" : "default",
            onPress: () => {
              onToggleActive(srv.id, srv.esta_activo);
              if (selectedService?.id === srv.id) {
                setSelectedService({ ...selectedService, esta_activo: !srv.esta_activo });
              }
            },
          },
        ]
      );
    }
  };

  const confirmDeleteService = (srv: AdminProfessionalService) => {
    if (Platform.OS === "web") {
      if (confirm(`⚠️ ¿Estás seguro de eliminar permanentemente el servicio de "${srv.profesion}"?`)) {
        onDeleteService(srv.id, srv.profesion);
        setSelectedService(null);
        if (selectedUser) {
          setSelectedUser({
            ...selectedUser,
            perfiles_profesionales: selectedUser.perfiles_profesionales?.filter((s) => s.id !== srv.id),
          });
        }
      }
    } else {
      Alert.alert(
        "Eliminar Servicio Profesional",
        `¿Estás seguro de eliminar permanentemente el servicio de "${srv.profesion}"?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar Servicio",
            style: "destructive",
            onPress: () => {
              onDeleteService(srv.id, srv.profesion);
              setSelectedService(null);
              if (selectedUser) {
                setSelectedUser({
                  ...selectedUser,
                  perfiles_profesionales: selectedUser.perfiles_profesionales?.filter((s) => s.id !== srv.id),
                });
              }
            },
          },
        ]
      );
    }
  };

  const getAssociatedUser = (srv: AdminProfessionalService): AdminUser | undefined => {
    return users.find((u) => u.id === srv.usuario_id) || (srv.usuario as any);
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
            <Text style={styles.headerTitle}>Servicios de Profesionales</Text>
            <Text style={styles.headerSubtitle}>{services.length} servicios registrados en catálogo</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, viewMode === "by_pro" && styles.tabBtnActive]}
            onPress={() => {
              setViewMode("by_pro");
              setSelectedUser(null);
              setSelectedService(null);
            }}
          >
            <MaterialCommunityIcons
              name="account-hard-hat"
              size={18}
              color={viewMode === "by_pro" ? PURPLE : "#666"}
            />
            <Text style={[styles.tabBtnText, viewMode === "by_pro" && styles.tabBtnTextActive]}>
              Por Profesional ({proUsers.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, viewMode === "all" && styles.tabBtnActive]}
            onPress={() => {
              setViewMode("all");
              setSelectedUser(null);
              setSelectedService(null);
            }}
          >
            <MaterialCommunityIcons
              name="briefcase-outline"
              size={18}
              color={viewMode === "all" ? PURPLE : "#666"}
            />
            <Text style={[styles.tabBtnText, viewMode === "all" && styles.tabBtnTextActive]}>
              Todos los Servicios ({services.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder={
                viewMode === "by_pro"
                  ? "Buscar profesional por nombre o correo..."
                  : "Buscar por oficio, profesional o categoría..."
              }
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Chips Bar (Activos y Suspendidos) */}
        {viewMode === "all" && (
          <View style={styles.filtersBarContainer}>
            <View style={styles.filtersBarRow}>
              <TouchableOpacity
                style={[styles.chip, statusFilter === "all" && styles.chipActive]}
                onPress={() => setStatusFilter("all")}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, statusFilter === "all" && styles.chipTextActive]}>
                  Todos ({services.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, statusFilter === "active" && styles.chipActiveGreen]}
                onPress={() => setStatusFilter("active")}
                activeOpacity={0.8}
              >
                <View style={[styles.dot, { backgroundColor: statusFilter === "active" ? "white" : "#2ECC71" }]} />
                <Text style={[styles.chipText, statusFilter === "active" && styles.chipTextActive]}>
                  Activos ({services.filter((s) => s.esta_activo).length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.chip, statusFilter === "suspended" && styles.chipActiveOrange]}
                onPress={() => setStatusFilter("suspended")}
                activeOpacity={0.8}
              >
                <View style={[styles.dot, { backgroundColor: statusFilter === "suspended" ? "white" : "#FF9500" }]} />
                <Text style={[styles.chipText, statusFilter === "suspended" && styles.chipTextActive]}>
                  Suspendidos ({services.filter((s) => !s.esta_activo).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Content Body */}
        {viewMode === "by_pro" ? (
          /* List of professionals (Clean & Compact Cards) */
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {proUsers.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="account-search-outline" size={50} color="#BBB" />
                <Text style={styles.emptyTitle}>No se encontraron profesionales</Text>
              </View>
            ) : (
              proUsers.map((user) => {
                const name = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || "Profesional";
                const srvCount = (user.perfiles_profesionales || []).length;
                const isSuspended = user.rol === "suspendido" || user.esta_activo === false;

                return (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.compactCard}
                    activeOpacity={0.85}
                    onPress={() => setSelectedUser(user)}
                  >
                    <View style={styles.avatarWrap}>
                      {user.foto_perfil ? (
                        <Image source={{ uri: user.foto_perfil }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <MaterialCommunityIcons name="account" size={20} color="#888" />
                        </View>
                      )}
                    </View>

                    <View style={styles.compactInfo}>
                      <View style={styles.compactTitleRow}>
                        <Text style={styles.compactName} numberOfLines={1}>
                          {name}
                        </Text>
                        <View
                          style={[
                            styles.statusMiniBadge,
                            isSuspended ? styles.statusMiniBadgeOff : styles.statusMiniBadgeOn,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusMiniBadgeText,
                              isSuspended ? styles.statusMiniBadgeTextOff : styles.statusMiniBadgeTextOn,
                            ]}
                          >
                            {isSuspended ? "SUSPENDIDO" : "ACTIVO"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.compactSubtitle} numberOfLines={1}>
                        {user.correo || "Sin correo"}
                      </Text>

                      <View style={styles.compactTagsRow}>
                        <View style={styles.tagPill}>
                          <MaterialCommunityIcons name="briefcase-check" size={12} color={PURPLE} />
                          <Text style={styles.tagText}>
                            {srvCount} {srvCount === 1 ? "servicio" : "servicios"}
                          </Text>
                        </View>
                        {!!user.ciudad && (
                          <View style={[styles.tagPill, { backgroundColor: "#F0F0F3" }]}>
                            <MaterialCommunityIcons name="map-marker-outline" size={12} color="#666" />
                            <Text style={[styles.tagText, { color: "#666" }]}>{user.ciudad}</Text>
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
        ) : (
          /* Global Services (Clean & Compact Cards) */
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredServices.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="briefcase-off-outline" size={50} color="#BBB" />
                <Text style={styles.emptyTitle}>No hay servicios con estos filtros</Text>
              </View>
            ) : (
              filteredServices.map((srv) => {
                const proName = `${srv.usuario?.nombre || ""} ${srv.usuario?.apellidos || ""}`.trim() || "Profesional";

                return (
                  <TouchableOpacity
                    key={srv.id}
                    style={[styles.compactCard, !srv.esta_activo && styles.compactCardInactive]}
                    activeOpacity={0.85}
                    onPress={() => setSelectedService(srv)}
                  >
                    <View style={styles.avatarWrap}>
                      {srv.usuario?.foto_perfil ? (
                        <Image source={{ uri: srv.usuario.foto_perfil }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <MaterialCommunityIcons name="account-hard-hat" size={20} color="#888" />
                        </View>
                      )}
                    </View>

                    <View style={styles.compactInfo}>
                      <View style={styles.compactTitleRow}>
                        <Text style={styles.compactProfession} numberOfLines={1}>
                          {srv.profesion}
                        </Text>
                        <View
                          style={[
                            styles.statusMiniBadge,
                            srv.esta_activo ? styles.statusMiniBadgeOn : styles.statusMiniBadgeOff,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusMiniBadgeText,
                              srv.esta_activo ? styles.statusMiniBadgeTextOn : styles.statusMiniBadgeTextOff,
                            ]}
                          >
                            {srv.esta_activo ? "ACTIVO" : "SUSPENDIDO"}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.compactProName} numberOfLines={1}>
                        {proName}
                      </Text>

                      <View style={styles.compactTagsRow}>
                        <View style={styles.tagPill}>
                          <Text style={styles.tagText}>{srv.categoria}</Text>
                        </View>
                        {!!srv.zona && (
                          <View style={[styles.tagPill, { backgroundColor: "#F0F0F3" }]}>
                            <MaterialCommunityIcons name="map-marker-outline" size={11} color="#666" />
                            <Text style={[styles.tagText, { color: "#666" }]}>{srv.zona}</Text>
                          </View>
                        )}
                        {!!srv.rango_precio && (
                          <View style={[styles.tagPill, { backgroundColor: "#EAF9EC" }]}>
                            <MaterialCommunityIcons name="cash" size={11} color="#2ECC71" />
                            <Text style={[styles.tagText, { color: "#27AE60" }]}>{srv.rango_precio}</Text>
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
        )}

        {/* Modal 1: Detalle Completo de un Servicio Seleccionado */}
        {selectedService && (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.detailOverlay}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>{selectedService.profesion}</Text>
                    <Text style={styles.detailSubtitle}>
                      {`${selectedService.usuario?.nombre || ""} ${selectedService.usuario?.apellidos || ""}`.trim() || "Profesional"}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedService(null)} style={styles.closeDetailBtn}>
                    <MaterialCommunityIcons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  {/* Cross-Navigation Shortcuts */}
                  <View style={styles.crossNavRow}>
                    {onGoToUserDirectory && (
                      <TouchableOpacity
                        style={styles.crossNavBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          const target = getAssociatedUser(selectedService);
                          setSelectedService(null);
                          if (target) onGoToUserDirectory(target);
                        }}
                      >
                        <MaterialCommunityIcons name="account-details-outline" size={16} color={PURPLE} />
                        <Text style={styles.crossNavBtnText}>Ver Perfil</Text>
                      </TouchableOpacity>
                    )}

                    {onGoToReviews && (
                      <TouchableOpacity
                        style={[styles.crossNavBtn, { backgroundColor: "#FFF9E6", borderColor: "#FFE8A3" }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const target = getAssociatedUser(selectedService);
                          setSelectedService(null);
                          if (target) onGoToReviews(target);
                        }}
                      >
                        <MaterialCommunityIcons name="star-outline" size={16} color="#B7791F" />
                        <Text style={[styles.crossNavBtnText, { color: "#B7791F" }]}>Ver Reseñas</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Service Info Sheet */}
                  <View style={styles.infoCardSection}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Categoría:</Text>
                      <Text style={styles.infoValue}>{selectedService.categoria}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Zona de Cobertura:</Text>
                      <Text style={styles.infoValue}>{selectedService.zona || "No especificada"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tarifa / Rango:</Text>
                      <Text style={styles.infoValue}>{selectedService.rango_precio || "A convenir"}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Estado:</Text>
                      <Text
                        style={[
                          styles.infoValue,
                          { color: selectedService.esta_activo ? "#2ECC71" : "#FF9500", fontWeight: "bold" },
                        ]}
                      >
                        {selectedService.esta_activo ? "ACTIVO Y VISIBLE" : "SUSPENDIDO / OCULTO"}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.sectionHeaderTitle}>Descripción del Trabajo</Text>
                  <View style={styles.descBox}>
                    <Text style={styles.descText}>
                      {selectedService.descripcion || "Sin descripción de servicios."}
                    </Text>
                  </View>

                  {/* Portfolio Gallery */}
                  {selectedService.portafolio && selectedService.portafolio.length > 0 && (
                    <View style={{ marginTop: 12 }}>
                      <Text style={styles.sectionHeaderTitle}>
                        Fotos del Portafolio ({selectedService.portafolio.length}):
                      </Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                        {selectedService.portafolio.map((img, i) => (
                          <Image key={i} source={{ uri: img }} style={styles.portfolioImg} />
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  {/* Action Buttons */}
                  <View style={styles.actionsSection}>
                    <TouchableOpacity
                      style={[
                        styles.toggleBtn,
                        selectedService.esta_activo ? styles.toggleBtnDeactivate : styles.toggleBtnActivate,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => confirmToggle(selectedService)}
                    >
                      <MaterialCommunityIcons
                        name={selectedService.esta_activo ? "pause-circle-outline" : "play-circle-outline"}
                        size={18}
                        color={selectedService.esta_activo ? "#FF9500" : "#2ECC71"}
                      />
                      <Text
                        style={[
                          styles.toggleBtnText,
                          { color: selectedService.esta_activo ? "#FF9500" : "#2ECC71" },
                        ]}
                      >
                        {selectedService.esta_activo ? "Suspender Servicio" : "Activar Servicio"}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteSrvBtn}
                      activeOpacity={0.8}
                      onPress={() => confirmDeleteService(selectedService)}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={18} color="#FF3B30" />
                      <Text style={styles.deleteSrvBtnText}>Eliminar Servicio Definitivamente</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        )}

        {/* Modal 2: Lista de Servicios del Profesional Seleccionado */}
        {selectedUser && !selectedService && (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.detailOverlay}>
              <View style={styles.detailCard}>
                <View style={styles.detailHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailTitle}>
                      Servicios de {selectedUser.nombre || "Profesional"}
                    </Text>
                    <Text style={styles.detailSubtitle}>{selectedUser.correo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeDetailBtn}>
                    <MaterialCommunityIcons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.detailBody} showsVerticalScrollIndicator={false}>
                  {/* Cross-Navigation Shortcuts */}
                  <View style={styles.crossNavRow}>
                    {onGoToUserDirectory && (
                      <TouchableOpacity
                        style={styles.crossNavBtn}
                        activeOpacity={0.8}
                        onPress={() => {
                          const u = selectedUser;
                          setSelectedUser(null);
                          onGoToUserDirectory(u);
                        }}
                      >
                        <MaterialCommunityIcons name="account-details-outline" size={16} color={PURPLE} />
                        <Text style={styles.crossNavBtnText}>Ver Perfil</Text>
                      </TouchableOpacity>
                    )}

                    {onGoToReviews && (
                      <TouchableOpacity
                        style={[styles.crossNavBtn, { backgroundColor: "#FFF9E6", borderColor: "#FFE8A3" }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const u = selectedUser;
                          setSelectedUser(null);
                          onGoToReviews(u);
                        }}
                      >
                        <MaterialCommunityIcons name="star-outline" size={16} color="#B7791F" />
                        <Text style={[styles.crossNavBtnText, { color: "#B7791F" }]}>Ver Reseñas</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <Text style={styles.sectionHeaderTitle}>
                    Servicios Registrados ({userServices.length})
                  </Text>

                  {userServices.length === 0 ? (
                    <Text style={styles.noServicesText}>Este usuario no tiene servicios activos registrados.</Text>
                  ) : (
                    userServices.map((srv) => (
                      <TouchableOpacity
                        key={srv.id}
                        style={[styles.compactCard, { marginBottom: 8, borderWidth: 1, borderColor: "#EAEAEA" }]}
                        activeOpacity={0.85}
                        onPress={() => setSelectedService(srv)}
                      >
                        <View style={styles.compactInfo}>
                          <View style={styles.compactTitleRow}>
                            <Text style={styles.compactProfession}>{srv.profesion}</Text>
                            <View
                              style={[
                                styles.statusMiniBadge,
                                srv.esta_activo ? styles.statusMiniBadgeOn : styles.statusMiniBadgeOff,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusMiniBadgeText,
                                  srv.esta_activo ? styles.statusMiniBadgeTextOn : styles.statusMiniBadgeTextOff,
                                ]}
                              >
                                {srv.esta_activo ? "ACTIVO" : "SUSPENDIDO"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.compactTagsRow}>
                            <View style={styles.tagPill}>
                              <Text style={styles.tagText}>{srv.categoria}</Text>
                            </View>
                            {!!srv.zona && (
                              <View style={[styles.tagPill, { backgroundColor: "#F0F0F3" }]}>
                                <Text style={[styles.tagText, { color: "#666" }]}>{srv.zona}</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#BBB" />
                      </TouchableOpacity>
                    ))
                  )}
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
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
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
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: "#F2F3F7",
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 1,
    borderColor: "#D9C3F0",
  },
  tabBtnText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  tabBtnTextActive: {
    color: PURPLE,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
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
  filtersBarContainer: {
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  filtersBarRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#F2F3F7",
    gap: 5,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  chipActiveGreen: {
    backgroundColor: "#2ECC71",
    borderColor: "#2ECC71",
  },
  chipActiveOrange: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
  },
  chipText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "600",
  },
  chipTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  compactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    gap: 12,
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.02)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  compactCardInactive: {
    backgroundColor: "#FAF9F9",
    borderColor: "#E5E5E5",
    opacity: 0.85,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarPlaceholder: {
    backgroundColor: "#ECECF0",
    justifyContent: "center",
    alignItems: "center",
  },
  compactInfo: {
    flex: 1,
    gap: 3,
  },
  compactTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  compactProfession: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 6,
  },
  compactName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 6,
  },
  compactProName: {
    fontSize: 12,
    color: "#666",
  },
  compactSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  compactTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 2,
  },
  tagPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  tagText: {
    fontSize: 10,
    color: PURPLE,
    fontWeight: "bold",
  },
  statusMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  statusMiniBadgeOn: {
    backgroundColor: "#E8F8F0",
  },
  statusMiniBadgeOff: {
    backgroundColor: "#FFF5E6",
  },
  statusMiniBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  statusMiniBadgeTextOn: {
    color: "#2ECC71",
  },
  statusMiniBadgeTextOff: {
    color: "#FF9500",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 14,
    color: "#888",
    marginTop: 8,
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
    borderRadius: 18,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  detailTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#222",
  },
  detailSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 1,
  },
  closeDetailBtn: {
    padding: 4,
  },
  detailBody: {
    padding: 14,
  },
  crossNavRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  crossNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#E2D3F5",
  },
  crossNavBtnText: {
    fontSize: 11,
    fontWeight: "bold",
    color: PURPLE,
  },
  infoCardSection: {
    backgroundColor: "#F9F9FB",
    padding: 10,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoLabel: {
    fontSize: 11,
    color: "#666",
  },
  infoValue: {
    fontSize: 11,
    color: "#222",
    fontWeight: "600",
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 6,
  },
  descBox: {
    backgroundColor: "#F9F9FB",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  descText: {
    fontSize: 12,
    color: "#444",
    lineHeight: 17,
  },
  portfolioImg: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
  },
  actionsSection: {
    marginTop: 16,
    gap: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  toggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  toggleBtnDeactivate: {
    backgroundColor: "#FFF5E6",
  },
  toggleBtnActivate: {
    backgroundColor: "#E8F8F0",
  },
  toggleBtnText: {
    fontSize: 13,
    fontWeight: "bold",
  },
  deleteSrvBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF0F0",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  deleteSrvBtnText: {
    fontSize: 13,
    color: "#FF3B30",
    fontWeight: "bold",
  },
  noServicesText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 20,
  },
});
