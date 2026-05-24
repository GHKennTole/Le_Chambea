import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useReviewsController } from '../controllers/useReviewsController';

const PURPLE = '#5A2D82';
const STAR_COLOR = '#FFB800';

export default function ReviewsScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const userId = route.params?.userId; // Si es undefined, usa el usuario actual
  const vm = useReviewsController(userId);

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const renderStars = (calificacion: number) => {
    return (
      <View style={{ flexDirection: 'row', gap: 2 }}>
        {[1, 2, 3, 4, 5].map(star => (
          <MaterialCommunityIcons 
            key={star} 
            name={star <= calificacion ? "star" : "star-outline"} 
            size={16} 
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
        <View style={styles.headerSection}>
          <Text style={styles.headerTitle}>Reseñas y Calificaciones</Text>
          <View style={styles.overallRatingContainer}>
            <Text style={styles.overallRating}>{vm.generalAverage.toFixed(1)}</Text>
            <View>
              {renderStars(Math.round(vm.generalAverage))}
              <Text style={styles.totalReviewsText}>{vm.allReviews.length} reseñas en total</Text>
            </View>
          </View>
        </View>

        {/* Filters */}
        {vm.services.length > 0 && (
          <View style={styles.filtersContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TouchableOpacity 
                style={[styles.filterChip, !vm.selectedServiceId && styles.filterChipActive]}
                onPress={() => vm.setSelectedServiceId(null)}
              >
                <Text style={[styles.filterText, !vm.selectedServiceId && styles.filterTextActive]}>Todas</Text>
              </TouchableOpacity>
              
              {vm.services.map(svc => {
                const svcReviews = vm.allReviews.filter(r => r.perfil_profesional_id === svc.id);
                const avg = svcReviews.length ? (svcReviews.reduce((a,b)=>a+b.calificacion,0)/svcReviews.length).toFixed(1) : 'N/A';
                
                return (
                  <TouchableOpacity 
                    key={svc.id}
                    style={[styles.filterChip, vm.selectedServiceId === svc.id && styles.filterChipActive]}
                    onPress={() => vm.setSelectedServiceId(svc.id)}
                  >
                    <Text style={[styles.filterText, vm.selectedServiceId === svc.id && styles.filterTextActive]}>
                      {svc.profesion || svc.categoria} ★ {avg}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {vm.reviews.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="star-off" size={40} color="#ccc" />
              <Text style={styles.emptyText}>No hay reseñas para mostrar</Text>
            </View>
          ) : (
            vm.reviews.map(review => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  {review.usuarios?.foto_perfil ? (
                    <Image source={{ uri: review.usuarios.foto_perfil }} style={styles.reviewerAvatar} />
                  ) : (
                    <View style={[styles.reviewerAvatar, { backgroundColor: '#ECECF1', justifyContent: 'center', alignItems: 'center' }]}>
                      <MaterialCommunityIcons name="account" size={20} color="#999" />
                    </View>
                  )}
                  <View style={styles.reviewerInfo}>
                    <Text style={styles.reviewerName}>{review.usuarios?.nombre} {review.usuarios?.apellidos}</Text>
                    <Text style={styles.reviewDate}>{new Date(review.fecha_creacion).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.reviewRating}>
                    {renderStars(review.calificacion)}
                  </View>
                </View>
                {review.comentario ? (
                  <Text style={styles.reviewComment}>{review.comentario}</Text>
                ) : null}
              </View>
            ))
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F8' },
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  headerBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, backgroundColor: PURPLE, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 20 },
  headerSection: { alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 16 },
  overallRatingContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 20, width: '100%', justifyContent: 'center', gap: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  overallRating: { fontSize: 48, fontWeight: 'bold', color: '#333' },
  totalReviewsText: { color: '#888', fontSize: 12, marginTop: 4 },
  filtersContainer: { marginBottom: 16 },
  filterChip: { backgroundColor: 'rgba(90,45,130,0.1)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterChipActive: { backgroundColor: PURPLE },
  filterText: { color: PURPLE, fontWeight: '600', fontSize: 14 },
  filterTextActive: { color: 'white' },
  reviewsList: { gap: 12 },
  reviewCard: { backgroundColor: 'white', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#ECECF1' },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  reviewerAvatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  reviewerInfo: { flex: 1 },
  reviewerName: { fontWeight: 'bold', color: '#333', fontSize: 15 },
  reviewDate: { color: '#888', fontSize: 12 },
  reviewRating: { alignItems: 'flex-end' },
  reviewComment: { color: '#555', fontSize: 14, lineHeight: 20 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyText: { color: '#999', marginTop: 12, fontSize: 16 }
});
