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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminUser, AdminReport, DirectNoticePayload } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

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

  useEffect(() => {
    if (preselectedUser?.id) {
      setSelectedUserId(preselectedUser.id);
    } else if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id);
    }

    if (reportContext) {
      applyTemplate("gratitude");
    } else {
      setTitle("");
      setBody("");
      setSelectedTemplate(null);
    }
  }, [preselectedUser, reportContext, visible]);

  const targetUser = users.find((u) => u.id === selectedUserId) || preselectedUser;

  const applyTemplate = (type: "gratitude" | "warning" | "moderation") => {
    setSelectedTemplate(type);
    const uName = targetUser?.nombre || "usuario";

    if (type === "gratitude") {
      setTitle("Agradecimiento por tu reporte");
      setBody(
        `Hola ${uName}, agradecemos profundamente tu colaboración al reportar una incongruencia o problema en la plataforma. Nuestro equipo administrativo ha revisado el caso y tomado las medidas pertinentes. ¡Gracias por ayudarnos a mantener Le Chambea seguro y confiable!`
      );
    } else if (type === "warning") {
      setTitle("Advertencia por infracción a los términos de uso");
      setBody(
        `Estimado/a ${uName}, la administración ha recibido alertas sobre tu actividad reciente que no cumplen con los lineamientos de la comunidad de Le Chambea. Te exhortamos a mantener un trato profesional y respetuoso para evitar la suspensión definitiva de tu cuenta.`
      );
    } else if (type === "moderation") {
      setTitle("Aviso de moderación de contenido");
      setBody(
        `Hola ${uName}, te informamos que uno de tus comentarios, servicios o fotos publicados fue retirado por nuestro equipo de moderación debido a que no cumplía con las normas comunitarias de la plataforma.`
      );
    }
  };

  const handleSend = async () => {
    if (!selectedUserId || !title.trim() || !body.trim()) return;

    const uName = `${targetUser?.nombre || ""} ${targetUser?.apellidos || ""}`.trim() || targetUser?.correo;

    const success = await onSendNotice({
      userId: selectedUserId,
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
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
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
            {preselectedUser ? (
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
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
