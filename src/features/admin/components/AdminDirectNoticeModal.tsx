import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminUser, AdminReport, DirectNoticePayload } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { supabase } from "../../../services/supabase";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface Props {
  visible: boolean;
  onClose: () => void;
  users: AdminUser[];
  preselectedUser?: AdminUser | null;
  reportContext?: AdminReport | null;
  onSendNotice: (payload: DirectNoticePayload) => Promise<boolean>;
  actionLoading?: boolean;
}

export default function AdminDirectNoticeModal({
  visible,
  onClose,
  users,
  preselectedUser,
  reportContext,
  onSendNotice,
  actionLoading,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Estados para participantes cuando proviene de un reporte
  const [reporterUser, setReporterUser] = useState<AdminUser | null>(null);
  const [reportedUser, setReportedUser] = useState<AdminUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<"reporter" | "reported">("reporter");

  const resolveParticipants = async (
    report: AdminReport,
    allUsers: AdminUser[],
    preselected?: AdminUser | null
  ) => {
    const rawBody = report.cuerpo || "";
    const rawTitle = report.titulo || "";

    // 1. Resolver Reportante
    let rep: AdminUser | undefined = undefined;
    if (report.usuario_id) {
      rep = allUsers.find((u) => u.id === report.usuario_id);
    }
    if (!rep && report.usuario?.id) {
      rep = allUsers.find((u) => u.id === report.usuario.id);
    }
    if (!rep && rawBody) {
      const repIdMatch = rawBody.match(/(?:ID de usuario|SolicitadoPor):\s*([a-f0-9-]{10,})/i);
      if (repIdMatch) {
        rep = allUsers.find((u) => u.id === repIdMatch[1]);
      }
    }
    if (!rep && preselected && preselected.id) {
      rep = preselected;
    }
    if (!rep) {
      const repMatch =
        rawBody.match(/Quien reporta:\s*([^(\n\r]+)(?:\(([^)\n\r]+)\))?/i) ||
        rawBody.match(/El (?:Cliente|Profesional|usuario)\s+([^\n\r]+?)\s+solicita/i) ||
        rawBody.match(/El usuario\s+([^\n\r]+?)\s+report[oó]/i);
      const name = report.usuario
        ? `${report.usuario.nombre || ""} ${report.usuario.apellidos || ""}`.trim()
        : repMatch
        ? repMatch[1].trim()
        : "Usuario Reportante";
      rep = {
        id: report.usuario_id || report.usuario?.id || preselected?.id || "",
        nombre: name || "Usuario Reportante",
        apellidos: "",
        correo: report.usuario?.correo || "",
        telefono: "",
        ciudad: "",
        foto_perfil: report.usuario?.foto_perfil || null,
        rol: "usuario",
        onboarding_completado: true,
        fecha_creacion: "",
      };
    }

    // 2. Resolver Reportado / Contraparte
    let reported: AdminUser | undefined = undefined;

    // Buscar si hay ID de contraparte en el cuerpo
    const reportedIdMatch = rawBody.match(/(?:CanceladoPor|AbortadoPor|RechazadoPor):\s*([a-f0-9-]{10,})/i);
    if (reportedIdMatch) {
      reported = allUsers.find((u) => u.id === reportedIdMatch[1]);
    }

    // Extraer nombre del reportado
    const reportedNameMatch =
      rawBody.match(/Usuario reportado:\s*([^(\n\r]+)(?:\(([^)\n\r]+)\))?/i) ||
      rawBody.match(/Contraparte que canceló:\s*([^\n\r]+)/i) ||
      rawTitle.match(/reportó a (?:Profesional|Cliente|usuario)\s*\(([^)]+)\)/i) ||
      rawBody.match(/profesional\s+([^.\n\r]+)/i);

    const reportedName = reportedNameMatch ? reportedNameMatch[1].trim() : null;

    if (!reported && reportedName) {
      const normName = reportedName.toLowerCase();
      reported = allUsers.find((u) => {
        const full = `${u.nombre || ""} ${u.apellidos || ""}`.trim().toLowerCase();
        const first = (u.nombre || "").trim().toLowerCase();
        return full === normName || first === normName || (normName.length > 3 && (full.includes(normName) || normName.includes(full)));
      });
    }

    // Si aún no se encuentra y hay chatId, buscar en la tabla 'chats'
    const chatMatch =
      rawBody.match(/(?:ID del Chat|ID de Chat|Chat ID|\(ID)\s*[:=]?\s*([a-f0-9-]{10,})/i) ||
      rawBody.match(/chat_id\s*[:=]\s*([a-f0-9-]{10,})/i);
    const chatId = chatMatch ? chatMatch[1].trim() : null;

    if ((!reported || !reported.id) && chatId) {
      try {
        const { data: chatData } = await supabase
          .from("chats")
          .select("cliente_id, profesional_id")
          .eq("id", chatId)
          .maybeSingle();

        if (chatData) {
          const otherId = chatData.cliente_id === rep?.id ? chatData.profesional_id : chatData.cliente_id;
          if (otherId) {
            const fromUsers = allUsers.find((u) => u.id === otherId);
            if (fromUsers) {
              reported = fromUsers;
            } else {
              const { data: dbUser } = await supabase
                .from("usuarios")
                .select("id, nombre, apellidos, correo, telefono, ciudad, foto_perfil, rol, onboarding_completado, fecha_creacion")
                .eq("id", otherId)
                .maybeSingle();
              if (dbUser) {
                reported = dbUser as AdminUser;
              }
            }
          }
        }
      } catch (err) {
        console.warn("Error fetching chat participants for reported user:", err);
      }
    }

    if (!reported && reportedName) {
      reported = {
        id: "",
        nombre: reportedName,
        apellidos: "",
        correo: "",
        telefono: "",
        ciudad: "",
        foto_perfil: null,
        rol: "usuario",
        onboarding_completado: true,
        fecha_creacion: "",
      };
    }

    return { reporter: rep, reported };
  };

  const applyTemplate = (
    type: "gratitude" | "warning" | "moderation",
    overrideUser?: AdminUser | null
  ) => {
    setSelectedTemplate(type);
    const activeUser =
      overrideUser !== undefined
        ? overrideUser
        : (reportContext && selectedRole === "reported" ? reportedUser : reporterUser) || targetUser;
    const uName = activeUser?.nombre || "usuario";

    if (type === "gratitude") {
      setTitle("Agradecimiento por tu reporte");
      setBody(
        `Hola ${uName},\n\nGracias por tu reporte. Nuestro equipo ha revisado la situación y está tomando las medidas correspondientes.\n\n- Administración de **"Le Chambea"**`
      );
    } else if (type === "warning") {
      setTitle("Advertencia por infracción a los términos de uso");
      setBody(
        `Hola ${uName},\n\nHemos detectado actividad reciente en tu cuenta que no cumple con las normas y lineamientos de convivencia de la plataforma. Te recordamos la importancia de mantener un comportamiento respetuoso y profesional para evitar sanciones o la suspensión definitiva de tu cuenta.\n\n- Administración de **"Le Chambea"**`
      );
    } else if (type === "moderation") {
      setTitle("Aviso de moderación de contenido");
      setBody(
        `Hola ${uName},\n\nTe informamos que hemos retirado contenido asociado a tu cuenta debido a que no cumple con las normas comunitarias de la plataforma. Te invitamos a seguir las normas de la comunidad para evitar futuras restricciones, sanciones o la suspensión definitiva de tu cuenta.\n\n- Administración de **"Le Chambea"**`
      );
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initModal = async () => {
      if (!visible) return;

      if (reportContext) {
        const { reporter, reported } = await resolveParticipants(reportContext, users, preselectedUser);
        if (!isMounted) return;

        setReporterUser(reporter || null);
        setReportedUser(reported || null);
        setSelectedRole("reporter");

        if (reporter?.id) {
          setSelectedUserId(reporter.id);
        } else if (preselectedUser?.id) {
          setSelectedUserId(preselectedUser.id);
        }

        applyTemplate("gratitude", reporter);
      } else {
        setReporterUser(null);
        setReportedUser(null);
        setSelectedRole("reporter");

        if (preselectedUser?.id) {
          setSelectedUserId(preselectedUser.id);
        } else if (users.length > 0 && !selectedUserId) {
          setSelectedUserId(users[0].id);
        }

        setTitle("");
        setBody("");
        setSelectedTemplate(null);
      }
    };

    initModal();

    return () => {
      isMounted = false;
    };
  }, [preselectedUser, reportContext, visible, users]);

  const targetUser =
    (reportContext && selectedRole === "reported" ? reportedUser : reporterUser) ||
    users.find((u) => u.id === selectedUserId) ||
    preselectedUser;

  const handleSelectRecipientRole = (role: "reporter" | "reported") => {
    setSelectedRole(role);
    const user = role === "reporter" ? reporterUser : reportedUser;
    if (user?.id) {
      setSelectedUserId(user.id);
    } else {
      setSelectedUserId("");
    }

    if (role === "reported" && (selectedTemplate === "gratitude" || !selectedTemplate)) {
      applyTemplate("warning", user);
    } else if (role === "reporter" && (selectedTemplate === "warning" || selectedTemplate === "moderation" || !selectedTemplate)) {
      applyTemplate("gratitude", user);
    } else if (selectedTemplate) {
      applyTemplate(selectedTemplate as any, user);
    }
  };

  const handleSend = async () => {
    const recipient =
      (reportContext && selectedRole === "reported" ? reportedUser : reporterUser) ||
      targetUser;
    const finalUserId = recipient?.id || selectedUserId;

    if (!finalUserId || !title.trim() || !body.trim()) {
      if (!finalUserId) {
        Alert.alert(
          "Destinatario no identificado",
          "No se encontró el ID del usuario seleccionado para recibir la notificación."
        );
      }
      return;
    }

    const uName = `${recipient?.nombre || ""} ${recipient?.apellidos || ""}`.trim() || recipient?.correo;

    const success = await onSendNotice({
      userId: finalUserId,
      userName: uName,
      title: title.trim(),
      body: body.trim(),
      type: "general",
    });

    if (success) {
      setTitle("");
      setBody("");
      setSelectedTemplate(null);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
          {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.select({
                web: 14,
                android: (insets.top || 24) + 6,
                ios: insets.top > 0 ? insets.top : 12,
                default: 14,
              }),
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Notificación Directa a Usuario</Text>
            <Text style={styles.headerSubtitle}>Aviso administrativo individual</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Target User Selector Box */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Destinatario:</Text>
            {reportContext && (reporterUser || reportedUser) ? (
              <View style={styles.reportRecipientWrap}>
                <Text style={styles.helperText}>
                  Selecciona a cuál de los usuarios deseas notificar:
                </Text>
                <View style={styles.reportRecipientGrid}>
                  {/* Tarjeta Reportante */}
                  {reporterUser && (
                    <TouchableOpacity
                      style={[
                        styles.recipientCard,
                        selectedRole === "reporter" && styles.recipientCardActive,
                      ]}
                      onPress={() => handleSelectRecipientRole("reporter")}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recipientHeaderRow}>
                        <View style={[styles.roleBadge, { backgroundColor: "#EBF3FF" }]}>
                          <MaterialCommunityIcons name="bullhorn-outline" size={13} color="#007AFF" />
                          <Text style={[styles.roleBadgeText, { color: "#007AFF" }]}>Usuario Reportante</Text>
                        </View>
                        <MaterialCommunityIcons
                          name={selectedRole === "reporter" ? "radiobox-marked" : "radiobox-blank"}
                          size={19}
                          color={selectedRole === "reporter" ? PURPLE : "#AAA"}
                        />
                      </View>
                      <View style={styles.recipientInfo}>
                        <Text style={styles.recipientName} numberOfLines={1}>
                          {`${reporterUser.nombre || ""} ${reporterUser.apellidos || ""}`.trim() || "Usuario Reportante"}
                        </Text>
                        {!!reporterUser.correo && (
                          <Text style={styles.recipientEmail} numberOfLines={1}>
                            {reporterUser.correo}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Tarjeta Reportado */}
                  {reportedUser && (
                    <TouchableOpacity
                      style={[
                        styles.recipientCard,
                        selectedRole === "reported" && styles.recipientCardActiveDanger,
                      ]}
                      onPress={() => handleSelectRecipientRole("reported")}
                      activeOpacity={0.8}
                    >
                      <View style={styles.recipientHeaderRow}>
                        <View style={[styles.roleBadge, { backgroundColor: "#FDEDEC" }]}>
                          <MaterialCommunityIcons name="alert-octagon-outline" size={13} color="#E74C3C" />
                          <Text style={[styles.roleBadgeText, { color: "#E74C3C" }]}>Usuario Reportado</Text>
                        </View>
                        <MaterialCommunityIcons
                          name={selectedRole === "reported" ? "radiobox-marked" : "radiobox-blank"}
                          size={19}
                          color={selectedRole === "reported" ? "#E74C3C" : "#AAA"}
                        />
                      </View>
                      <View style={styles.recipientInfo}>
                        <Text style={styles.recipientName} numberOfLines={1}>
                          {`${reportedUser.nombre || ""} ${reportedUser.apellidos || ""}`.trim() || "Usuario Reportado"}
                        </Text>
                        {!!reportedUser.correo && (
                          <Text style={styles.recipientEmail} numberOfLines={1}>
                            {reportedUser.correo}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : preselectedUser ? (
              <View style={styles.selectedUserCard}>
                <MaterialCommunityIcons name="account-circle" size={28} color={PURPLE} />
                <View style={styles.selectedUserInfo}>
                  <Text style={styles.selectedUserName}>
                    {`${preselectedUser.nombre || ""} ${preselectedUser.apellidos || ""}`.trim() || "Usuario"}
                  </Text>
                  <Text style={styles.selectedUserEmail}>{preselectedUser.correo || preselectedUser.id}</Text>
                </View>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.userPickerScroll}
                contentContainerStyle={styles.userPickerContent}
              >
                {users.map((u) => {
                  const isSelected = u.id === selectedUserId;
                  const name = `${u.nombre || ""} ${u.apellidos || ""}`.trim() || u.correo;
                  return (
                    <TouchableOpacity
                      key={u.id}
                      style={[styles.userChip, isSelected && styles.userChipActive]}
                      onPress={() => setSelectedUserId(u.id)}
                    >
                      <MaterialCommunityIcons
                        name="account"
                        size={14}
                        color={isSelected ? "white" : "#666"}
                      />
                      <Text style={[styles.userChipText, isSelected && styles.userChipTextActive]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Quick Templates */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Plantillas Rápidas:</Text>
            <View style={styles.templateRow}>
              <TouchableOpacity
                style={[
                  styles.templateBtn,
                  selectedTemplate === "gratitude" && styles.templateBtnActive,
                ]}
                onPress={() => applyTemplate("gratitude")}
              >
                <MaterialCommunityIcons
                  name="hand-heart"
                  size={16}
                  color={selectedTemplate === "gratitude" ? PURPLE : "#555"}
                />
                <Text
                  style={[
                    styles.templateBtnText,
                    selectedTemplate === "gratitude" && styles.templateBtnTextActive,
                  ]}
                >
                  Agradecimiento
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.templateBtn,
                  selectedTemplate === "warning" && styles.templateBtnActiveDanger,
                ]}
                onPress={() => applyTemplate("warning")}
              >
                <MaterialCommunityIcons
                  name="alert-octagon"
                  size={16}
                  color={selectedTemplate === "warning" ? "#E74C3C" : "#555"}
                />
                <Text
                  style={[
                    styles.templateBtnText,
                    selectedTemplate === "warning" && styles.templateBtnTextDanger,
                  ]}
                >
                  Advertencia
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.templateBtn,
                  selectedTemplate === "moderation" && styles.templateBtnActiveOrange,
                ]}
                onPress={() => applyTemplate("moderation")}
              >
                <MaterialCommunityIcons
                  name="shield-alert"
                  size={16}
                  color={selectedTemplate === "moderation" ? "#FF9500" : "#555"}
                />
                <Text
                  style={[
                    styles.templateBtnText,
                    selectedTemplate === "moderation" && styles.templateBtnTextOrange,
                  ]}
                >
                  Moderación
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Title Input */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Asunto / Título del Aviso:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Agradecimiento por reporte, Advertencia..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Message Body */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Mensaje Oficial:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Escribe el mensaje claro y formal para el usuario..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              value={body}
              onChangeText={setBody}
            />
          </View>

          {/* Send Button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!title.trim() || !body.trim() || !selectedUserId || actionLoading) &&
                styles.sendBtnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!title.trim() || !body.trim() || !selectedUserId || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="send" size={18} color="white" />
                <Text style={styles.sendBtnText}>Enviar Notificación Oficial</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
        </View>
      </View>
    </Modal>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  sectionBox: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#444",
  },
  selectedUserCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    padding: 10,
    borderRadius: 10,
    gap: 10,
  },
  selectedUserInfo: {
    flex: 1,
  },
  selectedUserName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  selectedUserEmail: {
    fontSize: 12,
    color: "#666",
  },
  reportRecipientWrap: {
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  reportRecipientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  recipientCard: {
    flex: 1,
    minWidth: 160,
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
  },
  recipientCardActive: {
    backgroundColor: LIGHT_PURPLE,
    borderColor: PURPLE,
  },
  recipientCardActiveDanger: {
    backgroundColor: "#FDEDEC",
    borderColor: "#E74C3C",
  },
  recipientHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  recipientInfo: {
    marginTop: 2,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#222",
  },
  recipientEmail: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  userPickerScroll: {
    maxHeight: 40,
  },
  userPickerContent: {
    gap: 8,
  },
  userChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  userChipActive: {
    backgroundColor: PURPLE,
  },
  userChipText: {
    fontSize: 12,
    color: "#555",
  },
  userChipTextActive: {
    color: "white",
    fontWeight: "bold",
  },
  templateRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  templateBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  templateBtnActive: {
    backgroundColor: LIGHT_PURPLE,
    borderWidth: 1,
    borderColor: PURPLE,
  },
  templateBtnActiveDanger: {
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#E74C3C",
  },
  templateBtnActiveOrange: {
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#FF9500",
  },
  templateBtnText: {
    fontSize: 12,
    color: "#555",
    fontWeight: "500",
  },
  templateBtnTextActive: {
    color: PURPLE,
    fontWeight: "bold",
  },
  templateBtnTextDanger: {
    color: "#E74C3C",
    fontWeight: "bold",
  },
  templateBtnTextOrange: {
    color: "#FF9500",
    fontWeight: "bold",
  },
  textInput: {
    backgroundColor: "#F9F9FB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
    borderWidth: 1,
    borderColor: "#EEE",
  },
  textArea: {
    backgroundColor: "#F9F9FB",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#222",
    minHeight: 120,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  sendBtnDisabled: {
    backgroundColor: "#CCC",
  },
  sendBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },
});
