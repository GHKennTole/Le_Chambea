import React, { useState, useRef, useCallback, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, FlatList, Animated, Platform, Image } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useChatController, Message } from "../controllers/useChatController";
import { isSameDay, formatChatDividerDate } from "../../../shared/utils/dateUtils";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { useKeyboardAdjustment } from "../../../shared/hooks/useKeyboardAdjustment";

const PURPLE = "#5A2D82";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const { keyboardVisible, keyboardOffset, animatedPaddingBottom, viewportHeight } = useKeyboardAdjustment();
  const { chatId, otherUserId } = route.params;
  const vm = useChatController(chatId, otherUserId);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportInputHeight, setReportInputHeight] = useState(100);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [text, setText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll al final del chat cuando se abre el teclado o llegan nuevos mensajes
  useEffect(() => {
    if (keyboardVisible || keyboardOffset > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [keyboardVisible, keyboardOffset, vm.messages.length]);

  const canChat = true;

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.remitente_id === vm.currentUser?.id;
    const prevMessage = index > 0 ? vm.messages[index - 1] : null;
    const showDateDivider = !prevMessage || !isSameDay(item.fecha_creacion, prevMessage.fecha_creacion);

    return (
      <View key={item.id}>
        {showDateDivider && (
          <View style={styles.dateDividerContainer}>
            <View style={styles.dateDividerBadge}>
              <Text style={styles.dateDividerText}>
                {formatChatDividerDate(item.fecha_creacion)}
              </Text>
            </View>
          </View>
        )}
        <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
          <View style={[styles.msgBubble, isMe ? styles.msgBubbleMe : styles.msgBubbleOther]}>
            <Text style={[styles.msgText, isMe && styles.msgTextMe]}>{item.contenido}</Text>
            <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
              {new Date(item.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </View>
    );
  }, [vm.currentUser?.id, vm.messages]);

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
            {!vm.isReviewed ? (
              <TouchableOpacity style={styles.reviewButton} onPress={vm.leaveReview}>
                <MaterialCommunityIcons name="star" size={16} color="white" />
                <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.reviewButton, { backgroundColor: PURPLE }]} onPress={vm.leaveReview}>
                <MaterialCommunityIcons name="square-edit-outline" size={16} color="white" />
                <Text style={styles.reviewButtonText}>Editar Reseña</Text>
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
      <View style={[
        styles.lockedInputBar, 
        { paddingBottom: (keyboardVisible || keyboardOffset > 0) ? 8 : (isLargeScreen ? 12 : Math.max(insets.bottom, 8)) }
      ]}>
        <MaterialCommunityIcons name="lock" size={18} color="#999" />
        <Text style={styles.lockedText}>{lockMessage}</Text>
      </View>
    );
  };

  const handleOpenReportModal = () => {
    setReportReason("");
    setReportInputHeight(100);
    setShowReportModal(true);
  };

  const handleConfirmReport = async () => {
    if (!reportReason.trim() || submittingReport) return;
    setSubmittingReport(true);
    const success = await vm.reportIncongruency(reportReason.trim());
    setSubmittingReport(false);
    if (success) {
      setShowReportModal(false);
      setReportReason("");
      setReportInputHeight(100);
    }
  };

  const isKbActive = keyboardVisible || keyboardOffset > 0;
  const headerTopPadding = isLargeScreen ? 8 : insets.top + 4;
  const headerTotalHeight = isLargeScreen ? 64 : 60 + insets.top;

  return (
    <View 
      style={[
        styles.container,
        Platform.OS === 'web' && viewportHeight ? { height: viewportHeight } : null
      ]}
    >
      <View style={[styles.chatCardWrapper, isLargeScreen && styles.chatCardWrapperLarge]}>
        {/* Cabecera del Chat - 100% FIJA E INMÓVIL EN LA PARTE SUPERIOR */}
        <View style={[
          styles.header, 
          isLargeScreen 
            ? styles.headerLarge 
            : { paddingTop: headerTopPadding, paddingBottom: 4, height: headerTotalHeight }
        ]}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backHeaderBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.userInfoContainer}
              activeOpacity={0.8}
              onPress={() => navigation.navigate("PublicProfile", { id: otherUserId, fromChat: true })}
            >
              {vm.otherUser?.foto_perfil ? (
                <Image
                  source={{ uri: vm.otherUser.foto_perfil }}
                  style={styles.headerAvatar}
                />
              ) : (
                <View style={styles.headerAvatarPlaceholder}>
                  <Text style={styles.headerAvatarInitials}>
                    {vm.otherUser ? `${vm.otherUser.nombre?.[0] || ''}${vm.otherUser.apellidos?.[0] || ''}`.toUpperCase() : 'U'}
                  </Text>
                </View>
              )}
              <View style={styles.headerTextCol}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {vm.otherUser ? `${vm.otherUser.nombre} ${vm.otherUser.apellidos}`.trim() : 'Usuario'}
                </Text>
                <Text style={styles.headerSubtitleText} numberOfLines={1}>
                  {vm.activeJob?.perfiles_profesionales?.profesion 
                    ? vm.activeJob.perfiles_profesionales.profesion 
                    : 'Toca para ver perfil'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleOpenReportModal} 
              style={styles.reportHeaderBtn} 
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#FFA8A8" />
            </TouchableOpacity>
          </View>
        </View>

        {renderJobBanner()}

        {/* Zona dinámica de mensajes y cuadro de texto que sube suavemente con el teclado */}
        <Animated.View style={[styles.chatBody, { paddingBottom: animatedPaddingBottom }]}>
          {/* Lista de Mensajes */}
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
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <MaterialCommunityIcons name="chat-outline" size={48} color="#DDD" />
                  <Text style={styles.emptyChatText}>
                    {canChat ? "Envía el primer mensaje" : "No hay mensajes aún"}
                  </Text>
                </View>
              }
              onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
              onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            />
          </View>

          {/* Barra de Entrada de Texto */}
          {canChat ? (
            <View style={[
              styles.inputBar, 
              { 
                paddingBottom: isKbActive ? 8 : (isLargeScreen ? 12 : Math.max(insets.bottom, 8)) 
              }
            ]}>
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
                activeOpacity={0.8}
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
        </Animated.View>
      </View>

      {/* Modal Selección de Servicio */}
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

      {/* Modal: 🚨 Reportar Chat */}
      <Modal visible={showReportModal} transparent animationType="fade" onRequestClose={() => !submittingReport && setShowReportModal(false)}>
        <View style={styles.reportModalOverlay}>
          <TouchableOpacity 
            style={styles.reportModalBackdrop} 
            activeOpacity={1} 
            onPress={() => {
              if (!submittingReport) {
                setShowReportModal(false);
                setReportReason("");
                setReportInputHeight(100);
              }
            }} 
          />
          <View style={styles.reportModalCard}>
            {/* Cabecera del modal con emoji 🚨 */}
            <View style={styles.reportModalHeader}>
              <View style={styles.reportIconCircle}>
                <Text style={styles.reportAlertEmoji}>🚨</Text>
              </View>
              <Text style={styles.reportModalTitle}>Reportar Chat</Text>
              <Text style={styles.reportModalSubtitle}>
                Cuéntanos qué sucedió con {vm.otherUser ? `${vm.otherUser.nombre}` : 'este usuario'}. Tu reporte será revisado de forma confidencial por la administración.
              </Text>
            </View>

            {/* Motivos sugeridos rápidos */}
            <Text style={styles.reportQuickLabel}>Motivos sugeridos:</Text>
            <View style={styles.reportQuickChipsRow}>
              {[
                "⚠️ Comportamiento Inapropiado",
                "🚫 Intento de Fraude",
                "💬 Lenguaje Ofensivo",
                "📦 Incongruencia de Trabajo"
              ].map((chip, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.reportQuickChip}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (!reportReason.includes(chip)) {
                      setReportReason((prev) => prev ? `${prev}\n• ${chip}` : `• ${chip}: `);
                    }
                  }}
                >
                  <Text style={styles.reportQuickChipText}>{chip}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Cuadro de texto auto-expandible */}
            <View style={styles.reportInputWrapper}>
              <TextInput
                style={[styles.reportTextInput, { height: reportInputHeight }]}
                placeholder="Describe detalladamente las razones de tu reporte..."
                placeholderTextColor="#999"
                value={reportReason}
                onChangeText={setReportReason}
                multiline
                numberOfLines={4}
                maxLength={500}
                textAlignVertical="top"
                onContentSizeChange={(e) => {
                  const h = e.nativeEvent.contentSize.height;
                  setReportInputHeight(Math.max(100, Math.min(200, h + 24)));
                }}
              />
              <Text style={styles.reportCharCount}>{reportReason.length}/500</Text>
            </View>

            {/* Botones de acción */}
            <View style={styles.reportActionsRow}>
              <TouchableOpacity
                style={styles.reportCancelBtn}
                disabled={submittingReport}
                onPress={() => {
                  setShowReportModal(false);
                  setReportReason("");
                  setReportInputHeight(100);
                }}
              >
                <Text style={styles.reportCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.reportSubmitBtn,
                  (!reportReason.trim() || submittingReport) && styles.reportSubmitBtnDisabled
                ]}
                disabled={!reportReason.trim() || submittingReport}
                onPress={handleConfirmReport}
                activeOpacity={0.8}
              >
                {submittingReport ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="send" size={16} color="white" />
                    <Text style={styles.reportSubmitBtnText}>Enviar Reporte</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  container: { 
    flex: 1, 
    height: '100%',
    maxHeight: '100%',
    overflow: 'hidden',
    backgroundColor: "#F6F6F8" 
  },
  chatCardWrapper: {
    flex: 1,
    height: '100%',
    overflow: 'hidden',
    width: '100%',
    backgroundColor: '#F6F6F8',
  },
  chatCardWrapperLarge: {
    maxWidth: 960,
    alignSelf: 'center',
    backgroundColor: 'white',
    borderRadius: 20,
    marginVertical: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 8px 24px rgba(0,0,0,0.08)' } as any,
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      }
    })
  },
  header: { 
    backgroundColor: PURPLE, 
    paddingHorizontal: 8, 
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)'
  },
  headerLarge: {
    height: 64,
    paddingTop: 8,
    paddingBottom: 8,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    width: '100%',
    height: '100%'
  },
  backHeaderBtn: { 
    padding: 8,
    marginRight: 4
  },
  userInfoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1 
  },
  headerAvatar: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  headerAvatarPlaceholder: { 
    width: 38, 
    height: 38, 
    borderRadius: 19, 
    backgroundColor: '#EDE7F6', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)'
  },
  headerAvatarInitials: {
    color: PURPLE,
    fontSize: 14,
    fontWeight: '900',
  },
  headerTextCol: {
    flex: 1,
    justifyContent: 'center',
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 15, 
    fontWeight: 'bold', 
  },
  headerSubtitleText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  reportHeaderBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    backgroundColor: 'rgba(255, 255, 255, 0.15)', 
    borderWidth: 1, 
    borderColor: 'rgba(255, 255, 255, 0.25)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: 8,
  },
  chatBody: {
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
    width: '100%',
    backgroundColor: '#F6F6F8',
  },
  listContainer: { 
    flex: 1, 
    minHeight: 0,
    overflow: 'hidden',
    backgroundColor: "#F6F6F8" 
  },

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

  dateDividerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerBadge: {
    backgroundColor: '#EAE6F0',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DFDAE6',
    ...Platform.select({
      web: { boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.04)' } as any,
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B3869',
    letterSpacing: 0.2,
  },

  msgRow: { flexDirection: 'row', marginBottom: 8, justifyContent: 'flex-start' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgBubble: { maxWidth: '75%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
  msgBubbleMe: { backgroundColor: PURPLE, borderBottomRightRadius: 4 },
  msgBubbleOther: { backgroundColor: 'white', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#ECECF1' },
  msgText: { fontSize: 15, color: '#333', lineHeight: 20 },
  msgTextMe: { color: 'white' },
  msgTime: { fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)' },

  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 12, 
    paddingTop: 8, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#ECECF1', 
    gap: 8 
  },
  textInput: { 
    flex: 1, 
    backgroundColor: '#F6F6F8', 
    borderRadius: 20, 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    fontSize: 15, 
    maxHeight: 120, 
    color: '#333',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { opacity: 0.5 },

  lockedInputBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingHorizontal: 16, 
    paddingTop: 12, 
    backgroundColor: '#F0F0F0', 
    borderTopWidth: 1, 
    borderTopColor: '#ECECF1', 
    gap: 8 
  },
  lockedText: { color: '#999', fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  serviceOption: { padding: 16, backgroundColor: '#F6F6F8', borderRadius: 12, marginBottom: 12 },
  serviceOptionProfession: { fontSize: 16, fontWeight: 'bold', color: PURPLE },
  serviceOptionCategory: { fontSize: 13, color: '#666', marginTop: 4 },
  cancelModalBtn: { padding: 16, alignItems: 'center', marginTop: 8 },
  cancelModalText: { color: '#dc3545', fontWeight: 'bold', fontSize: 16 },

  // Estilos del Modal de Reportar Chat 🚨
  reportModalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 16 
  },
  reportModalBackdrop: { 
    ...StyleSheet.absoluteFillObject 
  },
  reportModalCard: { 
    backgroundColor: 'white', 
    borderRadius: 24, 
    padding: 22, 
    width: '100%', 
    maxWidth: 480, 
    ...Platform.select({ 
      web: { boxShadow: '0px 10px 30px rgba(0,0,0,0.2)' } as any, 
      default: { 
        elevation: 6, 
        shadowColor: '#000', 
        shadowOffset: { width: 0, height: 6 }, 
        shadowOpacity: 0.2, 
        shadowRadius: 10 
      } 
    }) 
  },
  reportModalHeader: { 
    alignItems: 'center', 
    marginBottom: 14 
  },
  reportIconCircle: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#FEE2E2', 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  reportAlertEmoji: { 
    fontSize: 22 
  },
  reportModalTitle: { 
    fontSize: 19, 
    fontWeight: '900', 
    color: '#1F2937', 
    marginBottom: 4, 
    textAlign: 'center' 
  },
  reportModalSubtitle: { 
    fontSize: 12.5, 
    color: '#6B7280', 
    textAlign: 'center', 
    lineHeight: 18, 
    paddingHorizontal: 6 
  },
  reportQuickLabel: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#888', 
    marginBottom: 6, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  reportQuickChipsRow: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6, 
    marginBottom: 12 
  },
  reportQuickChip: { 
    backgroundColor: '#F3F4F6', 
    paddingHorizontal: 10, 
    paddingVertical: 5, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: '#E5E7EB' 
  },
  reportQuickChipText: { 
    fontSize: 11, 
    color: '#4B5563', 
    fontWeight: '600' 
  },
  reportInputWrapper: { 
    marginBottom: 14 
  },
  reportTextInput: { 
    backgroundColor: '#F9FAFB', 
    borderRadius: 14, 
    borderWidth: 1.5, 
    borderColor: '#E5E7EB', 
    padding: 12, 
    fontSize: 14, 
    color: '#1F2937',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  reportCharCount: { 
    alignSelf: 'flex-end', 
    fontSize: 11, 
    color: '#9CA3AF', 
    marginTop: 4, 
    marginRight: 4 
  },
  reportActionsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    marginTop: 4 
  },
  reportCancelBtn: { 
    flex: 1, 
    paddingVertical: 13, 
    borderRadius: 12, 
    backgroundColor: '#F3F4F6', 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  reportCancelBtnText: { 
    fontSize: 14, 
    fontWeight: '700', 
    color: '#4B5563' 
  },
  reportSubmitBtn: { 
    flex: 1.4, 
    paddingVertical: 13, 
    borderRadius: 12, 
    backgroundColor: '#DC2626', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6 
  },
  reportSubmitBtnDisabled: { 
    backgroundColor: '#FCA5A5', 
    opacity: 0.7 
  },
  reportSubmitBtnText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: 'white' 
  }
});
