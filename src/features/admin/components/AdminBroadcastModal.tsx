import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";

interface Props {
  visible: boolean;
  onClose: () => void;
  usersCount: number;
  onSendBroadcast: (title: string, body: string) => Promise<boolean>;
  actionLoading?: boolean;
}

export default function AdminBroadcastModal({
  visible,
  onClose,
  usersCount,
  onSendBroadcast,
  actionLoading,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const handleSend = () => {
    if (!title.trim() || !body.trim()) return;

    if (Platform.OS === "web") {
      if (
        confirm(
          `¿Estás seguro de emitir este comunicado global a ${usersCount} usuarios de la plataforma?`
        )
      ) {
        onSendBroadcast(title.trim(), body.trim()).then((ok) => {
          if (ok) {
            setTitle("");
            setBody("");
            onClose();
          }
        });
      }
    } else {
      Alert.alert(
        "Emitir Comunicado Global",
        `¿Estás seguro de enviar esta notificación a los ${usersCount} usuarios registrados?`,
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Enviar a Todos",
            onPress: () => {
              onSendBroadcast(title.trim(), body.trim()).then((ok) => {
                if (ok) {
                  setTitle("");
                  setBody("");
                  onClose();
                }
              });
            },
          },
        ]
      );
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
            <Text style={styles.headerTitle}>Comunicado Global (Broadcast)</Text>
            <Text style={styles.headerSubtitle}>Aviso masivo a toda la comunidad</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Reach Banner */}
          <View style={styles.reachBanner}>
            <MaterialCommunityIcons name="bullhorn" size={28} color={PURPLE} />
            <View style={styles.reachInfo}>
              <Text style={styles.reachTitle}>Alcance Global de la Plataforma</Text>
              <Text style={styles.reachDesc}>
                Esta notificación aparecerá en la campana de alertas de todos los {usersCount} usuarios activos.
              </Text>
            </View>
          </View>

          {/* Title */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Título del Comunicado:</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Ej. Actualización del servicio, Mantenimiento programado..."
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          {/* Body */}
          <View style={styles.sectionBox}>
            <Text style={styles.label}>Mensaje Masivo:</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Redacta el mensaje oficial que recibirán todos los usuarios..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={7}
              textAlignVertical="top"
              value={body}
              onChangeText={setBody}
            />
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!title.trim() || !body.trim() || actionLoading) && styles.sendBtnDisabled,
            ]}
            activeOpacity={0.85}
            onPress={handleSend}
            disabled={!title.trim() || !body.trim() || actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="broadcast" size={20} color="white" />
                <Text style={styles.sendBtnText}>Emitir a Toda la Comunidad</Text>
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
  reachBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3ECFA",
    padding: 14,
    borderRadius: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E3D5F2",
  },
  reachInfo: {
    flex: 1,
  },
  reachTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: PURPLE,
  },
  reachDesc: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
    lineHeight: 16,
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
    minHeight: 140,
    borderWidth: 1,
    borderColor: "#EEE",
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E74C3C",
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
