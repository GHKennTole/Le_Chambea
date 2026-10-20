import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform, Modal } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import { usePublicProfileController } from "../controllers/usePublicProfileController";
import { useFavoriteToggle } from "../../favoritos/controllers/useFavoriteToggle";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import GalleryCard from "../../../shared/components/GalleryCard";
import ReviewsCard from "../../../shared/components/ReviewsCard";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

type Props = NativeStackScreenProps<RootStackParamList, "PublicProfile">;

export default function PublicProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const targetId = route.params?.id || route.params?.professionalId || '';
  const targetProfileId = route.params?.professionalProfileId;
  const fromChat = route.params?.fromChat;
  const vm = usePublicProfileController(targetId, targetProfileId);
  const fav = useFavoriteToggle(targetId);
  const [modalPhotos, setModalPhotos] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string | null>(null);

  const handleOpenModal = (photos: string[], index: number) => {
    setModalPhotos(photos);
    setSelectedIndex(index);
  };

  if (vm.loading && !vm.user) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="small" color={PURPLE} />
        <FloatingBackButton />
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
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContainer} 
        showsVerticalScrollIndicator={false}
      >
        {/* Banner morado superior que scrollea */}
        <View style={styles.headerBanner} />

        {/* Contenido centrado que scrollea todo junto */}
        <View style={styles.innerContent}>
          <View style={styles.profileHeaderCard}>
          {vm.user.foto_perfil ? (
            <TouchableOpacity 
              activeOpacity={0.85}
              onPress={() => setSelectedAvatarUrl(vm.user.foto_perfil)}
              style={styles.avatarTouchable}
            >
              <Image source={{ uri: vm.user.foto_perfil }} style={styles.avatar} />
              <View style={styles.avatarZoomBadge}>
                <MaterialCommunityIcons name="magnify-plus-outline" size={13} color="white" />
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.avatarPlaceholder}>
              <MaterialCommunityIcons name="account" size={40} color="#999" />
            </View>
          )}
          
          <Text style={styles.name}>{vm.user?.nombre} {vm.user.apellidos}</Text>
          <Text style={styles.location}><MaterialCommunityIcons name="map-marker" size={14} /> {vm.user.ciudad || 'Ubicación desconocida'}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vm.generalAverage.toFixed(1)}</Text>
              {renderStars(vm.generalAverage)}
              <Text style={styles.statLabel}>Promedio General</Text>
            </View>
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{vm.user.total_trabajos_completados || 0}</Text>
              <MaterialCommunityIcons name="briefcase-check" size={16} color={PURPLE} />
              <Text style={styles.statLabel}>Trabajos Realizados</Text>
            </View>
            <View style={styles.statDivider} />

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

        {vm.services.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Este profesional no tiene servicios activos.</Text>
        ) : (
          <View style={styles.servicesList}>
            {vm.services.map((svc) => (
              <View key={svc.id} style={styles.serviceBlockContainer}>
                {/* Service Details Card */}
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
                />
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 40 }} />
        </View>
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

      {/* Fullscreen Profile Photo Preview Modal (Solo foto y botón X) */}
      <Modal 
        visible={!!selectedAvatarUrl} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setSelectedAvatarUrl(null)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setSelectedAvatarUrl(null)}
        >
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
              <Image 
                source={{ uri: selectedAvatarUrl }} 
                style={styles.avatarModalImage} 
                resizeMode="contain" 
              />
            </View>
          ) : null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  scrollView: { flex: 1, width: '100%' },
  scrollContainer: { 
    position: 'relative', 
    width: '100%', 
    paddingBottom: 20 
  },
  headerBanner: { 
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    height: 180, 
    backgroundColor: PURPLE, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30 
  },
  innerContent: { 
    paddingHorizontal: 16, 
    paddingTop: 10,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },

  profileHeaderCard: { 
    backgroundColor: 'white', borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.1)' } as any,
      default: { elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 4 }, shadowRadius: 10 }
    })
  },
  avatarTouchable: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: { 
    width: 90, 
    height: 90, 
    borderRadius: 45, 
    borderWidth: 3, 
    borderColor: 'white',
    backgroundColor: '#ECECF1',
  },
  avatarZoomBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: PURPLE,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  avatarPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: 'white',
    backgroundColor: '#ECECF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  servicesList: { gap: 20, marginTop: 12 },
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
  avatarModalContent: {
    width: '100%',
    height: '75%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  avatarModalImage: {
    width: '100%',
    height: '100%',
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
});
