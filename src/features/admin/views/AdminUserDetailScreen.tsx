import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { AdminUser, DirectNoticePayload } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { supabase } from "../../../services/supabase";
import AdminDirectNoticeModal from "../components/AdminDirectNoticeModal";
import AdminConfirmModal, { AdminConfirmType } from "../components/AdminConfirmModal";
import { showAlert } from "../../../shared/utils/customAlert";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

export interface AdminUserDetailScreenProps {
  user?: AdminUser | null;
  onBack?: () => void;
  onToggleSuspend?: (userId: string, currentSuspended: boolean) => void;
  onDeleteUser?: (userId: string, userName: string) => void;
  onDirectNotice?: (user: AdminUser) => void;
  onGoToReviews?: (user: AdminUser) => void;
  onGoToServices?: (user: AdminUser) => void;
  onGoToServiceDetail?: (userId: string, profileId: string, user: AdminUser) => void;
  actionLoading?: boolean;
}

export default function AdminUserDetailScreen({
  user: initialUser,
  onBack,
  onToggleSuspend,
  onDeleteUser,
  onDirectNotice,
  onGoToReviews,
  onGoToServices,
  onGoToServiceDetail,
  actionLoading = false,
}: AdminUserDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { isLargeScreen } = useResponsive();

  // Support both direct props and navigation route params
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(
    initialUser || route?.params?.user || null
  );
  const [internalLoading, setInternalLoading] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [sendingNotice, setSendingNotice] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    visible: boolean;
    type: AdminConfirmType;
    title: string;
    description: string;
    targetName?: string;
    targetSubtitle?: string;
    warningNote?: string;
    confirmText?: string;
    onConfirm: () => Promise<void> | void;
  } | null>(null);

  // If passed only userId via route params, fetch user details
  React.useEffect(() => {
    if (!currentUser && route?.params?.userId) {
      fetchUserById(route.params.userId);
    }
  }, [route?.params?.userId]);

  React.useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    } else if (route?.params?.user) {
      setCurrentUser(route.params.user);
    }
  }, [initialUser, route?.params?.user]);

  const fetchUserById = async (userId: string) => {
    try {
      setInternalLoading(true);
      const { data, error } = await supabase
        .from("usuarios")
        .select(`
          id,
          nombre,
          apellidos,
          correo,
          telefono,
          ciudad,
          rol,
          fecha_creacion,
          foto_perfil,
          perfiles_profesionales (
            id,
            profesion,
            categoria,
            descripcion,
            zona,
            esta_activo
          )
        `)
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (data) {
        setCurrentUser({
          ...(data as any),
          esta_activo: data.rol !== "suspendido",
        });
      }
    } catch (err: any) {
      console.error("Error fetching user details:", err);
      showAlert("Error", "No se pudo cargar la información del usuario.", undefined, "danger");
    } finally {
      setInternalLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate("AdminUserDirectory");
    }
  };

  if (internalLoading || !currentUser) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={PURPLE} />
        <Text style={styles.loadingText}>Cargando ficha de usuario...</Text>
      </View>
    );
  }

  const fullName =
    `${currentUser.nombre || ""} ${currentUser.apellidos || ""}`.trim() ||
    "Usuario sin nombre";
  const isPro =
    (currentUser.perfiles_profesionales &&
      currentUser.perfiles_profesionales.length > 0) ||
    currentUser.rol === "profesional";
  const isSuspended =
    currentUser.rol === "suspendido" || currentUser.esta_activo === false;

  const handleSuspendPress = () => {
    if (!currentUser) return;

    setConfirmModal({
      visible: true,
      type: isSuspended ? "reactivate" : "suspend",
      title: isSuspended ? "¿Reactivar cuenta?" : "¿Suspender cuenta?",
      description: isSuspended
        ? "El usuario recuperará el acceso a la plataforma y sus servicios profesionales volverán a estar activos."
        : "El usuario perderá el acceso a su cuenta de inmediato y sus servicios profesionales se pausarán en la plataforma.",
      confirmText: isSuspended ? "Reactivar Cuenta" : "Suspender Cuenta",
      onConfirm: async () => {
        try {
          const nextActive = isSuspended;
          const nextRol = isSuspended ? (isPro ? "profesional" : "usuario") : "suspendido";

          if (onToggleSuspend) {
            await onToggleSuspend(currentUser.id, isSuspended);
          } else {
            const { error: userErr } = await supabase
              .from("usuarios")
              .update({ rol: nextRol })
              .eq("id", currentUser.id);

            if (userErr) throw userErr;

            // Sincronizar estado de los servicios vinculados del profesional
            await supabase
              .from("perfiles_profesionales")
              .update({ esta_activo: nextActive })
              .eq("usuario_id", currentUser.id);
          }

          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  rol: nextRol,
                  esta_activo: nextActive,
                }
              : null
          );

          showAlert(
            isSuspended ? "Cuenta reactivada" : "Cuenta suspendida",
            isSuspended
              ? "El usuario y sus servicios están activos nuevamente."
              : "La cuenta del usuario ha sido suspendida y sus servicios fueron pausados.",
            undefined,
            "success"
          );
        } catch (e: any) {
          console.error("Error al actualizar estado de cuenta:", e);
          showAlert("Error", e?.message || "No se pudo actualizar el estado de la cuenta.", undefined, "danger");
        } finally {
          setConfirmModal(null);
        }
      },
    });
  };

  const handleDeletePress = () => {
    if (!currentUser) return;
    const name = fullName || currentUser.correo;

    setConfirmModal({
      visible: true,
      type: "delete",
      title: "¿Eliminar usuario?",
      description:
        "¿Estás seguro de que deseas eliminar permanentemente a este usuario? Esta acción borrará todos sus perfiles, servicios y registros de la plataforma.",
      confirmText: "Eliminar",
      onConfirm: async () => {
        try {
          if (onDeleteUser) {
            await onDeleteUser(currentUser.id, name);
          } else {
            const uid = currentUser.id;

            // Eliminación segura en cascada para evitar fallos de claves foráneas
            await supabase.from("perfiles_profesionales").delete().eq("usuario_id", uid);
            await supabase.from("resenas").delete().or(`cliente_id.eq.${uid},profesional_id.eq.${uid}`);
            await supabase.from("favoritos").delete().or(`cliente_id.eq.${uid},profesional_id.eq.${uid}`);
            await supabase.from("notificaciones").delete().eq("usuario_id", uid);
            await supabase.from("mensajes").delete().eq("remitente_id", uid);
            await supabase.from("chats").delete().or(`cliente_id.eq.${uid},profesional_id.eq.${uid}`);

            const { error: delErr } = await supabase.from("usuarios").delete().eq("id", uid);
            if (delErr) throw delErr;
          }

          showAlert(
            "Usuario eliminado",
            "La cuenta ha sido eliminada permanentemente del sistema.",
            undefined,
            "success"
          );

          setConfirmModal(null);
          handleBack();
        } catch (e: any) {
          console.error("Error al eliminar usuario:", e);
          showAlert("Error al eliminar", e?.message || "No se pudo eliminar el usuario de la base de datos.", undefined, "danger");
          setConfirmModal(null);
        }
      },
    });
  };

  const handleNoticePress = () => {
    if (onDirectNotice && currentUser) {
      onDirectNotice(currentUser);
    } else {
      setShowNoticeModal(true);
    }
  };

  const handleSendDirectNotice = async (payload: DirectNoticePayload) => {
    try {
      setSendingNotice(true);
      if (!payload.title.trim() || !payload.body.trim()) {
        showAlert("Campos requeridos", "Por favor ingresa un título y un mensaje.", undefined, "warning");
        return false;
      }
      const formattedTitle = `📢 AVISO ADMINISTRATIVO: ${payload.title.trim()}`;
      const { error } = await supabase.from("notificaciones").insert({
        usuario_id: payload.userId,
        titulo: formattedTitle,
        cuerpo: payload.body.trim(),
        leido: false,
      });
      if (error) throw error;
      showAlert("Aviso Enviado", `Se notificó directamente a ${currentUser?.nombre || "el usuario"}.`, undefined, "success");
      setShowNoticeModal(false);
      return true;
    } catch (err: any) {
      showAlert("Error", err.message || "No se pudo enviar el aviso directo.", undefined, "danger");
      return false;
    } finally {
      setSendingNotice(false);
    }
  };

  const handleServicePress = (srv: any) => {
    if (onGoToServiceDetail && currentUser) {
      onGoToServiceDetail(currentUser.id, srv.id, currentUser);
    } else {
      navigation.navigate("AdminServiceDetail", {
        id: currentUser?.id,
        professionalProfileId: srv.id,
      });
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
        {/* Screen Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.select({
              web: 16,
              android: (insets.top || 24) + 8,
              ios: insets.top > 0 ? insets.top + 6 : 14,
              default: 16,
            }),
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backButton}
          activeOpacity={0.7}
          accessibilityLabel="Volver al control de usuarios"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#222" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Ficha de Usuario</Text>
        </View>
      </View>

      {/* Main Screen Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: Math.max(insets.bottom, 24) + 48,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.contentWrapper, { maxWidth: isLargeScreen ? 1100 : "100%" }]}>
          {/* Hero Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.avatarContainer}>
              {currentUser.foto_perfil ? (
                <Image source={{ uri: currentUser.foto_perfil }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                  <MaterialCommunityIcons name="account" size={40} color="#777" />
                </View>
              )}
              {isSuspended && (
                <View style={styles.suspendedBadgeIcon}>
                  <MaterialCommunityIcons name="pause" size={12} color="white" />
                </View>
              )}
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.profileName}>{fullName}</Text>
              <View style={styles.emailRow}>
                <MaterialCommunityIcons name="email-outline" size={14} color="#666" />
                <Text style={styles.profileEmail} numberOfLines={1}>
                  {currentUser.correo || "Sin correo"}
                </Text>
              </View>

              {/* Role Badge (Cliente / Profesional / Suspendido) - Sin etiqueta de cuenta activa */}
              <View style={styles.roleBadgeRow}>
                {isSuspended ? (
                  <View style={[styles.roleBadge, styles.roleBadgeSuspended]}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#E74C3C" />
                    <Text style={[styles.roleBadgeText, styles.roleBadgeTextSuspended]}>
                      Suspendido
                    </Text>
                  </View>
                ) : isPro ? (
                  <View style={[styles.roleBadge, styles.roleBadgePro]}>
                    <MaterialCommunityIcons name="briefcase-check-outline" size={14} color={PURPLE} />
                    <Text style={[styles.roleBadgeText, styles.roleBadgeTextPro]}>
                      Profesional
                    </Text>
                  </View>
                ) : (
                  <View style={[styles.roleBadge, styles.roleBadgeCliente]}>
                    <MaterialCommunityIcons name="account-outline" size={14} color="#2563EB" />
                    <Text style={[styles.roleBadgeText, styles.roleBadgeTextCliente]}>
                      Cliente
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* User Information Card (Teléfono, Ciudad, Fecha Registro - SIN ID de usuario) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={PURPLE} />
              <Text style={styles.sectionCardTitle}>Información de Usuario</Text>
            </View>

            <View style={styles.infoList}>
              <View style={styles.infoItem}>
                <View style={styles.infoIconWrap}>
                  <MaterialCommunityIcons name="phone-outline" size={18} color="#555" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Teléfono</Text>
                  <Text style={styles.infoValue}>
                    {currentUser.telefono || "No especificado"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconWrap}>
                  <MaterialCommunityIcons name="map-marker-outline" size={18} color="#555" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Ciudad</Text>
                  <Text style={styles.infoValue}>
                    {currentUser.ciudad || "No especificada"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoDivider} />

              <View style={styles.infoItem}>
                <View style={styles.infoIconWrap}>
                  <MaterialCommunityIcons name="calendar-month-outline" size={18} color="#555" />
                </View>
                <View style={styles.infoTextCol}>
                  <Text style={styles.infoLabel}>Fecha de registro</Text>
                  <Text style={styles.infoValue}>
                    {currentUser.fecha_creacion
                      ? new Date(currentUser.fecha_creacion).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : "No disponible"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Professional Services Section */}
          {currentUser.perfiles_profesionales && currentUser.perfiles_profesionales.length > 0 && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <MaterialCommunityIcons name="briefcase-outline" size={20} color={PURPLE} />
                <Text style={styles.sectionCardTitle}>
                  Servicios Profesionales
                </Text>
              </View>

              <View style={styles.servicesList}>
                {currentUser.perfiles_profesionales.map((srv) => (
                  <TouchableOpacity
                    key={srv.id}
                    style={styles.compactServiceCard}
                    activeOpacity={0.7}
                    onPress={() => handleServicePress(srv)}
                    accessibilityLabel={`Ver servicio ${srv.profesion}`}
                  >
                    <View style={styles.compactServiceLeft}>
                      <View style={styles.compactServiceIconWrap}>
                        <MaterialCommunityIcons name="briefcase-outline" size={18} color={PURPLE} />
                      </View>
                      <View style={styles.compactServiceInfoCol}>
                        <View style={styles.compactServiceTitleRow}>
                          <Text style={styles.compactServiceTitle} numberOfLines={1}>
                            {srv.profesion}
                          </Text>
                          <View style={styles.compactCategoryPill}>
                            <Text style={styles.compactCategoryPillText} numberOfLines={1}>
                              {srv.categoria}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.compactServiceSubtitleRow}>
                          <MaterialCommunityIcons name="map-marker-outline" size={12} color="#6B7280" />
                          <Text style={styles.compactServiceZoneText} numberOfLines={1}>
                            {srv.zona || "General"}
                          </Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.compactServiceRight}>
                      <MaterialCommunityIcons name="chevron-right" size={20} color="#9CA3AF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Administrative Actions */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <MaterialCommunityIcons name="shield-account-outline" size={20} color={PURPLE} />
              <Text style={styles.sectionCardTitle}>Acciones de Administración</Text>
            </View>

            <View style={styles.adminActionsCol}>
              {/* Enviar Notificación Directa */}
              <TouchableOpacity
                style={styles.actionNoticeButton}
                activeOpacity={0.8}
                onPress={handleNoticePress}
              >
                <MaterialCommunityIcons name="email-alert-outline" size={20} color={PURPLE} />
                <Text style={styles.actionNoticeText}>Enviar Notificación Directa</Text>
              </TouchableOpacity>

              {/* Suspender o Reactivar Cuenta */}
              <TouchableOpacity
                style={[
                  styles.actionSuspendButton,
                  isSuspended && styles.actionReactivateButton,
                ]}
                activeOpacity={0.8}
                onPress={handleSuspendPress}
              >
                <MaterialCommunityIcons
                  name={isSuspended ? "check-circle-outline" : "pause-circle-outline"}
                  size={20}
                  color={isSuspended ? "#15803D" : "#D97706"}
                />
                <Text
                  style={[
                    styles.actionSuspendText,
                    isSuspended && styles.actionReactivateText,
                  ]}
                >
                  {isSuspended ? "Reactivar Cuenta" : "Suspender Cuenta"}
                </Text>
              </TouchableOpacity>

              {/* Eliminar Usuario Definitivamente */}
              <TouchableOpacity
                style={styles.actionDeleteButton}
                activeOpacity={0.8}
                onPress={handleDeletePress}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color="#DC2626" />
                <Text style={styles.actionDeleteText}>Eliminar Usuario</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      </View>

      {/* Modal de Aviso Directo */}
      <AdminDirectNoticeModal
        visible={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        users={currentUser ? [currentUser] : []}
        preselectedUser={currentUser}
        onSendNotice={handleSendDirectNotice}
        actionLoading={sendingNotice}
      />

      {/* Modal Elegante de Confirmación de Acción (Suspender / Reactivar / Eliminar) */}
      {confirmModal && (
        <AdminConfirmModal
          visible={confirmModal.visible}
          type={confirmModal.type}
          title={confirmModal.title}
          description={confirmModal.description}
          targetName={confirmModal.targetName}
          targetSubtitle={confirmModal.targetSubtitle}
          warningNote={confirmModal.warningNote}
          confirmText={confirmModal.confirmText}
          onClose={() => setConfirmModal(null)}
          onConfirm={confirmModal.onConfirm}
          loading={actionLoading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    ...Platform.select({
      web: { boxShadow: "0px 1px 4px rgba(0,0,0,0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F2F3F7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  contentWrapper: {
    width: "100%",
    alignSelf: "center",
    gap: 16,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    gap: 16,
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  avatarPlaceholder: {
    backgroundColor: "#F0F1F5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  suspendedBadgeIcon: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#DC2626",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  profileInfoCol: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#111827",
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  profileEmail: {
    fontSize: 13,
    color: "#4B5563",
    flex: 1,
  },
  roleBadgeRow: {
    marginTop: 8,
    flexDirection: "row",
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  roleBadgeCliente: {
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  roleBadgeTextCliente: {
    color: "#2563EB",
  },
  roleBadgePro: {
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  roleBadgeTextPro: {
    color: PURPLE,
  },
  roleBadgeSuspended: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  roleBadgeTextSuspended: {
    color: "#DC2626",
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0,0,0,0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
        elevation: 1,
      },
    }),
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    paddingBottom: 10,
  },
  sectionCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1F2937",
  },
  infoList: {
    gap: 12,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    marginTop: 1,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#F3F4F6",
  },
  servicesList: {
    gap: 10,
  },
  compactServiceCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...Platform.select({
      web: { cursor: "pointer" } as any,
    }),
  },
  compactServiceLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  compactServiceIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: LIGHT_PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },
  compactServiceInfoCol: {
    flex: 1,
  },
  compactServiceTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  compactServiceTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    flexShrink: 1,
  },
  compactCategoryPill: {
    backgroundColor: "white",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  compactCategoryPillText: {
    fontSize: 10,
    fontWeight: "600",
    color: PURPLE,
  },
  compactServiceSubtitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  compactServiceZoneText: {
    fontSize: 11,
    color: "#6B7280",
  },
  compactServiceRight: {
    justifyContent: "center",
    alignItems: "center",
  },
  adminActionsCol: {
    gap: 10,
  },
  actionNoticeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
  },
  actionNoticeText: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: "700",
  },
  actionSuspendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFBEB",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  actionReactivateButton: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  actionSuspendText: {
    color: "#D97706",
    fontSize: 14,
    fontWeight: "700",
  },
  actionReactivateText: {
    color: "#15803D",
    fontSize: 14,
    fontWeight: "700",
  },
  actionDeleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEF2F2",
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  actionDeleteText: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "700",
  },
});
