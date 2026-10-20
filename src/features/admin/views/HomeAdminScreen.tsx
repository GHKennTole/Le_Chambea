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
  RefreshControl,
  Image,
  Modal,
  Pressable,
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
import AdminReviewsModal from "../components/AdminReviewsModal";
import AdminPortfoliosModal from "../components/AdminPortfoliosModal";
import AdminAiMetricsModal from "../components/AdminAiMetricsModal";
import AdminJobsHistoryModal from "../components/AdminJobsHistoryModal";
import AdminReportsModal from "../components/AdminReportsModal";
import AdminDirectNoticeModal from "../components/AdminDirectNoticeModal";
import AdminBroadcastModal from "../components/AdminBroadcastModal";
import SimpleActionModal from "../../../shared/components/SimpleActionModal";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

type ModalType =
  | "user_directory"
  | "reviews_moderation"
  | "portfolios_supervision"
  | "ai_metrics"
  | "jobs_history"
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
    metrics,
    users,
    reviews,
    reports,
    jobs,
    services,
    aiLogs,
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
  // En versión web PC, si se abre una de las funciones con varias opciones, se abren ambas a la par
  const [multiOptionsExpanded, setMultiOptionsExpanded] = useState(false);
  // Para versión móvil (se expande/colapsa individualmente)
  const [expandedMobileModule, setExpandedMobileModule] = useState<string | null>(null);

  // Guard de seguridad: si no es admin, redirigir a Home de inmediato
  React.useEffect(() => {
    async function checkRole() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigation.reset({ index: 0, routes: [{ name: "Welcome" as any }] });
        return;
      }
      const { data: profile } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", user.id)
        .maybeSingle();

      const role = profile?.rol?.toLowerCase();
      if (role !== "admin" && role !== "administrador") {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    }
    checkRole();
  }, [navigation]);

  // Modal states
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [noticeTargetUser, setNoticeTargetUser] = useState<AdminUser | null>(null);
  const [noticeReportContext, setNoticeReportContext] = useState<AdminReport | null>(null);

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
    setActiveModal(null);
    navigation.navigate("AdminUserDetail", { user });
  };

  const toggleModule = (id: string) => {
    // Si es gestionar_usuarios, abrir directamente el screen de Control de Usuarios
    if (id === "gestionar_usuarios") {
      navigation.navigate("AdminUserDirectory", { users });
      return;
    }
    // Si es historial_trabajos, abrir directamente el historial de trabajos
    if (id === "historial_trabajos") {
      setActiveModal("jobs_history");
      return;
    }
    // Si es notificaciones_admin, abrir directamente la bandeja de reportes
    if (id === "notificaciones_admin") {
      setActiveModal("reports_inbox");
      return;
    }
    // Si es comunicado_global, abrir directamente el modal de comunicado
    if (id === "comunicado_global") {
      setActiveModal("broadcast_notice");
      return;
    }
    // Para funciones con varias opciones ("gestionar_contenido" y "apartado_ia")
    if (isLargeScreen) {
      // En la versión web de PC van a la par: si se abre una se abren ambas, y al cerrar se cierran ambas
      setMultiOptionsExpanded((prev) => !prev);
    } else {
      // En móvil se maneja individualmente
      setExpandedMobileModule((prev) => (prev === id ? null : id));
    }
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
    setShowLogoutModal(true);
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
      id: "active_services",
      value: metrics.activeServices.toString(),
      label: "Servicios Activos",
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
      value: metrics.totalReviews.toString(),
      label: "Total de Reseñas",
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
  // En versión web PC (2 columnas): Fila 1 = Acciones Directas, Fila 2 = Funciones con Varias Opciones a la par, Fila 3 = Acciones Directas
  const workflowModules: AdminWorkflowModule[] = [
    {
      id: "gestionar_usuarios",
      title: "Control de Usuarios",
      description: "Control integral de cuentas, perfiles, suspensiones y bajas.",
      icon: "account-cog",
      color: PURPLE,
      bgColor: LIGHT_PURPLE,
      subActions: [
        {
          id: "user_directory",
          label: "Control de Usuarios",
          icon: "account-box-multiple-outline",
        },
      ],
    },
    {
      id: "historial_trabajos",
      title: "Historial de Servicios",
      description: "Supervisión, estado y trazabilidad global de todas las solicitudes de servicios.",
      icon: "briefcase-clock-outline",
      color: "#2ECC71",
      bgColor: "#EAF9EC",
      subActions: [
        {
          id: "jobs_history",
          label: "Historial de Servicios",
          icon: "briefcase-clock-outline",
        },
      ],
    },
    {
      id: "gestionar_contenido",
      title: "Gestionar Contenido",
      description: "Moderar reseñas y servicios ofrecidos dentro de la plataforma.",
      icon: "comment-text-multiple-outline",
      color: "#FF9500",
      bgColor: "#FFF5E6",
      subActions: [
        {
          id: "reviews_moderation",
          label: "Reseña y calificaciones",
          icon: "star-outline",
        },
        {
          id: "portfolios_supervision",
          label: "Servicios de profesionales",
          icon: "briefcase-outline",
        },
      ],
    },
    {
      id: "apartado_ia",
      title: "Manejo de Asistente Virtual",
      description: "Auditoría conversacional de Sula AI y métricas del modelo.",
      icon: "brain",
      color: "#8E44AD",
      bgColor: "#F4ECF7",
      subActions: [
        {
          id: "ai_audit",
          label: "Auditoría de Asistente Virtual",
          icon: "robot-happy-outline",
        },
        {
          id: "ai_metrics",
          label: "Métricas del Asistente Virtual",
          icon: "chart-bubble",
        },
      ],
    },
    {
      id: "notificaciones_admin",
      title: "Solicitudes de Reporte",
      description: "Bandeja de denuncias, reportes e incidencias de los usuarios.",
      icon: "bell-ring-outline",
      color: "#E74C3C",
      bgColor: "#FDEDEC",
      subActions: [
        {
          id: "reports_inbox",
          label: "Solicitudes de Reporte",
          icon: "alert-octagon-outline",
        },
      ],
    },
    {
      id: "comunicado_global",
      title: "Comunicado Global",
      description: "Emisión de anuncios y comunicados oficiales masivos a toda la plataforma.",
      icon: "bullhorn-outline",
      color: "#0284C7",
      bgColor: "#E0F2FE",
      subActions: [
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
        navigation.navigate("AdminUserDirectory", { users });
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
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
        {/* Contenedor Principal: en pantallas grandes se alinea y restringe al contenido */}
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
          {/* Header Morado Oficial de Marca LE CHAMBEA */}
          <View
            style={[
              styles.purpleHeaderWrapper,
              isLargeScreen && styles.purpleHeaderWrapperDesktop,
            ]}
          >
            {/* Fila Superior con Marca, Badge y Acciones */}
            <View style={styles.headerTopRow}>
              <View style={styles.brandContainer}>
                <View style={styles.logoCircle}>
                  <Image
                    source={require("../../../assets/images/logo.png")}
                    style={styles.brandLogo}
                    resizeMode="contain"
                  />
                </View>
                <View style={styles.brandTextCol}>
                  <Text style={styles.appTitle}>LE CHAMBEA</Text>
                  <View style={styles.badgeAdminContainer}>
                    <Text style={styles.badgeAdminText}>PANEL ADMINISTRADOR</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerRight}>
                {!isLargeScreen ? (
                  <TouchableOpacity
                    style={styles.hamburgerBtn}
                    onPress={() => setMenuOpen((prev) => !prev)}
                    activeOpacity={0.7}
                    accessibilityLabel="Abrir menú"
                  >
                    <MaterialCommunityIcons name={menuOpen ? "close" : "menu"} size={24} color="white" />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.desktopActionsRow}>
                    {/* Botón Perfil */}
                    <TouchableOpacity
                      style={styles.desktopActionBtn}
                      onPress={() => navigation.navigate("Profile")}
                      activeOpacity={0.75}
                      accessibilityLabel="Ir al perfil"
                    >
                      <MaterialCommunityIcons name="account-outline" size={19} color="#FFFFFF" />
                      <Text style={styles.desktopActionText}>Perfil</Text>
                    </TouchableOpacity>

                    {/* Botón Actualizar */}
                    <TouchableOpacity
                      style={[styles.desktopActionBtn, refreshing && styles.desktopActionBtnDisabled]}
                      onPress={onRefresh}
                      disabled={refreshing}
                      activeOpacity={0.75}
                      accessibilityLabel="Actualizar datos"
                    >
                      <MaterialCommunityIcons name="refresh" size={19} color="#FFFFFF" />
                      <Text style={styles.desktopActionText}>
                        {refreshing ? "Sincronizando..." : "Actualizar"}
                      </Text>
                    </TouchableOpacity>

                    {/* Botón Salir */}
                    <TouchableOpacity
                      style={[styles.desktopActionBtn, styles.desktopActionBtnLogout]}
                      onPress={confirmLogout}
                      activeOpacity={0.75}
                      accessibilityLabel="Cerrar sesión"
                    >
                      <MaterialCommunityIcons name="logout" size={19} color="#FFFFFF" />
                      <Text style={[styles.desktopActionText, styles.desktopActionTextLogout]}>Salir</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Inner Container Centrado e Impecable para Pantallas Pequeñas y Grandes */}
          <View style={[styles.innerContainer, isLargeScreen && styles.innerContainerDesktop]}>
            {/* Sección de Resumen General */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Resumen General</Text>
              <Text style={styles.sectionSubtitle}>Métricas e indicadores en tiempo real de la plataforma</Text>
            </View>

          {/* Grid Responsivo de Métricas */}
          <View style={styles.metricsGrid}>
            {dynamicMetrics.map((metric) => (
              <View
                key={metric.id}
                style={[
                  styles.statCard,
                  isLargeScreen ? styles.statCardDesktop : styles.statCardMobile,
                ]}
              >
                <View style={[styles.statIconContainer, { backgroundColor: metric.bgColor }]}>
                  <MaterialCommunityIcons name={metric.icon} size={24} color={metric.color} />
                </View>
                <View style={styles.statTextWrap}>
                  <Text style={styles.statNumber}>{metric.value}</Text>
                  <Text style={styles.statLabel}>{metric.label}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Sección de Funciones Administrativas */}
          <View style={[styles.sectionHeader, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>Funciones Administrativas</Text>
            <Text style={styles.sectionSubtitle}>
              Herramientas de gestión, moderación y supervisión de la plataforma
            </Text>
          </View>

          {/* Grid Responsivo de Módulos */}
          <View style={styles.modulesGrid}>
            {workflowModules.map((module) => {
              const isSingleDirectAction =
                module.id === "gestionar_usuarios" ||
                module.id === "historial_trabajos" ||
                module.id === "notificaciones_admin" ||
                module.id === "comunicado_global";

              // En pantallas grandes (PC web), si se abre una con varias opciones se abren ambas a la par
              const isExpanded = isLargeScreen
                ? (module.id === "gestionar_contenido" || module.id === "apartado_ia")
                  ? multiOptionsExpanded
                  : false
                : expandedMobileModule === module.id;

              return (
                <View
                  key={module.id}
                  style={[
                    styles.moduleWrapper,
                    isLargeScreen ? styles.moduleWrapperDesktop : styles.moduleWrapperMobile,
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.moduleCard,
                      isExpanded && !isSingleDirectAction && styles.moduleCardExpanded,
                    ]}
                    onPress={() => toggleModule(module.id)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.moduleHeaderRow}>
                      <View style={[styles.moduleIconBox, { backgroundColor: module.bgColor }]}>
                        <MaterialCommunityIcons name={module.icon} size={26} color={module.color} />
                      </View>
                      <View style={styles.moduleHeaderText}>
                        <Text style={styles.moduleTitle}>{module.title}</Text>
                        <Text style={styles.moduleDesc} numberOfLines={2}>
                          {module.description}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={
                          isSingleDirectAction
                            ? "arrow-right-circle"
                            : isExpanded
                            ? "chevron-up"
                            : "chevron-down"
                        }
                        size={24}
                        color={isSingleDirectAction ? module.color : "#999"}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Sub-acciones colapsables */}
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
                            <MaterialCommunityIcons name={sub.icon} size={18} color={module.color} />
                          </View>
                          <Text style={styles.subActionLabel}>{sub.label}</Text>
                          <MaterialCommunityIcons name="arrow-right" size={16} color="#BBB" />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Espaciador final */}
          <View style={{ height: 40 }} />
        </View>
      </View>
      </ScrollView>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Menú Desplegable Instantáneo del Administrador (Sin <Modal>, solo en móviles) */}
      {menuOpen && !isLargeScreen && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 999 }]} pointerEvents="box-none">
          <Pressable style={styles.dropdownBackdrop} onPress={() => setMenuOpen(false)} />
          <View
            style={[
              styles.dropdownCard,
              { top: insets.top + (isLargeScreen ? 64 : 58) },
            ]}
          >
            {/* Opción 1: Perfil */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuOpen(false);
                navigation.navigate("Profile");
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: LIGHT_PURPLE }]}>
                <MaterialCommunityIcons name="account-outline" size={18} color={PURPLE} />
              </View>
              <Text style={styles.dropdownItemText}>Perfil</Text>
            </TouchableOpacity>

            {/* Opción 2: Actualizar */}
            <TouchableOpacity
              style={styles.dropdownItem}
              activeOpacity={0.7}
              onPress={() => {
                setMenuOpen(false);
                onRefresh();
              }}
              disabled={refreshing}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: LIGHT_PURPLE }]}>
                <MaterialCommunityIcons name="refresh" size={18} color={PURPLE} />
              </View>
              <View style={styles.dropdownTextCol}>
                <Text style={styles.dropdownItemText}>Actualizar</Text>
                {refreshing && <Text style={styles.dropdownItemSubText}>Sincronizando...</Text>}
              </View>
            </TouchableOpacity>

            <View style={styles.dropdownDivider} />

            {/* Opción 3: Cerrar Sesión */}
            <TouchableOpacity
              style={[styles.dropdownItem, styles.dropdownItemDanger]}
              activeOpacity={0.7}
              onPress={() => {
                setMenuOpen(false);
                confirmLogout();
              }}
            >
              <View style={[styles.dropdownIconCircle, { backgroundColor: "#FDEDEC" }]}>
                <MaterialCommunityIcons name="logout" size={18} color="#FF3B30" />
              </View>
              <Text style={[styles.dropdownItemText, styles.dropdownTextDanger]}>
                Cerrar sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

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
        aiLogs={aiLogs}
        onLaunchAuditMode={() => navigation.navigate("AdminAiAudit")}
      />

      {/* 5. Historial de Trabajos */}
      <AdminJobsHistoryModal
        visible={activeModal === "jobs_history"}
        onClose={() => setActiveModal(null)}
        jobs={jobs}
      />

      {/* 6. Bandeja de Reportes */}
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

      {/* 10. Modal de Confirmación de Cierre de Sesión */}
      <SimpleActionModal
        visible={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={async () => {
          await handleLogout();
          setShowLogoutModal(false);
        }}
        title="¿Cerrar sesión de Administrador?"
        subtitle="¿Seguro que deseas salir del panel de administración?"
        confirmText="Cerrar sesión"
        confirmType="danger"
        iconName="logout"
      />
    </View>
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

  // Contenedor Principal Responsivo
  mainWrapper: {
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },

  // Header Morado Oficial LE CHAMBEA
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    width: "100%",
    ...Platform.select({
      web: { boxShadow: "0px 4px 16px rgba(90,45,130,0.25)" } as any,
      default: {
        elevation: 6,
        shadowColor: PURPLE,
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
      },
    }),
  },
  purpleHeaderWrapperDesktop: {
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 18,
    ...Platform.select({
      web: { boxShadow: "0px 6px 20px rgba(90,45,130,0.22)" } as any,
    }),
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0,0,0,0.18)" } as any,
      default: { elevation: 3 },
    }),
  },
  brandLogo: {
    width: 50,
    height: 50,
  },
  brandTextCol: {
    flexDirection: "column",
  },
  appTitle: {
    fontSize: 24,
    fontFamily: "SansitaBoldItalic",
    color: "#FFFFFF",
    letterSpacing: 1.2,
    transform: [{ skewX: "-5deg" }],
  },
  badgeAdminContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginTop: 2,
    alignSelf: "flex-start",
  },
  badgeAdminText: {
    color: "#FFFFFF",
    fontSize: 9.5,
    fontWeight: "bold",
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },

  // Acciones Rápidas en Header para Pantallas Grandes (Desktop PC)
  desktopActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  desktopActionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    gap: 7,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      } as any,
    }),
  },
  desktopActionBtnDisabled: {
    opacity: 0.6,
  },
  desktopActionBtnLogout: {
    backgroundColor: "rgba(231, 76, 60, 0.28)",
    borderColor: "rgba(255, 120, 120, 0.4)",
  },
  desktopActionText: {
    color: "#FFFFFF",
    fontSize: 13.5,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  desktopActionTextLogout: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Menú Desplegable Hamburguesa Instantáneo
  dropdownBackdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.28)",
  },
  dropdownCard: {
    position: "absolute",
    right: 18,
    width: 220,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#ECECF1",
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: "0px 8px 24px rgba(0, 0, 0, 0.16)",
      } as any,
      default: {
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
    }),
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    gap: 10,
  },
  dropdownItemDanger: {
    marginTop: 2,
  },
  dropdownIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  dropdownTextCol: {
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C3E50",
  },
  dropdownItemSubText: {
    fontSize: 11,
    color: PURPLE,
    marginTop: 1,
  },
  dropdownTextDanger: {
    color: "#FF3B30",
    fontWeight: "700",
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: "#F0F0F4",
    marginVertical: 4,
    marginHorizontal: 6,
  },

  // Contenedor Interno Responsivo
  innerContainer: {
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 16,
    marginTop: 16,
  },
  innerContainerDesktop: {
    paddingHorizontal: 0,
    marginTop: 12,
  },

  // Section Headers
  sectionHeader: {
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "#ECECF1",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  statCardDesktop: {
    width: "calc(33.333% - 8px)" as any,
    minWidth: 260,
    flex: 1,
  },
  statCardMobile: {
    width: "calc(50% - 6px)" as any,
    minWidth: 145,
    flex: 1,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  statTextWrap: {
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginTop: 2,
  },

  // Modules Grid
  modulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  moduleWrapper: {
    backgroundColor: "white",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#ECECF1",
    overflow: "hidden",
    ...Platform.select({
      web: {
        boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.04)",
        cursor: "pointer",
      } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  moduleWrapperDesktop: {
    width: "calc(50% - 7px)" as any,
    minWidth: 440,
    flex: 1,
  },
  moduleWrapperMobile: {
    width: "100%",
  },
  moduleCard: {
    padding: 16,
  },
  moduleCardExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F5",
  },
  moduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 52,
  },
  moduleIconBox: {
    width: 48,
    height: 48,
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
    fontSize: 15.5,
    fontWeight: "bold",
    color: "#1A1A1A",
  },
  moduleDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 16,
  },

  // SubActions
  subActionsContainer: {
    backgroundColor: "#FAFBFD",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  subActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 4,
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
});
