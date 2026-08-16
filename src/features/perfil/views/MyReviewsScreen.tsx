import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useMyReviewsController, MyReviewItem } from '../controllers/useMyReviewsController';
import type { RootStackParamList } from '../../../core/navigation/types';
import ReviewFilterBar, { ReplyFilterOption } from '../components/ReviewFilterBar';
import ReportReviewModal from '../../../shared/components/ReportReviewModal';
import { useResponsive } from '../../../shared/hooks/useResponsive';

const PURPLE = '#5A2D82';
const PURPLE_ACCENT = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';
const STAR_COLOR = '#FFB800';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function MyReviewsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const vm = useMyReviewsController();
  const { isLargeScreen } = useResponsive();

  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [selectedReviewForReport, setSelectedReviewForReport] = useState<any | null>(null);
  const [selectedStars, setSelectedStars] = useState<number | null>(null);
  const [selectedReplyStatus, setSelectedReplyStatus] = useState<ReplyFilterOption>('all');

  const toggleReply = (id: string) => {
    setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  useFocusEffect(
    useCallback(() => {
      vm.fetchMyReviews();
    }, [vm.fetchMyReviews])
  );

  const renderStars = (calificacion: number) => {
    return (
      <View style={styles.starsRow}>
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

  const filteredReviews = useMemo(() => {
    return vm.reviews.filter((item) => {
      if (selectedStars !== null && item.calificacion !== selectedStars) {
        return false;
      }
      const hasReply = Boolean(item.respuesta_profesional && item.respuesta_profesional.trim());
      if (selectedReplyStatus === 'with_reply' && !hasReply) {
        return false;
      }
      if (selectedReplyStatus === 'without_reply' && hasReply) {
        return false;
      }
      return true;
    });
  }, [vm.reviews, selectedStars, selectedReplyStatus]);

  const handleEdit = (item: MyReviewItem) => {
    navigation.navigate('WriteReview', {
      reviewId: item.id,
      profileId: item.perfil_profesional_id,
      professionalId: item.profesional_id,
      jobId: item.trabajo_id,
    });
  };

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
            <Text style={styles.headerTitle}>Reseñas Dejadas</Text>
            <Text style={styles.headerSubtitle}>
              Administra las reseñas que has hecho como cliente
            </Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {vm.loading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" color={PURPLE} />
            </View>
          ) : vm.reviews.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="star-off" size={48} color="#999" />
              <Text style={styles.emptyTitle}>Sin reseñas dejadas</Text>
              <Text style={styles.emptyText}>Aún no has calificado ningún servicio contratado.</Text>
            </View>
          ) : (
            <View>
              {/* Barra de Filtros Reutilizable */}
              <ReviewFilterBar
                selectedStars={selectedStars}
                onSelectStars={setSelectedStars}
                selectedReplyStatus={selectedReplyStatus}
                onSelectReplyStatus={setSelectedReplyStatus}
              />

              {filteredReviews.length === 0 ? (
                <View style={styles.emptyCard}>
                  <MaterialCommunityIcons name="filter-remove-outline" size={42} color="#999" />
                  <Text style={styles.emptyTitle}>Sin resultados con este filtro</Text>
                  <Text style={styles.emptyText}>
                    No hay reseñas que coincidan con la calificación o estado seleccionado.
                  </Text>
                </View>
              ) : (
                <View style={styles.reviewsList}>
                  {filteredReviews.map((item) => {
                    const proName = item.usuarios
                      ? `${item.usuarios.nombre} ${item.usuarios.apellidos}`.trim()
                      : 'Profesional';
                    const serviceName =
                      item.perfiles_profesionales?.profesion ||
                      item.perfiles_profesionales?.categoria ||
                      'Servicio';
                    const dateStr = item.fecha_creacion
                      ? new Date(item.fecha_creacion).toLocaleDateString()
                      : '';
                    const hasReply = !!item.respuesta_profesional;
                    const isExpanded = !!expandedReplies[item.id];

                    return (
                      <View key={item.id} style={styles.reviewCard}>
                        {/* Card Header: Avatar & Pro details */}
                        <View style={styles.cardHeader}>
                          {item.usuarios?.foto_perfil ? (
                            <Image source={{ uri: item.usuarios.foto_perfil }} style={styles.avatar} />
                          ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder]}>
                              <MaterialCommunityIcons name="account" size={24} color="#999" />
                            </View>
                          )}

                          <View style={styles.proInfo}>
                            <Text style={styles.proName} numberOfLines={1}>
                              {proName}
                            </Text>
                            <View style={styles.serviceBadge}>
                              <MaterialCommunityIcons name="briefcase-outline" size={12} color={PURPLE} />
                              <Text style={styles.serviceBadgeText} numberOfLines={1}>
                                {serviceName}
                              </Text>
                            </View>
                          </View>

                          <Text style={styles.dateText}>{dateStr}</Text>
                        </View>

                        <View style={styles.divider} />

                        {/* Rating & Comment */}
                        <View style={styles.ratingSection}>
                          <View style={styles.ratingRow}>
                            {renderStars(item.calificacion)}
                            <Text style={styles.ratingValueText}>{item.calificacion} / 5</Text>
                          </View>

                          {item.comentario ? (
                            <Text style={styles.commentText}>{item.comentario}</Text>
                          ) : (
                            <Text style={styles.noCommentText}>Sin comentario escrito</Text>
                          )}
                        </View>

                        {/* Professional reply section */}
                        {hasReply && (
                          <View style={{ marginTop: 10 }}>
                            <TouchableOpacity
                              style={styles.viewReplyBtn}
                              onPress={() => toggleReply(item.id)}
                              activeOpacity={0.7}
                            >
                              <MaterialCommunityIcons name="comment-text-outline" size={14} color={PURPLE} />
                              <Text style={styles.viewReplyBtnText}>
                                {isExpanded ? 'Ocultar respuesta' : 'Ver respuesta del profesional'}
                              </Text>
                              <MaterialCommunityIcons
                                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                size={16}
                                color={PURPLE}
                              />
                            </TouchableOpacity>

                            {isExpanded && (
                              <View style={styles.replyBox}>
                                <View style={styles.replyHeaderRow}>
                                  <MaterialCommunityIcons name="reply" size={14} color={PURPLE} />
                                  <Text style={styles.replyTitle}>Respuesta del profesional</Text>
                                  {item.fecha_respuesta && (
                                    <Text style={styles.replyDate}>
                                      {new Date(item.fecha_respuesta).toLocaleDateString()}
                                    </Text>
                                  )}
                                </View>
                                <Text style={styles.replyContentText}>{item.respuesta_profesional}</Text>
                              </View>
                            )}
                          </View>
                        )}

                        <View style={styles.divider} />

                        {/* Action buttons */}
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnReport]}
                            onPress={() => setSelectedReviewForReport(item)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons name="flag-outline" size={16} color="#DC2626" />
                            <Text style={styles.btnReportText}>Reportar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnEdit]}
                            onPress={() => handleEdit(item)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons name="square-edit-outline" size={16} color={PURPLE} />
                            <Text style={styles.btnEditText}>Editar</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.btnAction, styles.btnDelete]}
                            onPress={() => vm.deleteReview(item.id)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                            <Text style={styles.btnDeleteText}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>

      {/* Modal Reportar Reseña 🚨 */}
      {selectedReviewForReport && (
        <ReportReviewModal
          visible={!!selectedReviewForReport}
          onClose={() => setSelectedReviewForReport(null)}
          review={selectedReviewForReport}
          professionalName={selectedReviewForReport?.usuarios ? `${selectedReviewForReport.usuarios.nombre} ${selectedReviewForReport.usuarios.apellidos}`.trim() : 'Profesional'}
        />
      )}

      <FloatingBackButton hideOnMobile />
    </View>
  );
}

const styles = StyleSheet.create({
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
    paddingBottom: 20,
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
    marginBottom: 6,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13.5,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 12,
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },

  loadingState: {
    paddingVertical: 50,
    alignItems: 'center',
  },

  emptyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.06)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 8,
      },
    }),
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13.5,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },

  reviewsList: {
    gap: 14,
  },
  reviewCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.05)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  proInfo: {
    flex: 1,
  },
  proName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 4,
    marginTop: 4,
  },
  serviceBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: PURPLE,
  },
  dateText: {
    fontSize: 11.5,
    color: '#999',
  },

  divider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 12,
  },

  ratingSection: {
    gap: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingValueText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#444',
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCommentText: {
    fontSize: 13,
    color: '#aaa',
    fontStyle: 'italic',
  },

  viewReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
  },
  viewReplyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  replyBox: {
    backgroundColor: '#F8F5FB',
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E5D6F5',
  },
  replyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  replyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: PURPLE,
    flex: 1,
  },
  replyDate: {
    fontSize: 10.5,
    color: '#888',
  },
  replyContentText: {
    fontSize: 12.5,
    color: '#333',
    lineHeight: 18,
  },

  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 6,
  },
  btnReport: {
    backgroundColor: '#FEE2E2',
  },
  btnReportText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
  btnEdit: {
    backgroundColor: PURPLE_LIGHT,
  },
  btnEditText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE,
  },
  btnDelete: {
    backgroundColor: '#FEE2E2',
  },
  btnDeleteText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#DC2626',
  },
});
