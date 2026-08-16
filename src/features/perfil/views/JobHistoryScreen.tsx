import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useJobHistoryController, JobStatus, JobItem } from '../controllers/useJobHistoryController';
import type { RootStackParamList } from '../../../core/navigation/types';
import { useResponsive } from '../../../shared/hooks/useResponsive';

const PURPLE = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';
const PURPLE_ACCENT = '#5A2D82';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS: Array<{ key: JobStatus; label: string; icon: string }> = [
  { key: 'all', label: 'Todos', icon: 'format-list-bulleted' },
  { key: 'completed', label: 'Completados', icon: 'check-circle-outline' },
  { key: 'accepted', label: 'En curso', icon: 'progress-clock' },
  { key: 'pending', label: 'Pendientes', icon: 'clock-outline' },
  { key: 'cancelled', label: 'Cancelados', icon: 'close-circle-outline' },
];

export default function JobHistoryScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const vm = useJobHistoryController();
  const { isLargeScreen } = useResponsive();

  useFocusEffect(
    useCallback(() => {
      vm.fetchJobs();
    }, [vm.fetchJobs])
  );

  const getStatusBadge = (estado: string) => {
    switch (estado) {
      case 'completed':
        return {
          label: 'Completado',
          bgColor: '#DCFCE7',
          textColor: '#16A34A',
          icon: 'check-circle',
        };
      case 'accepted':
        return {
          label: 'En curso',
          bgColor: '#DBEAFE',
          textColor: '#2563EB',
          icon: 'progress-wrench',
        };
      case 'pending':
        return {
          label: 'Solicitud pendiente',
          bgColor: '#FEF3C7',
          textColor: '#D97706',
          icon: 'clock-alert-outline',
        };
      case 'rejected':
      case 'cancelled':
        return {
          label: 'Cancelado',
          bgColor: '#FEE2E2',
          textColor: '#DC2626',
          icon: 'close-circle',
        };
      default:
        return {
          label: estado,
          bgColor: '#F3F4F6',
          textColor: '#6B7280',
          icon: 'help-circle-outline',
        };
    }
  };

  const handleOpenChat = (item: JobItem) => {
    if (item.chat_id) {
      navigation.navigate('Chat', {
        chatId: item.chat_id,
        otherUserId: item.cliente_id,
      });
    }
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
            <View style={styles.headerTitleRow}>
              <MaterialCommunityIcons name="clipboard-text-clock" size={26} color="white" />
              <Text style={styles.headerTitle}>Historial de Trabajos</Text>
            </View>
            <Text style={styles.headerSubtitle}>
              Registro de contrataciones, servicios en curso y solicitudes recibidas
            </Text>

            {/* Tarjeta Resumen de Métricas */}
            <View style={styles.metricsCard}>
              <View style={styles.metricItem}>
                <Text style={styles.metricNumber}>{vm.totalCompleted}</Text>
                <Text style={styles.metricLabel}>Completados</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: '#2563EB' }]}>{vm.totalInProgress}</Text>
                <Text style={styles.metricLabel}>En Curso</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={[styles.metricNumber, { color: '#D97706' }]}>{vm.totalPending}</Text>
                <Text style={styles.metricLabel}>Pendientes</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Filtros por Estado */}
          <View style={styles.filtersSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {STATUS_FILTERS.map((f) => {
                const isActive = vm.selectedStatus === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, isActive && styles.filterChipActive]}
                    onPress={() => vm.setSelectedStatus(f.key)}
                    activeOpacity={0.75}
                  >
                    <MaterialCommunityIcons
                      name={f.icon as any}
                      size={14}
                      color={isActive ? 'white' : PURPLE}
                      style={{ marginRight: 4 }}
                    />
                    <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                      {f.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Filtro por Servicio si el profesional tiene más de uno */}
            {vm.services.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filterScroll, { marginTop: 8 }]}
              >
                <TouchableOpacity
                  style={[styles.serviceChip, !vm.selectedServiceId && styles.serviceChipActive]}
                  onPress={() => vm.setSelectedServiceId(null)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.serviceChipText,
                      !vm.selectedServiceId && styles.serviceChipTextActive,
                    ]}
                  >
                    Todos los servicios
                  </Text>
                </TouchableOpacity>

                {vm.services.map((svc) => (
                  <TouchableOpacity
                    key={svc.id}
                    style={[
                      styles.serviceChip,
                      vm.selectedServiceId === svc.id && styles.serviceChipActive,
                    ]}
                    onPress={() => vm.setSelectedServiceId(svc.id)}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.serviceChipText,
                        vm.selectedServiceId === svc.id && styles.serviceChipTextActive,
                      ]}
                    >
                      {svc.profesion}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Lista de Trabajos */}
          {vm.loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PURPLE} />
            </View>
          ) : vm.allJobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="clipboard-text-off-outline" size={48} color="#aaa" />
              <Text style={styles.emptyTitle}>Sin historial de trabajos</Text>
              <Text style={styles.emptyText}>
                Cuando los clientes soliciten o contraten tus servicios profesionales, aparecerán listados aquí.
              </Text>
            </View>
          ) : vm.jobs.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="filter-remove-outline" size={42} color="#aaa" />
              <Text style={styles.emptyTitle}>Sin trabajos con este filtro</Text>
              <Text style={styles.emptyText}>
                No hay registros que coincidan con el estado o servicio seleccionado.
              </Text>
            </View>
          ) : (
            <View style={styles.jobsList}>
              {vm.jobs.map((item) => {
                const clientName = item.usuarios
                  ? `${item.usuarios.nombre} ${item.usuarios.apellidos}`.trim()
                  : 'Cliente';
                const serviceName =
                  item.perfiles_profesionales?.profesion ||
                  item.perfiles_profesionales?.categoria ||
                  'Servicio';
                const dateStr = item.fecha_creacion
                  ? new Date(item.fecha_creacion).toLocaleDateString()
                  : '';
                const badge = getStatusBadge(item.estado);

                return (
                  <View key={item.id} style={styles.jobCard}>
                    {/* Header de la tarjeta */}
                    <View style={styles.cardHeader}>
                      {item.usuarios?.foto_perfil ? (
                        <Image source={{ uri: item.usuarios.foto_perfil }} style={styles.avatar} />
                      ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder]}>
                          <MaterialCommunityIcons name="account" size={24} color="#999" />
                        </View>
                      )}

                      <View style={styles.clientInfo}>
                        <Text style={styles.clientName} numberOfLines={1}>
                          {clientName}
                        </Text>
                        {item.usuarios?.ciudad ? (
                          <View style={styles.locationRow}>
                            <MaterialCommunityIcons name="map-marker-outline" size={13} color="#777" />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {item.usuarios.ciudad}
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      {/* Estado */}
                      <View style={[styles.statusBadge, { backgroundColor: badge.bgColor }]}>
                        <MaterialCommunityIcons
                          name={badge.icon as any}
                          size={13}
                          color={badge.textColor}
                        />
                        <Text style={[styles.statusBadgeText, { color: badge.textColor }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    {/* Detalle del servicio y fecha */}
                    <View style={styles.jobDetailsRow}>
                      <View style={styles.serviceBadge}>
                        <MaterialCommunityIcons name="briefcase-outline" size={13} color={PURPLE} />
                        <Text style={styles.serviceBadgeText}>{serviceName}</Text>
                      </View>

                      <View style={styles.dateRow}>
                        <MaterialCommunityIcons name="calendar-outline" size={13} color="#888" />
                        <Text style={styles.dateText}>{dateStr}</Text>
                      </View>
                    </View>

                    {/* Botones de acción */}
                    <View style={styles.cardActionsRow}>
                      {item.chat_id ? (
                        <TouchableOpacity
                          style={styles.chatActionBtn}
                          onPress={() => handleOpenChat(item)}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="chat-outline" size={16} color={PURPLE} />
                          <Text style={styles.chatActionBtnText}>Ver Conversación</Text>
                        </TouchableOpacity>
                      ) : null}

                      {/* Acciones rápidas de cambio de estado */}
                      {item.estado === 'pending' && (
                        <TouchableOpacity
                          style={[styles.statusActionBtn, styles.btnAccept]}
                          onPress={() => vm.updateJobStatus(item.id, 'accepted')}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="check" size={15} color="white" />
                          <Text style={styles.btnAcceptText}>Aceptar</Text>
                        </TouchableOpacity>
                      )}

                      {item.estado === 'accepted' && (
                        <TouchableOpacity
                          style={[styles.statusActionBtn, styles.btnComplete]}
                          onPress={() => vm.updateJobStatus(item.id, 'completed')}
                          activeOpacity={0.8}
                        >
                          <MaterialCommunityIcons name="check-all" size={15} color="white" />
                          <Text style={styles.btnCompleteText}>Completar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          <View style={{ height: insets.bottom + 60 }} />
        </View>
      </ScrollView>

      <FloatingBackButton />
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  metricsCard: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    justifyContent: 'space-around',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
    }),
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  metricNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16A34A',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#ECECF1',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filterScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECECF1',
  },
  filterChipActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  filterChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#555',
  },
  filterChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  serviceChip: {
    backgroundColor: '#EFEFF4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  serviceChipActive: {
    backgroundColor: PURPLE,
  },
  serviceChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#555',
  },
  serviceChipTextActive: {
    color: 'white',
    fontWeight: '700',
  },
  loadingContainer: {
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
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 300,
  },
  jobsList: {
    gap: 12,
  },
  jobCard: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.04)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
    }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
  },
  avatarPlaceholder: {
    backgroundColor: '#F0F0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11.5,
    color: '#777',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F0F0F5',
    marginVertical: 10,
  },
  jobDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  serviceBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11.5,
    color: '#888',
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  chatActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 6,
  },
  chatActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: PURPLE,
  },
  statusActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 5,
  },
  btnAccept: {
    backgroundColor: '#2563EB',
  },
  btnAcceptText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
  btnComplete: {
    backgroundColor: '#16A34A',
  },
  btnCompleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'white',
  },
});
