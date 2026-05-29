import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import { usePublicProfileController } from "../controllers/usePublicProfileController";
import { useFavoriteToggle } from "../../favoritos/controllers/useFavoriteToggle";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

type Props = NativeStackScreenProps<RootStackParamList, "PublicProfile">;

export default function PublicProfileScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { id, professionalProfileId, fromChat } = route.params;
  const vm = usePublicProfileController(id, professionalProfileId);
  const fav = useFavoriteToggle(id);

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Profile */}
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

        {/* Services List */}
        <Text style={styles.sectionTitle}>Servicios Profesionales</Text>
        
        {vm.services.length === 0 ? (
          <Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Este profesional no tiene servicios activos.</Text>
        ) : (
          <View style={styles.servicesList}>
            {vm.services.map((svc) => (
              <View key={svc.id} style={styles.serviceCard}>
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
            ))}
          </View>
        )}

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

        <View style={{ height: 40 }} />
      </ScrollView>

      <FloatingBackButton />

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
  headerBanner: { position: "absolute", top: 0, left: 0, right: 0, height: 180, backgroundColor: PURPLE, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
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
    backgroundColor: PURPLE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 16, borderRadius: 16, marginTop: 16, marginBottom: 24, gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 8px rgba(90,45,130,0.3)' } as any,
      default: { elevation: 3, shadowColor: PURPLE, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 }
    })
  },
  chatButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 24, marginBottom: 12, marginLeft: 4 },
  servicesList: { gap: 12 },
  serviceCard: { backgroundColor: 'white', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#ECECF1' },
  serviceHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  serviceProfession: { fontSize: 16, fontWeight: 'bold', color: '#333', flex: 1, paddingRight: 8 },
  serviceRating: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF9E6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  serviceRatingText: { fontSize: 13, fontWeight: 'bold', color: '#555', marginLeft: 4 },
  reviewsCount: { color: '#888', fontWeight: 'normal' },
  categoryTag: { alignSelf: 'flex-start', backgroundColor: '#F3ECFA', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 12 },
  categoryTagText: { fontSize: 12, color: PURPLE, fontWeight: '600' },
  serviceDescription: { fontSize: 14, color: '#555', lineHeight: 20, marginBottom: 16 },
  serviceFooter: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 12 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 13, color: '#666' },

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
});
