import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import type { Review } from "../../perfil/models/profile.types";
import { usePublicProfileController } from "../controllers/usePublicProfileController";
import { useFavoriteToggle } from "../../favoritos/controllers/useFavoriteToggle";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import ReportServiceModal from "../../../shared/components/ReportServiceModal";
import ReportReviewModal from "../../../shared/components/ReportReviewModal";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

type Props = NativeStackScreenProps<RootStackParamList, "PublicProfile">;

function GalleryCard({ photos, onSelectImage }: { photos: string[]; onSelectImage: (photos: string[], index: number) => void }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [contentWidth, setContentWidth] = useState(1);
  const [containerWidth, setContainerWidth] = useState(1);

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = contentSize.width - layoutMeasurement.width;
    if (maxScroll > 0) {
      const progress = Math.min(Math.max(contentOffset.x / maxScroll, 0), 1);
      setScrollProgress(progress);
    }
  };

  const showIndicator = contentWidth > containerWidth + 5;

  return (
    <View style={styles.galleryCard}>
      <Text style={styles.galleryCardTitle}>Galeria de fotos.</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
        onContentSizeChange={(w) => setContentWidth(w)}
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
        contentContainerStyle={styles.galleryScroll}
      >
        {photos.map((imgUrl, i) => (
          <TouchableOpacity key={i} onPress={() => onSelectImage(photos, i)} activeOpacity={0.85}>
            <Image source={{ uri: imgUrl }} style={styles.galleryImg} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Línea azul indicadora del scroll restante */}
      {showIndicator && (
        <View style={styles.scrollTrack}>
          <View 
            style={[
              styles.scrollThumb, 
              { left: `${scrollProgress * 70}%` }
            ]} 
          />
        </View>
      )}
    </View>
  );
}

function formatReviewDate(dateStr?: string) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '';
  }
}

function ReviewsCard({ 
  reviews, 
  averageRating, 
  totalReviews, 
  renderStars,
  onReportReview,
}: { 
  reviews: Review[]; 
  averageRating: number; 
  totalReviews: number; 
  renderStars: (calificacion: number) => React.ReactNode; 
  onReportReview?: (review: Review) => void;
}) {
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);

  const filteredReviews = selectedStar 
    ? (reviews || []).filter(r => Math.round(r.calificacion) === selectedStar)
    : (reviews || []);

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const toggleReply = (id: string) => {
    setExpandedReplies(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.reviewsCard}>
      <View style={styles.reviewsHeaderRow}>
        <Text style={styles.reviewsCardTitle}>Reseñas.</Text>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {totalReviews > 0 && (
            <View style={styles.reviewsRatingBadge}>
              <MaterialCommunityIcons name="star" size={14} color={STAR_COLOR} />
              <Text style={styles.reviewsRatingBadgeText}>
                {averageRating.toFixed(1)} ({totalReviews})
              </Text>
            </View>
          )}

          {reviews && reviews.length > 0 && (
            <TouchableOpacity 
              style={[
                styles.filterBtn, 
                selectedStar !== null && styles.filterBtnActive
              ]}
              onPress={() => setShowFilterPicker(!showFilterPicker)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons 
                name="filter-variant" 
                size={16} 
                color={selectedStar !== null ? PURPLE : '#555'} 
              />
              <Text style={[
                styles.filterBtnText, 
                selectedStar !== null && styles.filterBtnTextActive
              ]}>
                {selectedStar !== null ? `${selectedStar}★` : 'Filtrar'}
              </Text>
              <MaterialCommunityIcons 
                name={showFilterPicker ? "chevron-up" : "chevron-down"} 
                size={14} 
                color={selectedStar !== null ? PURPLE : '#666'} 
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menú de Filtros por Estrellas */}
      {showFilterPicker && (
        <View style={styles.filterPickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsScroll}>
            <TouchableOpacity 
              style={[styles.filterChip, selectedStar === null && styles.filterChipSelected]}
              onPress={() => { setSelectedStar(null); setShowFilterPicker(false); }}
            >
              <Text style={[styles.filterChipText, selectedStar === null && styles.filterChipTextSelected]}>
                Todas ({reviews.length})
              </Text>
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = (reviews || []).filter(r => Math.round(r.calificacion) === star).length;
              return (
                <TouchableOpacity 
                  key={star}
                  style={[styles.filterChip, selectedStar === star && styles.filterChipSelected]}
                  onPress={() => { setSelectedStar(star); setShowFilterPicker(false); }}
                >
                  <MaterialCommunityIcons name="star" size={12} color={selectedStar === star ? 'white' : STAR_COLOR} />
                  <Text style={[styles.filterChipText, selectedStar === star && styles.filterChipTextSelected]}>
                    {star} {star === 1 ? 'estrella' : 'estrellas'} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Banner de filtro activo */}
      {selectedStar !== null && !showFilterPicker && (
        <View style={styles.activeFilterBanner}>
          <Text style={styles.activeFilterText}>
            Mostrando reseñas de {selectedStar} {selectedStar === 1 ? 'estrella' : 'estrellas'} ({filteredReviews.length})
          </Text>
          <TouchableOpacity onPress={() => setSelectedStar(null)}>
            <MaterialCommunityIcons name="close-circle" size={16} color={PURPLE} />
          </TouchableOpacity>
        </View>
      )}

      {(!reviews || reviews.length === 0) ? (
        <Text style={styles.noReviewsText}>Aún no hay reseñas para este servicio.</Text>
      ) : filteredReviews.length === 0 ? (
        <Text style={styles.noReviewsText}>No hay reseñas de {selectedStar} {selectedStar === 1 ? 'estrella' : 'estrellas'} para este servicio.</Text>
      ) : (
        <ScrollView 
          nestedScrollEnabled 
          showsVerticalScrollIndicator={true}
          style={filteredReviews.length > 5 ? styles.reviewsScrollLimited : undefined}
          contentContainerStyle={styles.reviewsListContainer}
        >
          {filteredReviews.map((rev, idx) => {
            const hasReply = !!rev.respuesta_profesional;
            const isExpanded = !!expandedReplies[rev.id];

            return (
              <View key={rev.id || idx} style={[styles.reviewItem, idx > 0 && styles.reviewItemBorder]}>
                <View style={styles.reviewUserHeader}>
                  {rev.usuarios?.foto_perfil ? (
                    <Image source={{ uri: rev.usuarios.foto_perfil }} style={styles.reviewAvatar} />
                  ) : (
                    <View style={styles.reviewAvatarPlaceholder}>
                      <MaterialCommunityIcons name="account" size={18} color="#999" />
                    </View>
                  )}
                  
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUserName}>
                      {rev.usuarios ? `${rev.usuarios.nombre} ${rev.usuarios.apellidos}`.trim() : 'Cliente'}
                    </Text>
                    <View style={styles.reviewSubRow}>
                      {renderStars(rev.calificacion)}
                      {rev.fecha_creacion ? (
                        <Text style={styles.reviewDate}>{formatReviewDate(rev.fecha_creacion)}</Text>
                      ) : null}
                    </View>
                  </View>

                  {onReportReview && (
                    <TouchableOpacity
                      style={styles.reviewReportBtn}
                      onPress={() => onReportReview(rev)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialCommunityIcons name="flag-outline" size={14} color="#DC2626" />
                    </TouchableOpacity>
                  )}
                </View>

                {rev.comentario ? (
                  <Text style={styles.reviewComment}>{rev.comentario}</Text>
                ) : null}

                {hasReply && (
                  <View style={{ marginTop: 8 }}>
                    <TouchableOpacity 
                      style={styles.viewReplyToggleBtn}
                      onPress={() => toggleReply(rev.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="comment-text-outline" size={14} color={PURPLE} />
                      <Text style={styles.viewReplyToggleText}>
                        {isExpanded ? 'Ocultar respuesta' : 'Ver respuesta del profesional'}
                      </Text>
                      <MaterialCommunityIcons 
                        name={isExpanded ? "chevron-up" : "chevron-down"} 
                        size={16} 
                        color={PURPLE} 
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.proReplyBox}>
                        <View style={styles.proReplyHeader}>
                          <MaterialCommunityIcons name="reply" size={14} color={PURPLE} />
                          <Text style={styles.proReplyTitle}>Respuesta del profesional</Text>
                          {rev.fecha_respuesta && (
                            <Text style={styles.proReplyDate}>{formatReviewDate(rev.fecha_respuesta)}</Text>
                          )}
                        </View>
                        <Text style={styles.proReplyText}>{rev.respuesta_profesional}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

export default function PublicProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const { id, professionalProfileId, fromChat } = route.params;
  const vm = usePublicProfileController(id, professionalProfileId);
  const fav = useFavoriteToggle(id);
  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [reportingService, setReportingService] = useState<any | null>(null);
  const [reportingReview, setReportingReview] = useState<Review | null>(null);

  const handleOpenModal = (photos: string[], index: number) => {
    setModalPhotos(photos);
    setSelectedIndex(index);
  };

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  if (!vm.user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <Text>No se encontró el perfil.</Text>
        <FloatingBackButton />
      </View>
    );
  }

  const renderStars = (calificacion: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBanner} />

      {/* Fixed Header Profile Card */}
      <View style={styles.fixedHeaderWrap}>
        <View style={styles.profileHeaderCard}>
          {vm.user.foto_perfil ? (
            <Image source={{ uri: vm.user.foto_perfil }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: '#ECECF1', justifyContent: 'center', alignItems: 'center' }]}>
              <MaterialCommunityIcons name="account" size={40} color="#999" />
            </View>
          )}
          
          <Text style={styles.name}>{vm.user?.nombre} {vm.user.apellidos}</Text>
          <Text style={styles.location}><MaterialCommunityIcons name="map-marker" size={14} /> {vm.user.ciudad || 'Ubicación desconocida'}</Text>

          <View style={styles.statsRow}>
            {(vm.user as any)?.mostrar_resenas !== false && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{vm.generalAverage.toFixed(1)}</Text>
                  {renderStars(vm.generalAverage)}
                  <Text style={styles.statLabel}>Promedio General</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}
            
            {(vm.user as any)?.mostrar_trabajos !== false && (
              <>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{vm.user.total_trabajos_completados || 0}</Text>
                  <MaterialCommunityIcons name="briefcase-check" size={16} color={PURPLE} />
                  <Text style={styles.statLabel}>Trabajos Realizados</Text>
                </View>
                <View style={styles.statDivider} />
              </>
            )}

            <TouchableOpacity 
              style={styles.statItem} 
              onPress={fav.toggleFavorite}
              activeOpacity={0.7}
            >
              <View style={{ height: 26, justifyContent: 'center', alignItems: 'center', marginBottom: 2 }}>
                <MaterialCommunityIcons
                  name={fav.isFavorite ? "star" : "star-outline"}
                  size={24}
                  color={fav.isFavorite ? "#FFB800" : "#CCC"}
                />
              </View>
              <View style={{ height: 16, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, color: fav.isFavorite ? "#FFB800" : "#999", fontWeight: "bold", textAlign: 'center' }}>
                  {fav.isFavorite ? "Quitar de" : "Añadir a"}
                </Text>
              </View>
              <Text style={styles.statLabel}>Favoritos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {!fromChat && (
          <TouchableOpacity 
            style={styles.chatButton} 
            onPress={vm.initiateChat}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="chat" size={20} color="white" />
            <Text style={styles.chatButtonText}>Chatear con {vm.user?.nombre}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {vm.services.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Este profesional no tiene servicios activos.</Text>
        ) : (
          <View style={styles.servicesList}>
            {vm.services.map((svc) => (
              <View key={svc.id} style={styles.serviceBlockContainer}>
                <Text style={styles.sectionTitle}>Servicio de {svc.profesion}.</Text>

                {/* Service Details Card */}
                <View style={styles.serviceCard}>
                  <View style={styles.serviceHeaderRow}>
                    <Text style={styles.serviceProfession}>{svc.profesion}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <View style={styles.serviceRating}>
                        <MaterialCommunityIcons name="star" size={16} color={STAR_COLOR} />
                        <Text style={styles.serviceRatingText}>
                          {svc.averageRating.toFixed(1)} <Text style={styles.reviewsCount}>({svc.totalReviews})</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.serviceReportBtn}
                        onPress={() => setReportingService(svc)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MaterialCommunityIcons name="shield-alert-outline" size={16} color="#DC2626" />
                      </TouchableOpacity>
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
                      <Text style={styles.footerText}>{svc.rango_precio || 'A convenir'}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <MaterialCommunityIcons name="map-marker-radius" size={16} color="#666" />
                      <Text style={styles.footerText}>{svc.zona || 'No especificada'}</Text>
                    </View>
                  </View>
                </View>

                {/* Galeria de fotos para ESTE servicio */}
                {Array.isArray(svc.portafolio) && svc.portafolio.length > 0 && (
                  <GalleryCard photos={svc.portafolio} onSelectImage={handleOpenModal} />
                )}

                {/* Reseñas para ESTE servicio */}
                <ReviewsCard 
                  reviews={svc.reviews} 
                  averageRating={svc.averageRating} 
                  totalReviews={svc.totalReviews} 
                  renderStars={renderStars} 
                  onReportReview={setReportingReview}
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <FloatingBackButton />

      {/* Fullscreen Image Preview Modal with Navigation Arrows */}
      <Modal visible={selectedIndex !== null} transparent animationType="fade" onRequestClose={() => setSelectedIndex(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSelectedIndex(null)}>
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedIndex(null)}>
            <MaterialCommunityIcons name="close" size={28} color="white" />
          </TouchableOpacity>

          {selectedIndex !== null && modalPhotos[selectedIndex] && (
            <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
              {selectedIndex > 0 ? (
                <TouchableOpacity 
                  style={[styles.arrowBtn, styles.arrowLeft]} 
                  onPress={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex - 1); }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="chevron-left" size={36} color="white" />
                </TouchableOpacity>
              ) : (
                <View style={styles.arrowPlaceholder} />
              )}

              <Image 
                source={{ uri: modalPhotos[selectedIndex] }} 
                style={styles.modalImage} 
                resizeMode="contain" 
              />

              {selectedIndex < modalPhotos.length - 1 ? (
                <TouchableOpacity 
                  style={[styles.arrowBtn, styles.arrowRight]} 
                  onPress={(e) => { e.stopPropagation(); setSelectedIndex(selectedIndex + 1); }}
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

      {/* Toast for favorite toggle */}
      {fav.toastMessage && (
        <View style={[styles.favToast, { top: insets.top + 16 }]}>
          <MaterialCommunityIcons
            name={fav.isFavorite ? "star" : "star-outline"}
            size={16}
            color="#FFB800"
          />
          <Text style={styles.favToastText}>{fav.toastMessage}</Text>
        </View>
      )}

      {/* Modal Reportar Servicio 🚨 */}
      {reportingService && (
        <ReportServiceModal
          visible={!!reportingService}
          onClose={() => setReportingService(null)}
          serviceId={reportingService.id}
          serviceName={reportingService.profesion || reportingService.categoria || 'Servicio'}
          professionalName={`${vm.user.nombre} ${vm.user.apellidos}`.trim()}
        />
      )}

      {/* Modal Reportar Reseña 🚨 */}
      {reportingReview && (
        <ReportReviewModal
          visible={!!reportingReview}
          onClose={() => setReportingReview(null)}
          review={reportingReview}
          professionalName={`${vm.user.nombre} ${vm.user.apellidos}`.trim()}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  headerBanner: { position: "absolute", top: 0, left: 0, right: 0, height: 180, backgroundColor: PURPLE, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 2,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  
  fixedHeaderWrap: { 
    paddingHorizontal: 16, 
    paddingTop: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
    zIndex: 10,
  },

  profileHeaderCard: { 
    backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' } as any,
      default: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }
    })
  },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12, borderWidth: 3, borderColor: 'white' },
  name: { fontSize: 20, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  location: { fontSize: 13, color: '#666', marginBottom: 16 },
  
  statsRow: { flexDirection: 'row', width: '100%', borderTopWidth: 1, borderTopColor: '#ECECF1', paddingTop: 16 },
  statItem: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, backgroundColor: '#ECECF1' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: PURPLE, marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase', textAlign: 'center' },

  chatButton: { 
    backgroundColor: PURPLE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 10, marginBottom: 4, gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(90,45,130,0.3)' } as any,
      default: { elevation: 3, shadowColor: PURPLE, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }
    })
  },
  chatButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 16, marginBottom: 10, textAlign: 'center' },
  servicesList: { gap: 20 },
  serviceBlockContainer: { gap: 10 },
  serviceCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ECECF1' },
  serviceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serviceProfession: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 8 },
  serviceRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  serviceRatingText: { fontSize: 13, fontWeight: 'bold', color: '#555', marginLeft: 4 },
  reviewsCount: { color: '#888', fontWeight: 'normal' },
  categoryTag: { alignSelf: 'flex-start', backgroundColor: '#F3ECFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  categoryTagText: { fontSize: 12, color: PURPLE, fontWeight: '600' },
  serviceDescription: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 16 },
  serviceFooter: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F0F0F4', paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: '#666' },

  galleryCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    marginTop: 2, 
    borderWidth: 1, 
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.06)' } as any,
      default: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 }
    })
  },
  galleryCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 12 },
  galleryScroll: { gap: 12, paddingVertical: 2 },
  galleryImg: { width: 105, height: 105, borderRadius: 14, backgroundColor: "#EEE" },

  reviewsCard: { 
    backgroundColor: 'white', 
    borderRadius: 20, 
    padding: 16, 
    marginTop: 2, 
    borderWidth: 1, 
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.06)' } as any,
      default: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 }
    })
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewsCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  reviewsRatingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  reviewsRatingBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterBtnActive: {
    backgroundColor: '#F3ECFA',
    borderColor: PURPLE,
  },
  filterBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
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
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  filterChipSelected: {
    backgroundColor: PURPLE,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
  },
  filterChipTextSelected: {
    color: 'white',
  },
  activeFilterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  activeFilterText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '600',
  },
  noReviewsText: {
    fontSize: 13,
    color: '#888',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  reviewsScrollLimited: {
    maxHeight: 380,
  },
  reviewsListContainer: {
    gap: 12,
  },
  reviewItem: {
    paddingVertical: 6,
  },
  reviewItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F4',
    paddingTop: 12,
  },
  reviewUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  reviewAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ECECF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  reviewSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: '#999',
  },
  reviewComment: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginTop: 4,
    marginLeft: 46,
  },

  scrollTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    marginTop: 12,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  scrollThumb: {
    height: '100%',
    width: '30%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
    position: 'absolute',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 30,
    padding: 8,
  },
  modalContent: {
    width: '100%',
    height: '75%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  modalImage: {
    flex: 1,
    height: '100%',
  },
  arrowBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 25,
  },
  arrowLeft: {
    marginRight: 4,
  },
  arrowRight: {
    marginLeft: 4,
  },
  arrowPlaceholder: {
    width: 44,
  },
  modalCounterWrap: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modalCounterText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  favToast: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    zIndex: 999,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.2)' } as any,
      default: { elevation: 6, shadowColor: '#000', shadowOpacity: 0.2, shadowOffset: { width: 0, height: 4 }, shadowRadius: 6 }
    })
  },
  favToastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },

  viewReplyToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECFA',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 5,
    marginTop: 4,
  },
  viewReplyToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  proReplyBox: {
    backgroundColor: '#F8F5FB',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E5D6F5',
  },
  proReplyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  proReplyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PURPLE,
    flex: 1,
  },
  proReplyDate: {
    fontSize: 10.5,
    color: '#888',
  },
  proReplyText: {
    fontSize: 12.5,
    color: '#333',
    lineHeight: 18,
  },
  serviceReportBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  reviewReportBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});
