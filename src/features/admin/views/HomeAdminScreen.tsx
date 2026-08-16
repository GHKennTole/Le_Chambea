import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  LayoutAnimation,
  UIManager,
  RefreshControl,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../../services/supabase";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useAdminController } from "../controllers/useAdminController";
import { AdminUser, AdminReport, AdminWorkflowModule } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

// Modals
import AdminUserDirectoryModal from "../components/AdminUserDirectoryModal";
import AdminReviewsModal from "../components/AdminReviewsModal";
import AdminPortfoliosModal from "../components/AdminPortfoliosModal";
import AdminAiMetricsModal from "../components/AdminAiMetricsModal";
import AdminJobsHistoryModal from "../components/AdminJobsHistoryModal";
import AdminDbStatusModal from "../components/AdminDbStatusModal";
import AdminReportsModal from "../components/AdminReportsModal";
import AdminDirectNoticeModal from "../components/AdminDirectNoticeModal";
import AdminBroadcastModal from "../components/AdminBroadcastModal";

// Habilitar animaciones en Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

type ModalType =
  | "user_directory"
  | "reviews_moderation"
  | "portfolios_supervision"
  | "ai_metrics"
  | "jobs_history"
  | "db_status"
  | "reports_inbox"
  | "direct_notice"
  | "broadcast_notice"
  | null;

export default function HomeAdminScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isLargeScreen } = useResponsive();

  // Controller hook
  const {
    loading,
    refreshing,
    actionLoading,
    adminProfile,
    metrics,
    users,
    reviews,
    reports,
    jobs,
    services,
    tableDiagnostics,
    onRefresh,
    toggleUserSuspension,
    deleteUser,
    deleteReview,
    toggleServiceActive,
    deleteService,
    toggleReportResolved,
    deleteReport,
    sendDirectNotice,
    sendBroadcastNotice,
  } = useAdminController();

  // Accordion state
  const [expandedModule, setExpandedModule] = useState<string | null>("gestionar_usuarios");

  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [noticeTargetUser, setNoticeTargetUser] = useState<AdminUser | null>(null);
  const [noticeReportContext, setNoticeReportContext] = useState<AdminReport | null>(null);

  // Cross-Navigation User States
  const [selectedUserForDirectory, setSelectedUserForDirectory] = useState<AdminUser | null>(null);
  const [selectedUserForReviews, setSelectedUserForReviews] = useState<AdminUser | null>(null);
  const [selectedUserForServices, setSelectedUserForServices] = useState<AdminUser | null>(null);

  const jumpToReviewsFromUser = (user: AdminUser) => {
    setSelectedUserForReviews(user);
    setActiveModal("reviews_moderation");
  };

  const jumpToServicesFromUser = (user: AdminUser) => {
    setSelectedUserForServices(user);
    setActiveModal("portfolios_supervision");
  };

  const jumpToDirectoryFromUser = (user: AdminUser) => {
    setSelectedUserForDirectory(user);
    setActiveModal("user_directory");
  };

  const toggleModule = (id: string) => {
    // Si es gestionar_usuarios, abrir directamente el directorio como solicitó el usuario
    if (id === "gestionar_usuarios") {
      setSelectedUserForDirectory(null);
      setActiveModal("user_directory");
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedModule(expandedModule === id ? null : id);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Error", "No se pudo cerrar la sesión: " + error.message);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (confirm("¿Estás seguro de que deseas cerrar la sesión del administrador?")) {
        handleLogout();
      }
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que deseas cerrar la sesión del administrador?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Cerrar Sesión", style: "destructive", onPress: handleLogout },
        ]
      );
    }
  };

  // Abre el modal de aviso directo preseleccionando el usuario
  const openDirectNoticeWithUser = (user: AdminUser, reportCtx?: AdminReport) => {
    setNoticeTargetUser(user);
    setNoticeReportContext(reportCtx || null);
    setActiveModal("direct_notice");
  };

  // KPIs dinámicos reales
  const dynamicMetrics = [
    {
      id: "users",
      value: metrics.totalUsers.toString(),
      label: "Usuarios Totales",
      icon: "account-group" as const,
      color: PURPLE,
      bgColor: LIGHT_PURPLE,
    },
    {
      id: "professionals",
      value: metrics.totalProfessionals.toString(),
      label: "Profesionales",
      icon: "card-account-details-outline" as const,
      color: "#007AFF",
      bgColor: "#EBF3FF",
    },
    {
      id: "jobs",
      value: metrics.totalJobs.toString(),
      label: "Trabajos Activos",
      icon: "briefcase-check" as const,
      color: "#9B51E0",
      bgColor: "#F5EBFF",
    },
    {
      id: "reports_pending",
      value: metrics.pendingReports.toString(),
      label: "Reportes Pendientes",
      icon: "alert-decagram" as const,
      color: "#E74C3C",
      bgColor: "#FDEDEC",
    },
    {
      id: "reviews",
      value: `${metrics.totalReviews} (${metrics.averageRating}★)`,
      label: "Reseñas (Promedio)",
      icon: "star-circle-outline" as const,
      color: "#FF9500",
      bgColor: "#FFF9E6",
    },
    {
      id: "ai_queries",
      value: metrics.aiQueriesCount.toString(),
      label: "Consultas de IA",
      icon: "robot-outline" as const,
      color: "#8E44AD",
      bgColor: "#F4ECF7",
    },
  ];

  // Módulos de Flujos de Trabajo
  const workflowModules: AdminWorkflowModule[] = [
    {
      id: "gestionar_usuarios",
      title: "Gestionar Usuarios",
      description: "Directorio interactivo de cuentas, perfiles, suspensiones y bajas.",
      icon: "account-cog",
      color: PURPLE,
      bgColor: LIGHT_PURPLE,
      badges: [`${users.length} Usuarios Registrados`, "Abrir Directorio"],
      subActions: [
        {
          id: "user_directory",
          label: "Abrir Directorio General de Usuarios",
          icon: "account-box-multiple-outline",
          badgeCount: users.length,
        },
      ],
    },
    {
      id: "gestionar_contenido",
      title: "Gestionar Contenido",
      description: "Moderar reseñas (clientes y profesionales) y servicios del catálogo.",
      icon: "comment-text-multiple-outline",
      color: "#FF9500",
      bgColor: "#FFF5E6",
      badges: [`${reviews.length} Reseñas`, `${services.length} Servicios`],
      subActions: [
        {
          id: "reviews_moderation",
          label: "Moderar Reseñas y Calificaciones",
          icon: "star-outline",
          badgeCount: reviews.length,
        },
        {
          id: "portfolios_supervision",
          label: "Servicios de Profesionales (Suspender o Eliminar)",
          icon: "briefcase-outline",
          badgeCount: services.length,
        },
      ],
    },
    {
      id: "apartado_ia",
      title: "Apartado de IA",
      description: "Auditoría conversacional de Sula AI y métricas del modelo.",
      icon: "brain",
      color: "#8E44AD",
      bgColor: "#F4ECF7",
      badges: ["Auditoría Dev", "Métricas"],
      subActions: [
        {
          id: "ai_audit",
          label: "Modo Auditoría / Pruebas Sula AI",
          icon: "robot-happy-outline",
        },
        {
          id: "ai_metrics",
          label: "Métricas y Consultas de IA",
          icon: "chart-bubble",
          badgeCount: metrics.aiQueriesCount,
        },
      ],
    },
    {
      id: "actividad_sistema",
      title: "Actividad del Sistema",
      description: "Historial de solicitudes de trabajo y diagnóstico de la BD.",
      icon: "chart-timeline-variant",
      color: "#2ECC71",
      bgColor: "#EAF9EC",
      badges: [`${jobs.length} Trabajos`, "Salud BD"],
      subActions: [
        {
          id: "jobs_history",
          label: "Historial Global de Trabajos",
          icon: "briefcase-clock-outline",
          badgeCount: jobs.length,
        },
        {
          id: "db_status",
          label: "Diagnóstico y Estado de la BD",
          icon: "database-check-outline",
        },
      ],
    },
    {
      id: "notificaciones_admin",
      title: "Notificaciones Administrativas",
      description: "Bandeja de denuncias de usuarios y comunicados oficiales masivos.",
      icon: "bell-ring-outline",
      color: "#E74C3C",
      bgColor: "#FDEDEC",
      badges: [
        metrics.pendingReports > 0 ? `${metrics.pendingReports} Pendientes` : "Al día",
        "Comunicado Global",
      ],
      subActions: [
        {
          id: "reports_inbox",
          label: "Bandeja de Reportes de Usuarios",
          icon: "alert-octagon-outline",
          badgeCount: metrics.pendingReports,
        },
        {
          id: "broadcast_notice",
          label: "Comunicado Global (Broadcast Masivo)",
          icon: "bullhorn-outline",
        },
      ],
    },
  ];

  const handleSubActionPress = (actionId: string) => {
    switch (actionId) {
      case "user_directory":
        setActiveModal("user_directory");
        break;
      case "reviews_moderation":
        setActiveModal("reviews_moderation");
        break;
      case "portfolios_supervision":
        setActiveModal("portfolios_supervision");
        break;
      case "ai_audit":
        navigation.navigate("AdminAiAudit");
        break;
      case "ai_metrics":
        setActiveModal("ai_metrics");
        break;
      case "jobs_history":
        setActiveModal("jobs_history");
        break;
      case "db_status":
        setActiveModal("db_status");
        break;
      case "reports_inbox":
        setActiveModal("reports_inbox");
        break;
      case "broadcast_notice":
        setActiveModal("broadcast_notice");
        break;
      default:
        break;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[PURPLE]}
            tintColor={PURPLE}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandTitle}>LE CHAMBEA</Text>
            <View style={styles.badgeAdminContainer}>
              <Text style={styles.badgeAdminText}>PANEL ADMINISTRADOR</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              activeOpacity={0.7}
              disabled={refreshing}
            >
              <MaterialCommunityIcons name="refresh" size={22} color={PURPLE} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={confirmLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeLeft}>
            <Text style={styles.welcomeGreeting}>
              Bienvenido,{" "}
              <Text style={styles.adminNameHighlight}>
                {adminProfile?.nombre || "Administrador"}
              </Text>
            </Text>
            <Text style={styles.welcomeEmail}>{adminProfile?.correo}</Text>
          </View>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>En Tiempo Real</Text>
          </View>
        </View>

        {/* Section title for KPIs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métricas de Rendimiento</Text>
          <Text style={styles.sectionSubtitle}>Indicadores operativos en vivo</Text>
        </View>

        {/* Horizontal scroll for KPI cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.metricsScroll}
          contentContainerStyle={styles.metricsScrollContent}
        >
          {dynamicMetrics.map((metric) => (
            <View key={metric.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: metric.bgColor }]}>
                <MaterialCommunityIcons name={metric.icon} size={24} color={metric.color} />
              </View>
              <Text style={styles.statNumber}>{metric.value}</Text>
              <Text style={styles.statLabel}>{metric.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Action modules section */}
        <View style={[styles.sectionHeader, { marginTop: 16 }]}>
          <Text style={styles.sectionTitle}>Flujos de Trabajo</Text>
          <Text style={styles.sectionSubtitle}>
            Toca un módulo para abrir sus herramientas administrativas
          </Text>
        </View>

        <View style={styles.modulesContainer}>
          {workflowModules.map((module) => {
            const isExpanded = expandedModule === module.id;
            const isSingleDirectAction = module.id === "gestionar_usuarios";

            return (
              <View key={module.id} style={styles.moduleWrapper}>
                <TouchableOpacity
                  style={[styles.moduleCard, isExpanded && !isSingleDirectAction && styles.moduleCardExpanded]}
                  onPress={() => toggleModule(module.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.moduleHeaderRow}>
                    <View style={[styles.moduleIconBox, { backgroundColor: module.bgColor }]}>
                      <MaterialCommunityIcons name={module.icon} size={28} color={module.color} />
                    </View>
                    <View style={styles.moduleHeaderText}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDesc} numberOfLines={2}>
                        {module.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isSingleDirectAction ? "arrow-right-circle" : isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color={isSingleDirectAction ? module.color : "#999"}
                    />
                  </View>

                  {/* Badge Row */}
                  <View style={styles.badgeRow}>
                    {module.badges.map((badge, idx) => (
                      <View key={idx} style={[styles.badgePill, { backgroundColor: module.bgColor }]}>
                        <Text style={[styles.badgeText, { color: module.color }]}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>

                {/* Sub-actions collapsible menu */}
                {isExpanded && !isSingleDirectAction && (
                  <View style={styles.subActionsContainer}>
                    {module.subActions.map((sub) => (
                      <TouchableOpacity
                        key={sub.id}
                        style={styles.subActionItem}
                        activeOpacity={0.7}
                        onPress={() => handleSubActionPress(sub.id)}
                      >
                        <View style={[styles.subActionIconWrap, { backgroundColor: module.bgColor }]}>
                          <MaterialCommunityIcons name={sub.icon} size={20} color={module.color} />
                        </View>
                        <Text style={styles.subActionLabel}>{sub.label}</Text>
                        {sub.badgeCount !== undefined && sub.badgeCount > 0 && (
                          <View style={[styles.subActionBadge, { backgroundColor: module.color }]}>
                            <Text style={styles.subActionBadgeText}>{sub.badgeCount}</Text>
                          </View>
                        )}
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#BBB" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Spacer */}
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Directorio de Usuarios (Directo desde Gestionar Usuarios) */}
      <AdminUserDirectoryModal
        visible={activeModal === "user_directory"}
        onClose={() => {
          setActiveModal(null);
          setSelectedUserForDirectory(null);
        }}
        users={users}
        initialSelectedUser={selectedUserForDirectory}
        onToggleSuspend={toggleUserSuspension}
        onDeleteUser={deleteUser}
        onDirectNotice={openDirectNoticeWithUser}
        onGoToReviews={jumpToReviewsFromUser}
        onGoToServices={jumpToServicesFromUser}
        actionLoading={actionLoading}
      />

      {/* 2. Moderar Reseñas y Opiniones */}
      <AdminReviewsModal
        visible={activeModal === "reviews_moderation"}
        onClose={() => {
          setActiveModal(null);
          setSelectedUserForReviews(null);
        }}
        reviews={reviews}
        users={users}
        initialSelectedUser={selectedUserForReviews}
        onDeleteReview={deleteReview}
        onGoToUserDirectory={jumpToDirectoryFromUser}
        onGoToServices={jumpToServicesFromUser}
      />

      {/* 3. Servicios de Profesionales (Suspender o Eliminar) */}
      <AdminPortfoliosModal
        visible={activeModal === "portfolios_supervision"}
        onClose={() => {
          setActiveModal(null);
          setSelectedUserForServices(null);
        }}
        services={services}
        users={users}
        initialSelectedUser={selectedUserForServices}
        onToggleActive={toggleServiceActive}
        onDeleteService={deleteService}
        onGoToUserDirectory={jumpToDirectoryFromUser}
        onGoToReviews={jumpToReviewsFromUser}
      />

      {/* 4. Métricas de Sula AI */}
      <AdminAiMetricsModal
        visible={activeModal === "ai_metrics"}
        onClose={() => setActiveModal(null)}
        metrics={metrics}
        onLaunchAuditMode={() => navigation.navigate("AdminAiAudit")}
      />

      {/* 5. Historial de Trabajos */}
      <AdminJobsHistoryModal
        visible={activeModal === "jobs_history"}
        onClose={() => setActiveModal(null)}
        jobs={jobs}
      />

      {/* 6. Diagnóstico de Base de Datos */}
      <AdminDbStatusModal
        visible={activeModal === "db_status"}
        onClose={() => setActiveModal(null)}
        diagnostics={tableDiagnostics}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />

      {/* 7. Bandeja de Reportes */}
      <AdminReportsModal
        visible={activeModal === "reports_inbox"}
        onClose={() => setActiveModal(null)}
        reports={reports}
        users={users}
        onToggleResolved={toggleReportResolved}
        onDeleteReport={deleteReport}
        onDirectNotice={openDirectNoticeWithUser}
      />

      {/* 8. Notificación Directa a Usuario (In-app notification) */}
      <AdminDirectNoticeModal
        visible={activeModal === "direct_notice"}
        onClose={() => setActiveModal(null)}
        users={users}
        preselectedUser={noticeTargetUser}
        reportContext={noticeReportContext}
        onSendNotice={sendDirectNotice}
        actionLoading={actionLoading}
      />

      {/* 9. Comunicado Global Masivo (In-app broadcast) */}
      <AdminBroadcastModal
        visible={activeModal === "broadcast_notice"}
        onClose={() => setActiveModal(null)}
        usersCount={users.length}
        onSendBroadcast={sendBroadcastNotice}
        actionLoading={actionLoading}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F3",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#222",
    letterSpacing: 0.5,
  },
  badgeAdminContainer: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeAdminText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  refreshButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },
  logoutButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  welcomeLeft: {
    flex: 1,
  },
  welcomeGreeting: {
    fontSize: 14,
    color: "#444",
  },
  adminNameHighlight: {
    fontWeight: "bold",
    color: PURPLE,
  },
  welcomeEmail: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2ECC71",
  },
  liveText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#27AE60",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  metricsScroll: {
    marginTop: 6,
  },
  metricsScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 4,
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    minWidth: 130,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "flex-start",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  statIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#222",
  },
  statLabel: {
    fontSize: 11,
    color: "#777",
    marginTop: 2,
  },
  modulesContainer: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 6,
  },
  moduleWrapper: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  moduleCard: {
    padding: 16,
  },
  moduleCardExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  moduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  moduleIconBox: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  moduleHeaderText: {
    flex: 1,
    marginRight: 8,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  moduleDesc: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
    lineHeight: 16,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  subActionsContainer: {
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  subActionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  subActionLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  subActionBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginRight: 8,
  },
  subActionBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
