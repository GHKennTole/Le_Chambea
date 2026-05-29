import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useChatController, Message } from "../controllers/useChatController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

const PURPLE = "#5A2D82";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route }: Props) {
  const insets = useSafeAreaInsets();
  const { chatId, otherUserId } = route.params;
  const vm = useChatController(chatId, otherUserId);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const canChat = true;

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.remitente_id === vm.currentUser?.id;
    return (
      <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
        <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
          <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.contenido}</Text>
          <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
            {new Date(item.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  }, [vm.currentUser?.id]);

  if (vm.loading && !vm.chatInfo) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    await vm.sendMessage(msg);
  };

  const renderJobBanner = () => {
    if (vm.loading) return null;

    if (vm.isClient) {
      if (!vm.activeJob || vm.activeJob.estado === 'rejected') {
        return (
          <View style={styles.bannerContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={() => setShowServicePicker(true)}>
              <MaterialCommunityIcons name="briefcase-plus" size={20} color="white" />
              <Text style={styles.actionButtonText}>Solicitar Trabajo</Text>
            </TouchableOpacity>
          </View>
        );
      }
      if (vm.activeJob.estado === 'pending') {
        return (
          <View style={[styles.bannerContainer, styles.bannerPending]}>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#856404" />
            <Text style={styles.bannerTextWarning}>Solicitud enviada. Esperando respuesta...</Text>
          </View>
        );
      }
      if (vm.activeJob.estado === 'accepted') {
        return (
          <View style={[styles.bannerContainer, styles.bannerActive]}>
            <MaterialCommunityIcons name="briefcase-check" size={20} color="#155724" />
            <Text style={styles.bannerTextSuccess}>Trabajo en curso</Text>
          </View>
        );
      }
      if (vm.activeJob.estado === 'completed') {
        return (
          <View style={styles.bannerContainer}>
            <View style={styles.completedInfo}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#155724" />
              <Text style={styles.bannerTextSuccess}>¡Trabajo terminado!</Text>
            </View>
            {!vm.isReviewed && (
              <TouchableOpacity style={styles.reviewButton} onPress={vm.leaveReview}>
                <MaterialCommunityIcons name="star" size={16} color="white" />
                <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]} onPress={() => setShowServicePicker(true)}>
              <Text style={styles.actionButtonText}>Solicitar Nuevo Trabajo</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (vm.isProfessional) {
      if (!vm.activeJob || vm.activeJob.estado === 'rejected') return null;
      if (vm.activeJob.estado === 'pending') {
        return (
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerTitle}>¡Nueva Solicitud de Trabajo!</Text>
            {vm.activeJob?.perfiles_profesionales && (
              <View style={styles.serviceTag}>
                <MaterialCommunityIcons name="briefcase-outline" size={16} color={PURPLE} />
                <Text style={styles.serviceTagText}>{vm.activeJob.perfiles_profesionales.profesion}</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.proButton, styles.btnReject]} onPress={() => vm.updateJobStatus(vm.activeJob!.id, 'rejected')}>
                <Text style={styles.btnRejectText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.proButton, styles.btnAccept]} onPress={() => vm.updateJobStatus(vm.activeJob!.id, 'accepted')}>
                <Text style={styles.btnAcceptText}>Aceptar Trabajo</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      if (vm.activeJob.estado === 'accepted') {
        return (
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerTitle}>Trabajo en curso</Text>
            {vm.activeJob?.perfiles_profesionales && (
              <View style={styles.serviceTag}>
                <MaterialCommunityIcons name="briefcase-outline" size={16} color={PURPLE} />
                <Text style={styles.serviceTagText}>{vm.activeJob.perfiles_profesionales.profesion}</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.proButton, styles.btnReject]} onPress={() => vm.updateJobStatus(vm.activeJob!.id, 'rejected')}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="#dc3545" />
                <Text style={styles.btnRejectText}>Abortar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.proButton, styles.btnFinish]} onPress={() => vm.updateJobStatus(vm.activeJob!.id, 'completed')}>
                <MaterialCommunityIcons name="check-all" size={18} color="white" />
                <Text style={styles.btnAcceptText}>Terminado</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }
      if (vm.activeJob.estado === 'completed') {
        return (
          <View style={[styles.bannerContainer, styles.bannerActive]}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#155724" />
            <Text style={styles.bannerTextSuccess}>Trabajo completado. Esperando reseña.</Text>
          </View>
        );
      }
    }
    return null;
  };

  const renderLockedInput = () => {
    let lockMessage = "Solicita un trabajo para iniciar el chat";
    if (vm.activeJob?.estado === 'pending') lockMessage = "Esperando que se acepte el trabajo...";
    if (vm.activeJob?.estado === 'completed') lockMessage = "Trabajo completado. Solicita uno nuevo para chatear.";
    if (vm.activeJob?.estado === 'rejected') lockMessage = "Solicita un trabajo para iniciar el chat";

    return (
      <View style={[styles.lockedInputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        <MaterialCommunityIcons name="lock" size={18} color="#999" />
        <Text style={styles.lockedText}>{lockMessage}</Text>
      </View>
    );
  };

  const handleReportPress = () => {
    const title = "Reportar Incongruencia";
    const msg = "¿Deseas notificar a los administradores sobre una incongruencia en este chat?";
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) {
        vm.reportIncongruency("El usuario ha detectado una incongruencia o error en esta conversación.");
      }
    } else {
      Alert.alert(
        title,
        msg,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Reportar", style: "destructive", onPress: () => {
            vm.reportIncongruency("El usuario ha detectado una incongruencia o error en esta conversación.");
          }}
        ]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 90}
    >
      <View style={[styles.header, { paddingTop: insets.top + 5, paddingBottom: 5, height: 60 + insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Chat con {vm.otherUser ? `${vm.otherUser.nombre} ${vm.otherUser.apellidos}`.trim() : 'Usuario'}
          </Text>
          <TouchableOpacity onPress={handleReportPress} style={styles.reportHeaderBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="alert-octagon-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {renderJobBanner()}

      <View style={styles.listContainer}>
        <FlatList
        ref={flatListRef}
        data={vm.messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={[
          styles.messagesList, 
          vm.messages.length === 0 && styles.messagesEmpty
        ]}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <MaterialCommunityIcons name="chat-outline" size={48} color="#DDD" />
            <Text style={styles.emptyChatText}>
              {canChat ? "Envía el primer mensaje" : "No hay mensajes aún"}
            </Text>
          </View>
        }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      </View>

      {canChat ? (
        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!text.trim() || vm.sending) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!text.trim() || vm.sending}
          >
            {vm.sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="send" size={22} color="white" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        renderLockedInput()
      )}

      <FloatingBackButton />

      <Modal visible={showServicePicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>¿Para qué servicio necesitas ayuda?</Text>
            {vm.professionalServices?.map(svc => (
              <TouchableOpacity 
                key={svc.id} 
                style={styles.serviceOption}
                onPress={() => {
                  setShowServicePicker(false);
                  vm.requestJob(svc.id);
                }}
              >
                <Text style={styles.serviceOptionProfession}>{svc.profesion}</Text>
                <Text style={styles.serviceOptionCategory}>{svc.categoria}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.cancelModalBtn} onPress={() => setShowServicePicker(false)}>
              <Text style={styles.cancelModalText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  container: { flex: 1, backgroundColor: "#F6F6F8" },
  header: { backgroundColor: PURPLE, paddingHorizontal: 16, justifyContent: 'center' },
  headerContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' },
  listContainer: { flex: 1, backgroundColor: "#F6F6F8" },
  headerTitle: { color: 'white', fontSize: 16, fontWeight: 'bold', flex: 1, marginRight: 10, textAlign: 'center' },
  reportHeaderBtn: { padding: 4 },

  bannerContainer: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ECECF1' },
  bannerPending: { backgroundColor: '#fff3cd', flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerActive: { backgroundColor: '#d4edda', flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerTextWarning: { color: '#856404', fontWeight: 'bold', flex: 1 },
  bannerTextSuccess: { color: '#155724', fontWeight: 'bold' },
  bannerTitle: { fontSize: 16, fontWeight: 'bold', color: '#333', marginBottom: 8, textAlign: 'center' },
  serviceTag: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F0E6FA', alignSelf: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, gap: 6, marginBottom: 12 },
  serviceTagText: { color: PURPLE, fontWeight: 'bold', fontSize: 13 },

  actionButton: { backgroundColor: PURPLE, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 14, borderRadius: 12, gap: 8 },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },

  reviewButton: { backgroundColor: '#FFB800', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 12, gap: 8, marginTop: 12 },
  reviewButtonText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
  completedInfo: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },

  actionRow: { flexDirection: 'row', gap: 12 },
  proButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnAccept: { backgroundColor: PURPLE },
  btnReject: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#dc3545' },
  btnFinish: { backgroundColor: '#28a745' },
  btnAcceptText: { color: 'white', fontWeight: 'bold' },
  btnRejectText: { color: '#dc3545', fontWeight: 'bold' },

  messagesList: { paddingHorizontal: 12, paddingVertical: 8, flexGrow: 1 },
  messagesEmpty: { justifyContent: 'center', alignItems: 'center' },
  emptyChat: { alignItems: 'center', gap: 8 },
  emptyChatText: { color: '#999', fontSize: 14 },

  msgRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#ECECF1' },
  msgText: { fontSize: 15, color: '#333', lineHeight: 20 },
  msgTextMe: { color: 'white' },
  msgTime: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },

  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingTop: 8, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#ECECF1', gap: 8 },
  textInput: { flex: 1, backgroundColor: '#F6F6F8', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100, color: '#333' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },

  lockedInputBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ECECF1', gap: 8 },
  lockedText: { color: '#999', fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  serviceOption: { padding: 16, backgroundColor: '#F6F6F8', borderRadius: 12, marginBottom: 12 },
  serviceOptionProfession: { fontSize: 16, fontWeight: 'bold', color: PURPLE },
  serviceOptionCategory: { fontSize: 13, color: '#666', marginTop: 4 },
  cancelModalBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelModalText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 }
});
