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
import { AdminReview, AdminUser } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  reviews: AdminReview[];
  users: AdminUser[];
  initialSelectedUser?: AdminUser | null;
  onDeleteReview: (reviewId: string) => void;
  onGoToUserDirectory?: (user: AdminUser) => void;
  onGoToServices?: (user: AdminUser) => void;
}

export default function AdminReviewsModal({
  visible,
  onClose,
  reviews,
  users,
  initialSelectedUser,
  onDeleteReview,
  onGoToUserDirectory,
  onGoToServices,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [viewMode, setViewMode] = useState<"by_user" | "all">("by_user");
  const [search, setSearch] = useState("");
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(initialSelectedUser || null);

  React.useEffect(() => {
    if (initialSelectedUser) {
      setSelectedUser(initialSelectedUser);
      setViewMode("by_user");
    }
  }, [initialSelectedUser, visible]);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const fullName = `${u.nombre || ""} ${u.apellidos || ""}`.toLowerCase();
    const email = (u.correo || "").toLowerCase();
    const query = search.toLowerCase().trim();

    // Check if user has any reviews (as client or as pro)
    const hasReviewsAsClient = reviews.some((r) => r.cliente_id === u.id);
    const hasReviewsAsPro = reviews.some((r) => r.profesional_id === u.id);

    return (!query || fullName.includes(query) || email.includes(query));
  });

  // Filter global reviews
  const globalReviews = reviews.filter((r) => {
    const comment = (r.comentario || "").toLowerCase();
    const clientName = `${r.cliente?.nombre || ""} ${r.cliente?.apellidos || ""}`.toLowerCase();
    const proName = `${r.profesional?.nombre || ""} ${r.profesional?.apellidos || ""}`.toLowerCase();
    const query = search.toLowerCase().trim();

    const matchesSearch = !query || comment.includes(query) || clientName.includes(query) || proName.includes(query);
    const matchesStar = starFilter === null || r.calificacion === starFilter;

    return matchesSearch && matchesStar;
  });

  // Reviews for the selected user
  const clientReviews = selectedUser ? reviews.filter((r) => r.cliente_id === selectedUser.id) : [];
  const proReviews = selectedUser ? reviews.filter((r) => r.profesional_id === selectedUser.id) : [];

  const confirmDelete = (review: AdminReview) => {
    if (Platform.OS === "web") {
      if (confirm("¿Estás seguro de eliminar permanentemente esta reseña de la plataforma?")) {
        onDeleteReview(review.id);
      }
    } else {
      Alert.alert(
        "Eliminar Reseña",
        "¿Estás seguro de eliminar permanentemente esta reseña de la plataforma?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar Reseña",
            style: "destructive",
            onPress: () => onDeleteReview(review.id),
          },
        ]
      );
    }
  };

  const renderStars = (rating: number) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= rating ? "star" : "star-outline"}
            size={15}
            color="#FFB800"
          />
        ))}
        <Text style={styles.ratingValueText}>{rating}.0</Text>
      </View>
    );
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
            <Text style={styles.headerTitle}>Moderar Reseñas y Opiniones</Text>
            <Text style={styles.headerSubtitle}>{reviews.length} opiniones registradas en total</Text>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, viewMode === "by_user" && styles.tabBtnActive]}
            onPress={() => {
              setViewMode("by_user");
              setSelectedUser(null);
            }}
          >
            <MaterialCommunityIcons
              name="account-search-outline"
              size={18}
              color={viewMode === "by_user" ? PURPLE : "#666"}
            />
            <Text style={[styles.tabBtnText, viewMode === "by_user" && styles.tabBtnTextActive]}>
              Buscar por Usuario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, viewMode === "all" && styles.tabBtnActive]}
            onPress={() => {
              setViewMode("all");
              setSelectedUser(null);
            }}
          >
            <MaterialCommunityIcons
              name="format-list-bulleted"
              size={18}
              color={viewMode === "all" ? PURPLE : "#666"}
            />
            <Text style={[styles.tabBtnText, viewMode === "all" && styles.tabBtnTextActive]}>
              Ver Todas ({reviews.length})
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
                viewMode === "by_user"
                  ? "Buscar usuario por nombre o correo..."
                  : "Buscar en comentarios o autores..."
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

        {/* Star Rating Filters (Only in 'all' mode) */}
        {viewMode === "all" && (
          <View style={styles.filtersBarContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filtersBarContent}
            >
              <TouchableOpacity
                style={[styles.filterChip, starFilter === null && styles.filterChipActive]}
                onPress={() => setStarFilter(null)}
              >
                <Text style={[styles.filterChipText, starFilter === null && styles.filterChipTextActive]}>
                  Todas
                </Text>
              </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((s) => {
              const count = reviews.filter((r) => r.calificacion === s).length;
              const isSelected = starFilter === s;
              return (
                <TouchableOpacity
                  key={s}
                  style={[styles.filterChip, isSelected && styles.filterChipActive]}
                  onPress={() => setStarFilter(isSelected ? null : s)}
                >
                  <MaterialCommunityIcons name="star" size={14} color={isSelected ? "white" : "#FFB800"} />
                  <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                    {s}★ ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
            </ScrollView>
          </View>
        )}

        {/* Content Body */}
        {viewMode === "by_user" ? (
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="account-search-outline" size={50} color="#BBB" />
                <Text style={styles.emptyTitle}>No se encontraron usuarios</Text>
              </View>
            ) : (
              filteredUsers.map((user) => {
                const fullName = `${user.nombre || ""} ${user.apellidos || ""}`.trim() || "Usuario";
                const writtenCount = reviews.filter((r) => r.cliente_id === user.id).length;
                const receivedCount = reviews.filter((r) => r.profesional_id === user.id).length;

                return (
                  <TouchableOpacity
                    key={user.id}
                    style={styles.userItemCard}
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

                    <View style={styles.userItemInfo}>
                      <Text style={styles.userItemName}>{fullName}</Text>
                      <Text style={styles.userItemEmail}>{user.correo || "Sin correo"}</Text>

                      <View style={styles.userBadgesRow}>
                        <View style={styles.badgeMiniPill}>
                          <Text style={styles.badgeMiniText}>{writtenCount} hechas como cliente</Text>
                        </View>
                        {receivedCount > 0 && (
                          <View style={[styles.badgeMiniPill, { backgroundColor: "#EBF3FF" }]}>
                            <Text style={[styles.badgeMiniText, { color: "#007AFF" }]}>
                              {receivedCount} recibidas como pro
                            </Text>
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
          /* Global Reviews List */
          <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
            {globalReviews.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="star-off-outline" size={50} color="#BBB" />
                <Text style={styles.emptyTitle}>No hay reseñas con estos filtros</Text>
              </View>
            ) : (
              globalReviews.map((review) => {
                const clientName = `${review.cliente?.nombre || ""} ${review.cliente?.apellidos || ""}`.trim() || "Cliente";
                const proName = `${review.profesional?.nombre || ""} ${review.profesional?.apellidos || ""}`.trim() || "Profesional";

                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardUserRow}>
                        <View style={styles.userCol}>
                          <Text style={styles.clientName}>{clientName}</Text>
                          <Text style={styles.evaluatedPro}>
                            Evaluó a: <Text style={styles.proNameHighlight}>{proName}</Text>
                          </Text>
                        </View>
                      </View>
                      {renderStars(review.calificacion)}
                    </View>

                    <View style={styles.commentBox}>
                      <Text style={styles.commentText}>{review.comentario || "Sin comentario."}</Text>
                    </View>

                    {!!review.respuesta_profesional && (
                      <View style={styles.responseBox}>
                        <View style={styles.responseHeader}>
                          <MaterialCommunityIcons name="reply" size={14} color={PURPLE} />
                          <Text style={styles.responseTitle}>Respuesta del Profesional:</Text>
                        </View>
                        <Text style={styles.responseText}>{review.respuesta_profesional}</Text>
                      </View>
                    )}

                    <View style={styles.cardFooter}>
                      <Text style={styles.dateText}>
                        {review.fecha_creacion
                          ? new Date(review.fecha_creacion).toLocaleDateString("es-ES")
                          : ""}
                      </Text>
                      <TouchableOpacity
                        style={styles.deleteReviewBtn}
                        activeOpacity={0.8}
                        onPress={() => confirmDelete(review)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#FF3B30" />
                        <Text style={styles.deleteReviewBtnText}>Eliminar Reseña</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Modal Detalle de Reseñas de Usuario Seleccionado */}
        {selectedUser && (
          <Modal visible={true} transparent={true} animationType="slide">
            <View style={styles.userDetailOverlay}>
              <View style={styles.userDetailCard}>
                <View style={styles.userDetailHeader}>
                  <View>
                    <Text style={styles.userDetailTitle}>
                      Reseñas de {selectedUser.nombre || "Usuario"}
                    </Text>
                    <Text style={styles.userDetailSubtitle}>{selectedUser.correo}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedUser(null)} style={styles.closeDetailBtn}>
                    <MaterialCommunityIcons name="close" size={22} color="#666" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.userDetailBody} showsVerticalScrollIndicator={false}>
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

                    {onGoToServices && (
                      <TouchableOpacity
                        style={[styles.crossNavBtn, { backgroundColor: "#EBF3FF", borderColor: "#C7DEFF" }]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const u = selectedUser;
                          setSelectedUser(null);
                          onGoToServices(u);
                        }}
                      >
                        <MaterialCommunityIcons name="briefcase-outline" size={16} color="#007AFF" />
                        <Text style={[styles.crossNavBtnText, { color: "#007AFF" }]}>Ver Servicios</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Section: Reseñas hechas como cliente */}
                  <Text style={styles.sectionHeaderTitle}>
                    ✍️ Reseñas hechas como Cliente ({clientReviews.length})
                  </Text>
                  {clientReviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>Este usuario no ha publicado reseñas como cliente.</Text>
                  ) : (
                    clientReviews.map((r) => {
                      const pro = `${r.profesional?.nombre || ""} ${r.profesional?.apellidos || ""}`.trim() || "Profesional";
                      return (
                        <View key={r.id} style={styles.subReviewCard}>
                          <View style={styles.subCardHeader}>
                            <Text style={styles.subProName}>Para: {pro}</Text>
                            {renderStars(r.calificacion)}
                          </View>
                          <Text style={styles.subCommentText}>"{r.comentario}"</Text>
                          {!!r.respuesta_profesional && (
                            <View style={styles.responseBox}>
                              <Text style={styles.responseTitle}>Respuesta recibida:</Text>
                              <Text style={styles.responseText}>{r.respuesta_profesional}</Text>
                            </View>
                          )}
                          <View style={styles.cardFooter}>
                            <Text style={styles.dateText}>
                              {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-ES") : ""}
                            </Text>
                            <TouchableOpacity
                              style={styles.deleteReviewBtn}
                              onPress={() => confirmDelete(r)}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#FF3B30" />
                              <Text style={styles.deleteReviewBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {/* Section: Reseñas recibidas como profesional */}
                  <Text style={[styles.sectionHeaderTitle, { marginTop: 16 }]}>
                    💼 Reseñas recibidas como Profesional ({proReviews.length})
                  </Text>
                  {proReviews.length === 0 ? (
                    <Text style={styles.noReviewsText}>No ha recibido reseñas como profesional.</Text>
                  ) : (
                    proReviews.map((r) => {
                      const client = `${r.cliente?.nombre || ""} ${r.cliente?.apellidos || ""}`.trim() || "Cliente";
                      return (
                        <View key={r.id} style={styles.subReviewCard}>
                          <View style={styles.subCardHeader}>
                            <Text style={styles.subProName}>Por: {client}</Text>
                            {renderStars(r.calificacion)}
                          </View>
                          <Text style={styles.subCommentText}>"{r.comentario}"</Text>
                          {!!r.respuesta_profesional && (
                            <View style={styles.responseBox}>
                              <Text style={styles.responseTitle}>Respuesta que dio este profesional:</Text>
                              <Text style={styles.responseText}>{r.respuesta_profesional}</Text>
                            </View>
                          )}
                          <View style={styles.cardFooter}>
                            <Text style={styles.dateText}>
                              {r.fecha_creacion ? new Date(r.fecha_creacion).toLocaleDateString("es-ES") : ""}
                            </Text>
                            <TouchableOpacity
                              style={styles.deleteReviewBtn}
                              onPress={() => confirmDelete(r)}
                            >
                              <MaterialCommunityIcons name="trash-can-outline" size={14} color="#FF3B30" />
                              <Text style={styles.deleteReviewBtnText}>Eliminar</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                  <View style={{ height: 20 }} />
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
    paddingBottom: 4,
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
  },
  filtersBarContent: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: PURPLE,
  },
  filterChipText: {
    fontSize: 12,
    color: "#666",
  },
  filterChipTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  userItemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  avatarWrap: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    backgroundColor: "#ECECF0",
    justifyContent: "center",
    alignItems: "center",
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  userItemEmail: {
    fontSize: 12,
    color: "#777",
  },
  userBadgesRow: {
    flexDirection: "row",
    gap: 6,
    marginTop: 4,
  },
  badgeMiniPill: {
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeMiniText: {
    fontSize: 10,
    color: PURPLE,
    fontWeight: "600",
  },
  reviewCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardUserRow: {
    flex: 1,
  },
  userCol: {
    flex: 1,
  },
  clientName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#222",
  },
  evaluatedPro: {
    fontSize: 11,
    color: "#777",
  },
  proNameHighlight: {
    color: PURPLE,
    fontWeight: "600",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  ratingValueText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#222",
    marginLeft: 3,
  },
  commentBox: {
    backgroundColor: "#F9F9FB",
    padding: 10,
    borderRadius: 8,
    marginBottom: 6,
  },
  commentText: {
    fontSize: 12,
    color: "#333",
    lineHeight: 17,
  },
  responseBox: {
    backgroundColor: LIGHT_PURPLE,
    padding: 8,
    borderRadius: 8,
    marginBottom: 6,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  responseTitle: {
    fontSize: 10,
    fontWeight: "bold",
    color: PURPLE,
  },
  responseText: {
    fontSize: 11,
    color: "#444",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  dateText: {
    fontSize: 10,
    color: "#999",
  },
  deleteReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF0F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  deleteReviewBtnText: {
    fontSize: 11,
    color: "#FF3B30",
    fontWeight: "bold",
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
  userDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  userDetailCard: {
    backgroundColor: "white",
    borderRadius: 18,
    width: "100%",
    maxWidth: 480,
    maxHeight: "85%",
    overflow: "hidden",
  },
  userDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  userDetailTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  userDetailSubtitle: {
    fontSize: 11,
    color: "#777",
  },
  closeDetailBtn: {
    padding: 4,
  },
  userDetailBody: {
    padding: 14,
  },
  sectionHeaderTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  noReviewsText: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
    marginBottom: 8,
  },
  subReviewCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  subCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  subProName: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#222",
  },
  subCommentText: {
    fontSize: 12,
    color: "#444",
    marginBottom: 6,
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
});
