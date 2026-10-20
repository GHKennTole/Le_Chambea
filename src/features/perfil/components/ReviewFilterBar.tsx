import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const PURPLE = '#5A2D82';
const PURPLE_ACCENT = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';
const STAR_COLOR = '#FFB800';

export type ReplyFilterOption = 'all' | 'with_reply' | 'without_reply';

export interface ReviewServiceOption {
  id: string;
  name: string;
  rating?: number | string;
}

interface ReviewFilterBarProps {
  selectedStars: number | null;
  onSelectStars: (stars: number | null) => void;
  selectedReplyStatus: ReplyFilterOption;
  onSelectReplyStatus: (status: ReplyFilterOption) => void;
  services?: ReviewServiceOption[];
  selectedServiceId?: string | null;
  onSelectServiceId?: (id: string | null) => void;
  style?: any;
}

const STAR_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: 'Todas', value: null },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
];

const REPLY_OPTIONS: Array<{ label: string; value: ReplyFilterOption; icon: string }> = [
  { label: 'Todas', value: 'all', icon: 'format-list-bulleted' },
  { label: 'Respondidas', value: 'with_reply', icon: 'comment-check-outline' },
  { label: 'Sin responder', value: 'without_reply', icon: 'clock-outline' },
];

export default function ReviewFilterBar({
  selectedStars,
  onSelectStars,
  selectedReplyStatus,
  onSelectReplyStatus,
  services,
  selectedServiceId,
  onSelectServiceId,
  style,
}: ReviewFilterBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount =
    (selectedStars !== null ? 1 : 0) +
    (selectedReplyStatus !== 'all' ? 1 : 0) +
    (selectedServiceId ? 1 : 0);

  const toggleExpand = () => {
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    setIsExpanded(!isExpanded);
  };

  const handleResetFilters = (e?: any) => {
    if (e && e.stopPropagation) e.stopPropagation();
    onSelectStars(null);
    onSelectReplyStatus('all');
    if (onSelectServiceId) onSelectServiceId(null);
  };

  return (
    <View style={[styles.container, style]}>
      {/* Barra compacta de despliegue (Siempre visible) */}
      <TouchableOpacity
        style={styles.dropdownHeader}
        onPress={toggleExpand}
        activeOpacity={0.8}
      >
        <View style={styles.headerLeft}>
          <View style={[styles.filterIconWrap, activeFiltersCount > 0 && styles.filterIconWrapActive]}>
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color={activeFiltersCount > 0 ? 'white' : PURPLE}
            />
          </View>
          <Text style={styles.dropdownTitle}>Filtrar reseñas</Text>

          {activeFiltersCount > 0 && (
            <View style={styles.activeCountBadge}>
              <Text style={styles.activeCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </View>

        <View style={styles.headerRight}>
          {activeFiltersCount > 0 && (
            <TouchableOpacity
              onPress={handleResetFilters}
              style={styles.resetBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialCommunityIcons name="refresh" size={13} color={PURPLE} />
              <Text style={styles.resetBtnText}>Limpiar</Text>
            </TouchableOpacity>
          )}

          <MaterialCommunityIcons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={22}
            color="#666"
            style={{ marginLeft: 4 }}
          />
        </View>
      </TouchableOpacity>

      {/* Menú Desplegable con las Opciones */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.divider} />

          {/* Filtro por Servicio (si aplica) */}
          {services && services.length > 0 && onSelectServiceId && (
            <View style={styles.filterGroup}>
              <Text style={styles.groupLabel}>Servicio</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollRow}
              >
                <TouchableOpacity
                  style={[styles.chip, !selectedServiceId && styles.chipActive]}
                  onPress={() => onSelectServiceId(null)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.chipText, !selectedServiceId && styles.chipTextActive]}>
                    Todos
                  </Text>
                </TouchableOpacity>

                {services.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    style={[styles.chip, selectedServiceId === svc.id && styles.chipActive]}
                    onPress={() => onSelectServiceId(svc.id)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.chipText, selectedServiceId === svc.id && styles.chipTextActive]}>
                      {svc.name} {svc.rating ? `★ ${svc.rating}` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Filtro por Calificación (Estrellas) */}
          <View style={styles.filterGroup}>
            <Text style={styles.groupLabel}>Calificación</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollRow}
            >
              {STAR_OPTIONS.map((opt) => {
                const isActive = selectedStars === opt.value;
                return (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => onSelectStars(opt.value)}
                    activeOpacity={0.75}
                  >
                    {opt.value !== null && (
                      <MaterialCommunityIcons
                        name="star"
                        size={13}
                        color={isActive ? STAR_COLOR : '#FFB800'}
                        style={{ marginRight: 3 }}
                      />
                    )}
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Filtro por Estado de Respuesta */}
          <View style={[styles.filterGroup, { marginBottom: 4 }]}>
            <Text style={styles.groupLabel}>Estado de respuesta</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollRow}
            >
              {REPLY_OPTIONS.map((opt) => {
                const isActive = selectedReplyStatus === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[styles.chip, isActive && styles.chipActive]}
                    onPress={() => onSelectReplyStatus(opt.value)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={opt.icon as any}
                      size={13}
                      color={isActive ? 'white' : PURPLE}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#ECECF1',
    overflow: 'hidden',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.04)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      },
    }),
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterIconWrapActive: {
    backgroundColor: PURPLE,
  },
  dropdownTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222',
  },
  activeCountBadge: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeCountText: {
    color: 'white',
    fontSize: 11,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  resetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE,
  },
  expandedContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginBottom: 12,
  },
  filterGroup: {
    marginBottom: 10,
  },
  groupLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
  },
  scrollRow: {
    flexDirection: 'row',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EAEAEF',
  },
  chipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#444',
  },
  chipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
});
