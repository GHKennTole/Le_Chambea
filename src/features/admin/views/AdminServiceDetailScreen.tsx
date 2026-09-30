import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import type { Review, UserProfile } from "../../perfil/models/profile.types";
import type { ServiceWithRating } from "../../inicio/controllers/usePublicProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import GalleryCard from "../../../shared/components/GalleryCard";
import ReviewsCard from "../../../shared/components/ReviewsCard";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { supabase } from "../../../services/supabase";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";
const STAR_COLOR = "#FFB800";

type Props = NativeStackScreenProps<RootStackParamList, "AdminServiceDetail">;


export default function AdminServiceDetailScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const targetId = route.params?.id || "";
  const targetProfileId = route.params?.professionalProfileId;

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<(UserProfile & { esta_activo?: boolean; rol?: string }) | null>(null);
  const [services, setServices] = useState<ServiceWithRating[]>([]);
  const [generalAverage, setGeneralAverage] = useState(0);

  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  const fetchAdminServiceData = useCallback(async () => {
    if (!targetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Fetch User Info
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", targetId)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // 2. Fetch Professional Profiles (services) - Admin can see active & inactive
      let query = supabase
        .from("perfiles_profesionales")
        .select("*")
        .eq("usuario_id", targetId)
        .order("indice_servicio", { ascending: true });

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      if (profilesData && profilesData.length > 0) {
        const profileIds = profilesData.map((p) => p.id);
        const { data: reviewsData, error: reviewsError } = await supabase
          .from("resenas")
          .select("*, usuarios:cliente_id(nombre, apellidos, foto_perfil)")
          .in("perfil_profesional_id", profileIds)
          .order("fecha_creacion", { ascending: false });

        if (reviewsError) throw reviewsError;

        let totalSum = 0;
        let totalCount = 0;

        const servicesWithRatings = profilesData.map((profile) => {
          const profileReviews = (reviewsData || []).filter((r) => r.perfil_profesional_id === profile.id);
          const count = profileReviews.length;
          const sum = profileReviews.reduce((acc, curr) => acc + curr.calificacion, 0);

          totalCount += count;
          totalSum += sum;

          return {
            ...profile,
            averageRating: count > 0 ? sum / count : 0,
            totalReviews: count,
            reviews: profileReviews as Review[],
          };
        });

        let finalServices = servicesWithRatings;
        if (targetProfileId) {
          const filtered = servicesWithRatings.filter((svc) => svc.id === targetProfileId);
          if (filtered.length > 0) {
            finalServices = filtered;
          }
        }

        setServices(finalServices);
        setGeneralAverage(totalCount > 0 ? totalSum / totalCount : 0);
      } else {
        setServices([]);
        setGeneralAverage(0);
      }
    } catch (e) {
      console.error("Error fetching admin service detail:", e);
    } finally {
      setLoading(false);
    }
  }, [targetId, targetProfileId]);

  useEffect(() => {
    fetchAdminServiceData();
  }, [fetchAdminServiceData]);

  const handleOpenModal = (photos: string[], index: number) => {
    setModalPhotos(photos);
    setSelectedIndex(index);
  };

  const renderStars = (calificacion: number) => {
    return (
      <View style={{ flexDirection: "row", gap: 2 }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= Math.round(calificacion) ? "star" : "star-outline"}
            size={14}
            color={STAR_COLOR}
          />
        ))}
      </View>
    );
  };

  if (loading && !user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Cargando información del servicio...</Text>
        <FloatingBackButton />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text style={styles.errorText}>No se encontró el servicio profesional.</Text>
        <FloatingBackButton />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContainer,
          isLargeScreen && styles.scrollContainerDesktop,
          { paddingBottom: Math.max(insets.bottom, 24) + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner morado superior */}
        <View style={[styles.headerBanner, isLargeScreen && styles.headerBannerDesktop]} />

        {/* Contenido centrado */}
        <View style={[styles.innerContent, isLargeScreen && { maxWidth: 1100 }]}>
          {/* Profile Header Card */}
          <View style={styles.profileHeaderCard}>
            {user.foto_perfil ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => setSelectedAvatarUrl(user.foto_perfil)}
                style={styles.avatarTouchable}
              >
                <Image source={{ uri: user.foto_perfil }} style={styles.avatar} />
                <View style={styles.avatarZoomBadge}>
                  <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="white" />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={40} color="#999" />
              </View>
            )}

            <Text style={styles.name}>
              {user.nombre} {user.apellidos}
            </Text>
            <Text style={styles.location}>
              <MaterialCommunityIcons name="map-marker" size={14} /> {user.ciudad || "Ubicación desconocida"}
            </Text>

            {/* Stats Row - Adaptada para Admin (Sin botón de favoritos) */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{generalAverage.toFixed(1)}</Text>
                {renderStars(generalAverage)}
                <Text style={styles.statLabel}>Promedio General</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={styles.statValue}>{user.total_trabajos_completados || 0}</Text>
                <MaterialCommunityIcons name="briefcase-check" size={16} color={PURPLE} />
                <Text style={styles.statLabel}>Trabajos Realizados</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: user.esta_activo !== false ? "#15803D" : "#DC2626" }]}>
                  {user.esta_activo !== false ? "Activo" : "Suspendido"}
                </Text>
                <MaterialCommunityIcons
                  name={user.esta_activo !== false ? "check-decagram" : "alert-circle"}
                  size={16}
                  color={user.esta_activo !== false ? "#15803D" : "#DC2626"}
                />
                <Text style={styles.statLabel}>Estado Cuenta</Text>
              </View>
            </View>
          </View>

          {/* Service List */}
          {services.length === 0 ? (
            <Text style={{ textAlign: "center", color: "#888", marginTop: 20 }}>
              No se encontraron servicios registrados para este usuario.
            </Text>
          ) : (
            <View style={styles.servicesList}>
              {services.map((svc) => (
                <View key={svc.id} style={styles.serviceBlockContainer}>
                  {/* Service Details Card (Sin botón de reportar) */}
                  <View style={styles.serviceCard}>
                    <View style={styles.serviceHeaderRow}>
                      <Text style={styles.serviceProfession}>{svc.profesion}</Text>
                      <View style={styles.serviceRating}>
                        <MaterialCommunityIcons name="star" size={16} color={STAR_COLOR} />
                        <Text style={styles.serviceRatingText}>
                          {svc.averageRating.toFixed(1)} <Text style={styles.reviewsCount}>({svc.totalReviews})</Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryTag}>
                      <Text style={styles.categoryTagText}>{svc.categoria}</Text>
                    </View>

                    {svc.descripcion ? (
                      <Text style={styles.serviceDescription}>{svc.descripcion}</Text>
                    ) : null}

                    <View style={styles.serviceFooter}>
                      <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="cash" size={16} color="#666" />
                        <Text style={styles.footerText}>{svc.rango_precio || "A convenir"}</Text>
                      </View>
                      <View style={styles.footerItem}>
                        <MaterialCommunityIcons name="map-marker-radius" size={16} color="#666" />
                        <Text style={styles.footerText}>{svc.zona || "No especificada"}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Galería de fotos del servicio */}
                  {Array.isArray(svc.portafolio) && svc.portafolio.length > 0 && (
                    <GalleryCard photos={svc.portafolio} onSelectImage={handleOpenModal} />
                  )}

                  {/* Reseñas del servicio (Solo lectura, sin botones de reportar) */}
                  <ReviewsCard
                    reviews={svc.reviews}
                    averageRating={svc.averageRating}
                    totalReviews={svc.totalReviews}
                    renderStars={renderStars}
                  />
                </View>
              ))}
            </View>
          )}

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Botón flotante para regresar a la Ficha de Usuario */}
      <FloatingBackButton />

      {/* Modal para ver fotos del portafolio en pantalla completa */}
      <Modal visible={selectedIndex !== null} transparent animationType="none" onRequestClose={() => setSelectedIndex(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedIndex(null)}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedIndex(null)}>
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </TouchableOpacity>

          {selectedIndex !== null && modalPhotos[selectedIndex] && (
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {selectedIndex > 0 ? (
                <TouchableOpacity
                  style={[styles.arrowBtn, styles.arrowLeft]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(selectedIndex - 1);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-left" size={36} color="white" />
                </TouchableOpacity>
              ) : (
                <View style={styles.arrowPlaceholder} />
              )}

              <Image source={{ uri: modalPhotos[selectedIndex] }} style={styles.modalImage} resizeMode="contain" />

              {selectedIndex < modalPhotos.length - 1 ? (
                <TouchableOpacity
                  style={[styles.arrowBtn, styles.arrowRight]}
                  onPress={(e) => {
                    e.stopPropagation();
                    setSelectedIndex(selectedIndex + 1);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-right" size={36} color="white" />
                </TouchableOpacity>
              ) : (
                <View style={styles.arrowPlaceholder} />
              )}
            </View>
          )}

          {selectedIndex !== null && modalPhotos.length > 1 && (
            <View style={styles.modalCounterWrap}>
              <Text style={styles.modalCounterText}>
                {selectedIndex + 1} / {modalPhotos.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Modal>

      {/* Modal foto de perfil en pantalla completa */}
      <Modal visible={!!selectedAvatarUrl} transparent animationType="none" onRequestClose={() => setSelectedAvatarUrl(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedAvatarUrl(null)}>
          <TouchableOpacity
            style={[styles.modalCloseBtn, { top: Math.max(insets.top + 10, 45) }]}
            onPress={() => setSelectedAvatarUrl(null)}
            activeOpacity={0.8}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <MaterialCommunityIcons name="close" size={30} color="white" />
          </TouchableOpacity>

          {selectedAvatarUrl ? (
            <View style={styles.avatarModalContent} onStartShouldSetResponder={() => true}>
              <Image source={{ uri: selectedAvatarUrl }} style={styles.avatarModalImage} resizeMode="contain" />
            </View>
          ) : null}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F8FA",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 15,
    color: "#888",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    position: "relative",
    width: "100%",
  },
  scrollContainerDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    paddingTop: 20,
  },
  headerBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerBannerDesktop: {
    borderRadius: 24,
    marginTop: 20,
    left: 16,
    right: 16,
  },
  innerContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    alignSelf: "center",
    width: "100%",
    maxWidth: 800,
  },
  profileHeaderCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginTop: 4,
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.1)" } as any,
      default: { elevation: 4, shadowColor: "#000", shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 },
    }),
  },
  avatarTouchable: {
    position: "relative",
    marginBottom: 12,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#ECECF1",
  },
  avatarZoomBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: PURPLE,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: "white",
    backgroundColor: "#ECECF1",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  location: {
    fontSize: 13,
    color: "#666",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    width: "100%",
    borderTopWidth: 1,
    borderTopColor: "#ECECF1",
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#ECECF1",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: PURPLE,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "#888",
    marginTop: 4,
    textTransform: "uppercase",
    textAlign: "center",
    fontWeight: "600",
  },
  servicesList: {
    gap: 16,
    marginTop: 16,
  },
  serviceBlockContainer: {
    gap: 10,
  },
  serviceCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" } as any,
      default: { elevation: 2, shadowColor: "#000", shadowOpacity: 0.04, shadowOffset: { width: 0, height: 2 }, shadowRadius: 6 },
    }),
  },
  serviceHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  serviceProfession: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    paddingRight: 8,
  },
  serviceRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  serviceRatingText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#555",
    marginLeft: 4,
  },
  reviewsCount: {
    color: "#888",
    fontWeight: "normal",
  },
  categoryTag: {
    alignSelf: "flex-start",
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  categoryTagText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: "600",
  },
  serviceDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 16,
  },
  serviceFooter: {
    flexDirection: "row",
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F4",
    paddingTop: 12,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 13,
    color: "#666",
  },
  galleryCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.06)" } as any,
      default: { elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
    }),
  },
  galleryCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  galleryScroll: {
    gap: 12,
    paddingVertical: 2,
  },
  galleryImg: {
    width: 105,
    height: 105,
    borderRadius: 14,
    backgroundColor: "#EEE",
  },
  scrollTrack: {
    height: 3,
    backgroundColor: "#E5E7EB",
    borderRadius: 2,
    marginTop: 10,
    position: "relative",
  },
  scrollThumb: {
    position: "absolute",
    height: 3,
    width: "30%",
    backgroundColor: PURPLE,
    borderRadius: 2,
  },
  reviewsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.06)" } as any,
      default: { elevation: 3, shadowColor: "#000", shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
    }),
  },
  reviewsHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewsCardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  reviewsRatingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewsRatingBadgeText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterBtnActive: {
    backgroundColor: "#F3ECFA",
    borderColor: PURPLE,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#555",
  },
  filterBtnTextActive: {
    color: PURPLE,
  },
  filterPickerContainer: {
    marginBottom: 10,
    paddingTop: 2,
  },
  filterChipsScroll: {
    gap: 8,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterChipSelected: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#555",
  },
  filterChipTextSelected: {
    color: "white",
  },
  activeFilterBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 10,
  },
  activeFilterText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: "600",
  },
  noReviewsText: {
    fontSize: 13,
    color: "#888",
    textAlign: "center",
    marginVertical: 14,
  },
  reviewsScrollLimited: {
    maxHeight: 400,
  },
  reviewsListContainer: {
    gap: 12,
  },
  reviewItem: {
    paddingVertical: 8,
  },
  reviewItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F4",
    paddingTop: 12,
  },
  reviewUserHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  reviewAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F0F4",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewUserName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#333",
  },
  reviewSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: "#999",
  },
  reviewComment: {
    fontSize: 13,
    color: "#555",
    lineHeight: 18,
    marginTop: 4,
  },
  viewReplyToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingVertical: 4,
  },
  viewReplyToggleText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: "600",
  },
  proReplyBox: {
    backgroundColor: "#F9F9FB",
    borderRadius: 10,
    padding: 10,
    marginTop: 4,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE,
  },
  proReplyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  proReplyTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: PURPLE,
  },
  proReplyDate: {
    fontSize: 10,
    color: "#888",
    marginLeft: "auto",
  },
  proReplyText: {
    fontSize: 12,
    color: "#444",
    lineHeight: 17,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  modalContent: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  modalImage: {
    flex: 1,
    height: "80%",
  },
  arrowBtn: {
    padding: 10,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 25,
  },
  arrowLeft: {
    marginRight: 6,
  },
  arrowRight: {
    marginLeft: 6,
  },
  arrowPlaceholder: {
    width: 56,
  },
  modalCounterWrap: {
    position: "absolute",
    bottom: 30,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  modalCounterText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  avatarModalContent: {
    width: "90%",
    height: "70%",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarModalImage: {
    width: "100%",
    height: "100%",
  },
});
