import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Review } from "../../features/perfil/models/profile.types";

const PURPLE = "#5A2D82";
const STAR_COLOR = "#FFB800";

function formatReviewDate(dateStr?: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export interface ReviewsCardProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  renderStars: (calificacion: number) => React.ReactNode;
  title?: string;
}

export default function ReviewsCard({
  reviews,
  averageRating,
  totalReviews,
  renderStars,
  title = "Reseñas",
}: ReviewsCardProps) {
  const [selectedStar, setSelectedStar] = useState<number | null>(null);
  const [showFilterPicker, setShowFilterPicker] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});

  const filteredReviews = selectedStar
    ? (reviews || []).filter((r) => Math.round(r.calificacion) === selectedStar)
    : reviews || [];

  const toggleReply = (id: string) => {
    setExpandedReplies((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <View style={styles.reviewsCard}>
      <View style={styles.reviewsHeaderRow}>
        <Text style={styles.reviewsCardTitle}>{title}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
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
                selectedStar !== null && styles.filterBtnActive,
              ]}
              onPress={() => setShowFilterPicker(!showFilterPicker)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="filter-variant"
                size={16}
                color={selectedStar !== null ? PURPLE : "#555"}
              />
              <Text
                style={[
                  styles.filterBtnText,
                  selectedStar !== null && styles.filterBtnTextActive,
                ]}
              >
                {selectedStar !== null ? `${selectedStar}★` : "Filtrar"}
              </Text>
              <MaterialCommunityIcons
                name={showFilterPicker ? "chevron-up" : "chevron-down"}
                size={14}
                color={selectedStar !== null ? PURPLE : "#666"}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Menú de Filtros por Estrellas */}
      {showFilterPicker && (
        <View style={styles.filterPickerContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterChipsScroll}
          >
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedStar === null && styles.filterChipSelected,
              ]}
              onPress={() => {
                setSelectedStar(null);
                setShowFilterPicker(false);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedStar === null && styles.filterChipTextSelected,
                ]}
              >
                Todas ({reviews.length})
              </Text>
            </TouchableOpacity>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = (reviews || []).filter(
                (r) => Math.round(r.calificacion) === star
              ).length;
              return (
                <TouchableOpacity
                  key={star}
                  style={[
                    styles.filterChip,
                    selectedStar === star && styles.filterChipSelected,
                  ]}
                  onPress={() => {
                    setSelectedStar(star);
                    setShowFilterPicker(false);
                  }}
                >
                  <MaterialCommunityIcons
                    name="star"
                    size={12}
                    color={selectedStar === star ? "white" : STAR_COLOR}
                  />
                  <Text
                    style={[
                      styles.filterChipText,
                      selectedStar === star && styles.filterChipTextSelected,
                    ]}
                  >
                    {star} {star === 1 ? "estrella" : "estrellas"} ({count})
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
            Mostrando reseñas de {selectedStar}{" "}
            {selectedStar === 1 ? "estrella" : "estrellas"} (
            {filteredReviews.length})
          </Text>
          <TouchableOpacity onPress={() => setSelectedStar(null)}>
            <MaterialCommunityIcons name="close-circle" size={16} color={PURPLE} />
          </TouchableOpacity>
        </View>
      )}

      {!reviews || reviews.length === 0 ? (
        <Text style={styles.noReviewsText}>
          Aún no hay reseñas para este servicio.
        </Text>
      ) : filteredReviews.length === 0 ? (
        <Text style={styles.noReviewsText}>
          No hay reseñas de {selectedStar}{" "}
          {selectedStar === 1 ? "estrella" : "estrellas"} para este servicio.
        </Text>
      ) : (
        <ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={true}
          style={
            filteredReviews.length > 5 ? styles.reviewsScrollLimited : undefined
          }
          contentContainerStyle={styles.reviewsListContainer}
        >
          {filteredReviews.map((rev, idx) => {
            const hasReply = !!rev.respuesta_profesional;
            const isExpanded = !!expandedReplies[rev.id];

            return (
              <View
                key={rev.id || idx}
                style={[
                  styles.reviewItem,
                  idx > 0 && styles.reviewItemBorder,
                ]}
              >
                <View style={styles.reviewUserHeader}>
                  {rev.usuarios?.foto_perfil ? (
                    <Image
                      source={{ uri: rev.usuarios.foto_perfil }}
                      style={styles.reviewAvatar}
                    />
                  ) : (
                    <View style={styles.reviewAvatarPlaceholder}>
                      <MaterialCommunityIcons
                        name="account"
                        size={18}
                        color="#999"
                      />
                    </View>
                  )}

                  <View style={{ flex: 1 }}>
                    <Text style={styles.reviewUserName}>
                      {rev.usuarios
                        ? `${rev.usuarios.nombre} ${rev.usuarios.apellidos}`.trim()
                        : "Cliente"}
                    </Text>
                    <View style={styles.reviewSubRow}>
                      {renderStars(rev.calificacion)}
                      {rev.fecha_creacion ? (
                        <Text style={styles.reviewDate}>
                          {formatReviewDate(rev.fecha_creacion)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
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
                      <MaterialCommunityIcons
                        name="comment-text-outline"
                        size={14}
                        color={PURPLE}
                      />
                      <Text style={styles.viewReplyToggleText}>
                        {isExpanded
                          ? "Ocultar respuesta"
                          : "Ver respuesta del profesional"}
                      </Text>
                      <MaterialCommunityIcons
                        name={isExpanded ? "chevron-up" : "chevron-down"}
                        size={14}
                        color={PURPLE}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.replyBox}>
                        <View style={styles.replyHeader}>
                          <MaterialCommunityIcons
                            name="shield-check"
                            size={14}
                            color={PURPLE}
                          />
                          <Text style={styles.replyAuthor}>
                            Respuesta del profesional
                          </Text>
                        </View>
                        <Text style={styles.replyContent}>
                          {rev.respuesta_profesional}
                        </Text>
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

const styles = StyleSheet.create({
  reviewsCard: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    marginTop: 2,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 10px rgba(0,0,0,0.06)" } as any,
      default: {
        elevation: 3,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowOffset: { width: 0, height: 3 },
        shadowRadius: 8,
      },
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
    paddingVertical: 4,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
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
    fontWeight: "600",
    color: "#555",
  },
  filterChipTextSelected: {
    color: "white",
  },
  activeFilterBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 12,
    paddingVertical: 6,
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
    fontStyle: "italic",
    paddingVertical: 4,
  },
  reviewsScrollLimited: {
    maxHeight: 380,
  },
  reviewsListContainer: {
    gap: 12,
  },
  reviewItem: {
    paddingVertical: 10,
  },
  reviewItemBorder: {
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  reviewUserHeader: {
    flexDirection: "row",
    alignItems: "center",
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
    backgroundColor: "#EEE",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333",
  },
  reviewSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  reviewDate: {
    fontSize: 11,
    color: "#888",
  },
  reviewComment: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginTop: 2,
  },
  viewReplyToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
  },
  viewReplyToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: PURPLE,
  },
  replyBox: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE,
    marginTop: 6,
  },
  replyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  replyAuthor: {
    fontSize: 11,
    fontWeight: "700",
    color: PURPLE,
  },
  replyContent: {
    fontSize: 12,
    color: "#4B5563",
    lineHeight: 16,
  },
});
