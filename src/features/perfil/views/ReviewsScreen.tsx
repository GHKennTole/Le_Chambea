import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useReviewsController } from '../controllers/useReviewsController';
import type { Review } from '../models/profile.types';
import ReviewFilterBar, { ReplyFilterOption } from '../components/ReviewFilterBar';

const PURPLE = '#5A2D82';
const STAR_COLOR = '#FFB800';

export default function ReviewsScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const userId = route.params?.userId; // Si es undefined, usa el usuario actual
  const vm = useReviewsController(userId);

  const [expandedResponses, setExpandedResponses] = useState<Record<string, boolean>>({});
  const [selectedReviewForReply, setSelectedReviewForReply] = useState<Review | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<ReplyFilterOption>('all');

  const toggleExpand = (reviewId: string) => {
    setExpandedResponses((prev) => ({
      ...prev,
      [reviewId]: !prev[reviewId],
    }));
  };

  const openReplyModal = (review: Review) => {
    setSelectedReviewForReply(review);
    setReplyInputText(review.respuesta_profesional || '');
  };

  const handleSaveReply = async () => {
    if (!selectedReviewForReply) return;
    const success = await vm.saveProfessionalReply(selectedReviewForReply.id, replyInputText);
    if (success) {
      setExpandedResponses((prev) => ({ ...prev, [selectedReviewForReply.id]: true }));
      setSelectedReviewForReply(null);
      setReplyInputText('');
    }
  };

  const filteredReviews = useMemo(() => {
    return vm.reviews.filter((review) => {
      // Filter by stars
      if (selectedStars !== null && review.calificacion !== selectedStars) {
        return false;
      }
      // Filter by reply status
      const hasReply = Boolean(review.respuesta_profesional && review.respuesta_profesional.trim());
      if (selectedReplyStatus === 'with_reply' && !hasReply) {
        return false;
      }
      if (selectedReplyStatus === 'without_reply' && hasReply) {
        return false;
      }
      return true;
    });
  }, [vm.reviews, selectedStars, selectedReplyStatus]);

  const serviceOptions = useMemo(() => {
    return vm.services.map((svc) => {
      const svcReviews = vm.allReviews.filter((r) => r.perfil_profesional_id === svc.id);
      const avg = svcReviews.length
        ? (svcReviews.reduce((a, b) => a + b.calificacion, 0) / svcReviews.length).toFixed(1)
        : undefined;

      return {
        id: svc.id,
        name: svc.profesion || svc.categoria || 'Servicio',
        rating: avg,
      };
    });
  }, [vm.services, vm.allReviews]);

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
        {[1, 2, 3, 4, 5].map((star) => (
          <MaterialCommunityIcons
            key={star}
            name={star <= calificacion ? 'star' : 'star-outline'}
            size={16}
            color={STAR_COLOR}
          />
        ))}
      </View>
    );
  };

  const isOwnerProfessional = !userId || (vm.currentUserId && userId === vm.currentUserId);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Morado Dinámico Adaptable */}
        <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 16 }]}>
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
        </View>

        <View style={styles.bodyContent}>
          {/* Componente de Filtros Reutilizable */}
          {vm.allReviews.length > 0 && (
            <ReviewFilterBar
              selectedStars={selectedStars}
              onSelectStars={setSelectedStars}
              selectedReplyStatus={selectedReplyStatus}
              onSelectReplyStatus={setSelectedReplyStatus}
              services={serviceOptions}
              selectedServiceId={vm.selectedServiceId}
              onSelectServiceId={vm.setSelectedServiceId}
            />
          )}

          {/* Lista de Reseñas */}
          <View style={styles.reviewsList}>
            {vm.allReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="star-off" size={48} color="#ccc" />
                <Text style={styles.emptyTitle}>Aún no hay reseñas</Text>
                <Text style={styles.emptyText}>
                  Las calificaciones y comentarios de tus clientes aparecerán aquí.
                </Text>
              </View>
            ) : filteredReviews.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="filter-remove-outline" size={42} color="#999" />
                <Text style={styles.emptyTitle}>Sin resultados con este filtro</Text>
                <Text style={styles.emptyText}>
                  No se encontraron reseñas con los filtros seleccionados.
                </Text>
              </View>
            ) : (
              filteredReviews.map((review) => {
                const isExpanded = !!expandedResponses[review.id];
                const hasResponse = !!review.respuesta_profesional;

                return (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      {review.usuarios?.foto_perfil ? (
                        <Image source={{ uri: review.usuarios.foto_perfil }} style={styles.reviewerAvatar} />
                      ) : (
                        <View
                          style={[
                            styles.reviewerAvatar,
                            { backgroundColor: '#ECECF1', justifyContent: 'center', alignItems: 'center' },
                          ]}
                        >
                          <MaterialCommunityIcons name="account" size={20} color="#999" />
                        </View>
                      )}
                      <View style={styles.reviewerInfo}>
                        <Text style={styles.reviewerName}>
                          {review.usuarios?.nombre} {review.usuarios?.apellidos}
                        </Text>
                        <Text style={styles.reviewDate}>
                          {new Date(review.fecha_creacion).toLocaleDateString()}
                        </Text>
                      </View>
                      <View style={styles.reviewRating}>{renderStars(review.calificacion)}</View>
                    </View>

                    {review.comentario ? (
                      <Text style={styles.reviewComment}>{review.comentario}</Text>
                    ) : null}

                    {/* Acciones de respuesta */}
                    <View style={styles.cardFooterActions}>
                      {hasResponse && (
                        <TouchableOpacity
                          style={styles.viewReplyBtn}
                          onPress={() => toggleExpand(review.id)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="comment-text-outline" size={15} color={PURPLE} />
                          <Text style={styles.viewReplyBtnText}>
                            {isExpanded ? 'Ocultar respuesta' : 'Ver respuesta'}
                          </Text>
                          <MaterialCommunityIcons
                            name={isExpanded ? 'chevron-up' : 'chevron-down'}
                            size={18}
                            color={PURPLE}
                          />
                        </TouchableOpacity>
                      )}

                      {isOwnerProfessional && (
                        <TouchableOpacity
                          style={styles.replyActionBtn}
                          onPress={() => openReplyModal(review)}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name="reply-outline" size={15} color={PURPLE} />
                          <Text style={styles.replyActionBtnText}>
                            {hasResponse ? 'Editar respuesta' : 'Responder'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Caja colapsable de respuesta profesional */}
                    {hasResponse && isExpanded && (
                      <View style={styles.replyBox}>
                        <View style={styles.replyHeaderRow}>
                          <MaterialCommunityIcons name="reply" size={15} color={PURPLE} />
                          <Text style={styles.replyTitle}>Respuesta del profesional</Text>
                          {review.fecha_respuesta && (
                            <Text style={styles.replyDate}>
                              {new Date(review.fecha_respuesta).toLocaleDateString()}
                            </Text>
                          )}
                        </View>
                        <Text style={styles.replyContentText}>{review.respuesta_profesional}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Modal para Responder Reseña */}
      <Modal visible={!!selectedReviewForReply} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedReviewForReply?.respuesta_profesional ? 'Editar Respuesta' : 'Responder Reseña'}
              </Text>
              <TouchableOpacity onPress={() => setSelectedReviewForReply(null)}>
                <MaterialCommunityIcons name="close" size={22} color="#666" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtext}>
              Respuesta para {selectedReviewForReply?.usuarios?.nombre}:
            </Text>

            <TextInput
              style={styles.replyInput}
              placeholder="Escribe tu respuesta como profesional..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={replyInputText}
              onChangeText={setReplyInputText}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setSelectedReviewForReply(null)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, vm.submittingReply && styles.disabledBtn]}
                onPress={handleSaveReply}
                disabled={vm.submittingReply}
              >
                {vm.submittingReply ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Text style={styles.saveBtnText}>Guardar Respuesta</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 22,
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.2)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  headerSection: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  overallRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    width: '100%',
    justifyContent: 'center',
    gap: 16,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any,
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
    }),
  },
  overallRating: {
    fontSize: 46,
    fontWeight: 'bold',
    color: '#222',
  },
  totalReviewsText: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: 'center',
  },

  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.04)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  reviewerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  reviewRating: {
    alignItems: 'flex-end',
  },
  reviewComment: {
    color: '#444',
    fontSize: 14,
    lineHeight: 21,
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECF1',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 10,
  },
  emptyText: {
    color: '#888',
    marginTop: 6,
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 19,
  },

  cardFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  viewReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  viewReplyBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: PURPLE,
  },
  replyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECECF1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
    marginLeft: 'auto',
  },
  replyActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#444',
  },

  replyBox: {
    backgroundColor: '#F8F5FB',
    borderRadius: 14,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5D6F5',
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  replyTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PURPLE,
    flex: 1,
  },
  replyDate: {
    fontSize: 11,
    color: '#888',
  },
  replyContentText: {
    fontSize: 13.5,
    color: '#333',
    lineHeight: 19,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 450,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111',
  },
  modalSubtext: {
    fontSize: 13.5,
    color: '#666',
    marginBottom: 12,
  },
  replyInput: {
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: '#333',
    minHeight: 100,
    borderWidth: 1,
    borderColor: '#ECECF1',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#EEE',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: PURPLE,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  disabledBtn: {
    opacity: 0.6,
  },
});
