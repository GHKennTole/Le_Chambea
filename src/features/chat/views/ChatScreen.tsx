import React, { useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Modal, TextInput, FlatList, KeyboardAvoidingView, Platform, Alert, Image, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useChatController, Message } from "../controllers/useChatController";
import { isSameDay, formatChatDividerDate } from "../../../shared/utils/dateUtils";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import MainLayout from "../../../shared/components/MainLayout";
import ReportChatModal from "../../../shared/components/ReportChatModal";
import SimpleActionModal from "../../../shared/components/SimpleActionModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PURPLE = "#5A2D82";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export default function ChatScreen({ route, navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, isLargeScreen } = useResponsive();
  const ContainerComponent = View;
  const { chatId, otherUserId } = route.params;
  const vm = useChatController(chatId, otherUserId);
  const [showServicePicker, setShowServicePicker] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showHireModal, setShowHireModal] = useState(false);
  const [selectedServiceToHire, setSelectedServiceToHire] = useState<any>(null);
  const [showAbortModal, setShowAbortModal] = useState(false);
  const [actionModal, setActionModal] = useState<{
    visible: boolean;
    title: string;
    subtitle: string;
    confirmText: string;
    cancelText?: string;
    confirmType: "danger" | "primary" | "success";
    iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
    onConfirm: () => Promise<void> | void;
  } | null>(null);
  const [text, setText] = useState("");
  const [chatInputHeight, setChatInputHeight] = useState(44);
  const flatListRef = useRef<FlatList>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [webHeight, setWebHeight] = useState<number | null>(null);
  const [dismissedCompletedJobId, setDismissedCompletedJobId] = useState<string | null>(null);
  const prevMessagesCountRef = useRef(vm.messages.length);

  React.useEffect(() => {
    if (vm.messages.length > prevMessagesCountRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 60);
    }
    prevMessagesCountRef.current = vm.messages.length;
  }, [vm.messages.length]);

  React.useEffect(() => {
    if (vm.activeJob?.id && vm.activeJob.estado === 'completed') {
      AsyncStorage.getItem(`dismissed_completed_${vm.activeJob.id}`).then((val) => {
        if (val === 'true') {
          setDismissedCompletedJobId(vm.activeJob!.id);
        }
      });
    }
  }, [vm.activeJob?.id, vm.activeJob?.estado]);

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    // Web visualViewport detection to lock container height on mobile browsers
    let handleViewportResize: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleViewportResize = () => {
        const h = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        setWebHeight(h);
        const isKb = !isLargeScreen && ((window.innerHeight - h > 120) || (typeof window.screen !== 'undefined' && window.screen.height - h > 200 && h < window.innerHeight * 0.85));
        setKeyboardVisible(isKb);
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      };

      handleViewportResize();

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window.visualViewport.addEventListener('scroll', handleViewportResize);
      }
      window.addEventListener('resize', handleViewportResize);
      window.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && handleViewportResize) {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
          window.visualViewport.removeEventListener('scroll', handleViewportResize);
        }
        window.removeEventListener('resize', handleViewportResize);
        window.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, [isLargeScreen]);

  const canChat = true;

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.remitente_id === vm.currentUser?.id;
    const prevMessage = index > 0 ? vm.messages[index - 1] : null;
    const showDateDivider = !prevMessage || !isSameDay(item.fecha_creacion, prevMessage.fecha_creacion);
    const isSending = item.id.startsWith('temp-');

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
            <View style={styles.msgFooterRow}>
              <Text style={[styles.msgTime, isMe && styles.msgTimeMe]}>
                {new Date(item.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {isMe && (
                <MaterialCommunityIcons 
                  name={isSending ? "clock-outline" : "check"} 
                  size={12} 
                  color={isSending ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.9)"} 
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  }, [vm.currentUser?.id, vm.messages]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const msg = text;
    setText("");
    setChatInputHeight(44);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 40);
    await vm.sendMessage(msg);
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.shiftKey) {
      e.preventDefault?.();
      handleSend();
    }
  };

  const handleFocus = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo(0, 0);
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
      setTimeout(() => {
        window.scrollTo(0, 0);
      }, 200);
    }
  };

  const handleHirePress = () => {
    if (vm.professionalServices && vm.professionalServices.length === 1) {
      setSelectedServiceToHire(vm.professionalServices[0]);
      setShowHireModal(true);
    } else {
      setShowServicePicker(true);
    }
  };

  const handleAbortJob = () => {
    if (!vm.activeJob) return;
    setShowAbortModal(true);
  };

  const handleRejectJob = () => {
    if (!vm.activeJob) return;
    setActionModal({
      visible: true,
      title: "Rechazar solicitud",
      subtitle: "¿Deseas rechazar esta solicitud de contratación?",
      confirmText: "Sí, rechazar",
      cancelText: "Volver",
      confirmType: "danger",
      iconName: "close",
      onConfirm: async () => {
        if (vm.activeJob) {
          await vm.rejectJobRequest(vm.activeJob.id);
        }
        setActionModal(null);
      },
    });
  };

  const handleCancelPendingRequest = () => {
    if (!vm.activeJob) return;
    setActionModal({
      visible: true,
      title: "Cancelar solicitud",
      subtitle: "¿Deseas cancelar tu solicitud de contratación?",
      confirmText: "Sí, cancelar",
      cancelText: "Volver",
      confirmType: "danger",
      iconName: "close-circle-outline",
      onConfirm: async () => {
        if (vm.activeJob) {
          await vm.cancelPendingRequest(vm.activeJob.id);
        }
        setActionModal(null);
      },
    });
  };

  const handleAcceptCancellation = () => {
    if (!vm.activeJob) return;
    vm.acceptJobCancellation(vm.activeJob.id);
  };

  const handleRequestReview = () => {
    if (!vm.activeJob) return;
    vm.requestCaseReview(vm.activeJob.id);
  };

  const handleFinishJob = () => {
    if (!vm.activeJob) return;
    setActionModal({
      visible: true,
      title: "Finalizar tarea",
      subtitle: "¿Confirmas que has completado el trabajo?",
      confirmText: "Sí, finalizar",
      cancelText: "Cancelar",
      confirmType: "primary",
      iconName: "check-all",
      onConfirm: async () => {
        if (vm.activeJob) {
          await vm.updateJobStatus(vm.activeJob.id, 'completed');
        }
        setActionModal(null);
      },
    });
  };

  const handleDismissCompletedNotice = async () => {
    if (!vm.activeJob?.id) return;
    const jobId = vm.activeJob.id;
    setDismissedCompletedJobId(jobId);
    try {
      await AsyncStorage.setItem(`dismissed_completed_${jobId}`, 'true');
    } catch (e) {
      console.error('Error dismissing completed job notice:', e);
    }
  };

  const handleAcceptJob = () => {
    if (!vm.activeJob) return;
    vm.updateJobStatus(vm.activeJob.id, 'accepted');
  };

  const renderJobBanner = () => {
    if (vm.loading) return null;

    // Caso: Solicitud cancelada por el cliente antes de ser aceptada o rechazada (no mostrar nada a ninguno)
    if (vm.activeJob?.estado === 'cancelled') {
      if (vm.isClient) {
        return (
          <View style={styles.bannerContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
              <MaterialCommunityIcons name="briefcase-plus" size={19} color="white" />
              <Text style={styles.actionButtonText}>Contratar</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    }

    // Caso: El servicio está en estado 'rejected' (abortado / cancelado)
    if (vm.activeJob?.estado === 'rejected') {
      // Caso de rechazo de solicitud inicial (no un aborto de servicio en curso):
      if (vm.abortInfo?.isInitialRejection) {
        if (!vm.abortInfo?.hasDismissedNotice) {
          if (vm.isProfessional) {
            return (
              <View style={[styles.bannerContainer, styles.bannerRejectedNotice]}>
                <View style={styles.appealStatusHeader}>
                  <MaterialCommunityIcons name="close-circle-outline" size={18} color="#dc3545" />
                  <Text style={[styles.bannerRejectedTitle, { color: '#dc3545' }]}>Has rechazado esta solicitud</Text>
                </View>
                <Text style={styles.appealStatusDesc}>
                  Rechazaste la solicitud de contratación de este servicio.
                </Text>
                <TouchableOpacity 
                  style={styles.btnDismissReview}
                  onPress={() => vm.dismissJobNotice(vm.activeJob!.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={15} color="white" />
                  <Text style={styles.btnDismissReviewText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            );
          }

          if (vm.isClient) {
            return (
              <View style={[styles.bannerContainer, styles.bannerRejectedNotice]}>
                <View style={styles.appealStatusHeader}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#dc3545" />
                  <Text style={[styles.bannerRejectedTitle, { color: '#dc3545' }]}>Tu solicitud fue rechazada</Text>
                </View>
                <Text style={styles.appealStatusDesc}>
                  El profesional no pudo aceptar tu solicitud en este momento.
                </Text>
                <TouchableOpacity 
                  style={styles.btnDismissReview}
                  onPress={() => vm.dismissJobNotice(vm.activeJob!.id)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={15} color="white" />
                  <Text style={styles.btnDismissReviewText}>Aceptar</Text>
                </TouchableOpacity>
              </View>
            );
          }
        }

        // Si ya descartó el aviso de rechazo:
        if (vm.isClient) {
          return (
            <View style={styles.bannerContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
                <MaterialCommunityIcons name="briefcase-plus" size={19} color="white" />
                <Text style={styles.actionButtonText}>Contratar</Text>
              </TouchableOpacity>
            </View>
          );
        }
        return null; // Para el profesional: chat limpio sin banner
      }

      // 1. Si la contraparte canceló el servicio:
      if (!vm.abortInfo?.isAbortedByMe) {
        // A) Caso inicial: la contraparte canceló, botones: Aceptar o Solicitar revisar caso
        if (!vm.abortInfo?.hasAccepted && !vm.abortInfo?.hasRequestedReview) {
          return (
            <View style={styles.counterpartAbortContainer}>
              <View style={styles.counterpartAbortHeader}>
                <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#dc3545" />
                <Text style={styles.counterpartAbortTitle}>
                  El servicio fue cancelado
                </Text>
              </View>
              <Text style={styles.counterpartInstructions}>
                {vm.otherUser ? `${vm.otherUser.nombre}` : 'La otra parte'} ha cancelado el servicio. Puedes aceptar la cancelación o solicitar revisar el caso al administrador.
              </Text>
              <View style={styles.actionRow}>
                <TouchableOpacity 
                  style={[styles.proButton, styles.btnAcceptCancellation]} 
                  onPress={handleAcceptCancellation}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="check" size={18} color="white" />
                  <Text style={styles.btnAcceptCancellationText}>Aceptar</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.proButton, styles.btnAppeal]} 
                  onPress={handleRequestReview}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="shield-search" size={18} color="white" />
                  <Text style={styles.btnAppealText}>Solicitar revisar caso</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }

        // B) Si ya solicitó revisión y no lo ha descartado:
        if (vm.abortInfo?.hasRequestedReview && !vm.abortInfo?.hasDismissedReview) {
          return (
            <View style={[styles.bannerContainer, styles.bannerAppealSubmitted]}>
              <View style={styles.appealStatusHeader}>
                <MaterialCommunityIcons name="shield-search" size={18} color={PURPLE} />
                <Text style={styles.appealStatusText}>Revisión de caso solicitada al administrador</Text>
              </View>
              <Text style={styles.appealStatusDesc}>
                Se notificó al administrador para que revise el caso de este servicio cancelado.
              </Text>
              <TouchableOpacity 
                style={styles.btnDismissReview}
                onPress={() => vm.dismissReviewNotice(vm.activeJob!.id)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="check" size={15} color="white" />
                <Text style={styles.btnDismissReviewText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          );
        }

        // Si ya descartó el aviso de revisión:
        if (vm.abortInfo?.hasRequestedReview && vm.abortInfo?.hasDismissedReview) {
          if (vm.isClient) {
            return (
              <View style={styles.bannerContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="briefcase-plus" size={19} color="white" />
                  <Text style={styles.actionButtonText}>Contratar de nuevo</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        }

        // C) Si ya aceptó la cancelación: no sale nada más (botón de contratar para el cliente o chat limpio para el profesional)
        if (vm.abortInfo?.hasAccepted) {
          if (vm.isClient) {
            return (
              <View style={styles.bannerContainer}>
                <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
                  <MaterialCommunityIcons name="briefcase-plus" size={18} color="white" />
                  <Text style={styles.actionButtonText}>Contratar de nuevo</Text>
                </TouchableOpacity>
              </View>
            );
          }
          return null;
        }
      }

      // 2. Si fui yo quien abortó el servicio:
      if (!vm.abortInfo?.hasDismissedNotice) {
        return (
          <View style={[styles.bannerContainer, styles.bannerAbortedByMe]}>
            <View style={styles.abortedByMeHeader}>
              <MaterialCommunityIcons name="close-circle-outline" size={20} color="#dc3545" />
              <Text style={styles.bannerTextDanger}>Has cancelado este servicio</Text>
            </View>
            <Text style={styles.counterpartInstructions}>
              Hacer demasiados abortos o sin justificación puede hacer que tu cuenta sea suspendida.
            </Text>
            <TouchableOpacity 
              style={styles.btnDismissReview}
              onPress={() => vm.dismissJobNotice(vm.activeJob!.id)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={15} color="white" />
              <Text style={styles.btnDismissReviewText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        );
      }

      if (vm.isClient) {
        return (
          <View style={styles.bannerContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
              <MaterialCommunityIcons name="briefcase-plus" size={18} color="white" />
              <Text style={styles.actionButtonText}>Contratar de nuevo</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return null;
    }

    if (vm.isClient) {
      // 1. Cliente sin trabajo activo: muestra botón de Contratar
      if (!vm.activeJob) {
        return (
          <View style={styles.bannerContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
              <MaterialCommunityIcons name="briefcase-plus" size={19} color="white" />
              <Text style={styles.actionButtonText}>Contratar</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // 2. Cliente con solicitud pendiente de respuesta del profesional
      if (vm.activeJob.estado === 'pending') {
        return (
          <View style={[styles.bannerContainer, styles.bannerPending]}>
            <View style={styles.pendingTextContainer}>
              <MaterialCommunityIcons name="clock-outline" size={18} color="#856404" />
              <Text style={styles.bannerTextWarning}>Esperando respuesta del profesional...</Text>
            </View>
            <TouchableOpacity style={styles.btnAbortSmall} onPress={handleCancelPendingRequest} activeOpacity={0.7}>
              <Text style={styles.btnAbortSmallText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        );
      }

      // 3. Cliente con trabajo aceptado (en curso): puede abortar el servicio, pero no finalizarlo
      if (vm.activeJob.estado === 'accepted') {
        return (
          <View style={styles.bannerContainer}>
            <View style={styles.activeJobHeaderRow}>
              <View style={styles.activeJobStatusBadge}>
                <MaterialCommunityIcons name="briefcase-check" size={16} color="#155724" />
                <Text style={styles.activeJobStatusText}>Trabajo en curso</Text>
              </View>
              {vm.activeJob?.perfiles_profesionales && (
                <View style={styles.serviceTagInline}>
                  <MaterialCommunityIcons name="hammer-wrench" size={13} color={PURPLE} />
                  <Text style={styles.serviceTagInlineText}>{vm.activeJob.perfiles_profesionales.profesion}</Text>
                </View>
              )}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.proButton, styles.btnReject]} onPress={handleAbortJob} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="white" />
                <Text style={styles.btnRejectText}>Abortar servicio</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // 4. Cliente con trabajo completado
      if (vm.activeJob.estado === 'completed') {
        if (vm.isReviewed) {
          return (
            <View style={styles.bannerContainer}>
              <TouchableOpacity style={styles.actionButton} onPress={handleHirePress} activeOpacity={0.8}>
                <MaterialCommunityIcons name="briefcase-plus" size={18} color="white" />
                <Text style={styles.actionButtonText}>Contratar de nuevo</Text>
              </TouchableOpacity>
            </View>
          );
        }

        return (
          <View style={styles.bannerContainer}>
            <View style={styles.completedInfo}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#155724" />
              <Text style={styles.bannerTextSuccess}>¡Trabajo terminado!</Text>
            </View>
            <TouchableOpacity style={styles.reviewButton} onPress={vm.leaveReview}>
              <MaterialCommunityIcons name="star" size={16} color="white" />
              <Text style={styles.reviewButtonText}>Dejar Reseña</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, { marginTop: 8 }]} onPress={handleHirePress} activeOpacity={0.8}>
              <MaterialCommunityIcons name="briefcase-plus" size={18} color="white" />
              <Text style={styles.actionButtonText}>Contratar de nuevo</Text>
            </TouchableOpacity>
          </View>
        );
      }
    }

    if (vm.isProfessional) {
      // 1. Profesional sin solicitud o trabajo rechazado (ya manejado arriba): Chat sencillo y limpio sin banner
      if (!vm.activeJob) return null;

      // 2. Profesional recibe solicitud cuando el cliente toca "Contratar": Aceptar o Rechazar
      if (vm.activeJob.estado === 'pending') {
        return (
          <View style={styles.bannerContainer}>
            <Text style={styles.bannerTitle}>¡Solicitud de Contratación!</Text>
            {vm.activeJob?.perfiles_profesionales && (
              <View style={styles.serviceTag}>
                <MaterialCommunityIcons name="briefcase-outline" size={16} color={PURPLE} />
                <Text style={styles.serviceTagText}>{vm.activeJob.perfiles_profesionales.profesion}</Text>
              </View>
            )}
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.proButton, styles.btnReject]} onPress={handleRejectJob} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close" size={18} color="white" />
                <Text style={styles.btnRejectText}>Rechazar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.proButton, styles.btnAccept]} onPress={handleAcceptJob} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check" size={18} color="white" />
                <Text style={styles.btnAcceptText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // 3. Profesional con trabajo en curso: puede abortar el servicio O finalizar la tarea
      if (vm.activeJob.estado === 'accepted') {
        return (
          <View style={styles.bannerContainer}>
            <View style={styles.activeJobHeaderRow}>
              <View style={styles.activeJobStatusBadge}>
                <MaterialCommunityIcons name="briefcase-check" size={16} color="#155724" />
                <Text style={styles.activeJobStatusText}>Trabajo en curso</Text>
              </View>
              {vm.activeJob?.perfiles_profesionales && (
                <View style={styles.serviceTagInline}>
                  <MaterialCommunityIcons name="hammer-wrench" size={13} color={PURPLE} />
                  <Text style={styles.serviceTagInlineText}>{vm.activeJob.perfiles_profesionales.profesion}</Text>
                </View>
              )}
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.proButton, styles.btnReject]} onPress={handleAbortJob} activeOpacity={0.8}>
                <MaterialCommunityIcons name="close-circle-outline" size={18} color="white" />
                <Text style={styles.btnRejectText}>Abortar servicio</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.proButton, styles.btnFinish]} onPress={handleFinishJob} activeOpacity={0.8}>
                <MaterialCommunityIcons name="check-all" size={18} color="white" />
                <Text style={styles.btnAcceptText}>Finalizar tarea</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }

      // 4. Profesional con trabajo completado
      if (vm.activeJob.estado === 'completed') {
        if (dismissedCompletedJobId === vm.activeJob.id) {
          return null;
        }

        return (
          <View style={[styles.bannerContainer, styles.bannerActive]}>
            <View style={styles.bannerActiveContent}>
              {!vm.isReviewed && (
                <MaterialCommunityIcons 
                  name="check-circle" 
                  size={20} 
                  color="#155724" 
                />
              )}
              <Text style={styles.bannerTextSuccess} numberOfLines={2}>
                {vm.isReviewed 
                  ? "El cliente ya calificó el trabajo realizado ⭐" 
                  : "Trabajo completado, esperando reseña..."}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={handleDismissCompletedNotice}
              style={styles.closeCompletedBannerBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="close" size={20} color="#000000" />
            </TouchableOpacity>
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

  const handleOpenReportModal = () => {
    setShowReportModal(true);
  };

  return (
    <MainLayout active="ChatList" hideBottomNav={true}>
      <ContainerComponent 
        style={[
          styles.container,
          !isLargeScreen && { paddingTop: insets.top },
          Platform.OS !== 'web' && {
            paddingBottom: keyboardHeight > 0 ? (keyboardHeight + (Platform.OS === 'android' && insets.bottom > 0 ? insets.bottom : 0)) : 0,
          },
          Platform.OS === 'web' && ({
            position: (!isLargeScreen && keyboardVisible) ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : '100dvh') : '100%',
            maxHeight: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : '100dvh') : '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: (!isLargeScreen && keyboardVisible) ? 100 : 1,
          } as any)
        ]}
      >
        <View style={[
          styles.header, 
          { 
            paddingTop: isLargeScreen ? 12 : 8, 
            paddingBottom: isLargeScreen ? 12 : 8, 
            height: isLargeScreen ? 64 : 60 
          }
        ]}>
          <View style={styles.headerContent}>
            <TouchableOpacity 
              onPress={() => {
                if (navigation.canGoBack()) {
                  navigation.goBack();
                } else {
                  navigation.navigate("ChatList");
                }
              }} 
              style={styles.backHeaderBtn} 
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
            </TouchableOpacity>

          <TouchableOpacity 
            style={styles.userInfoContainer}
            activeOpacity={vm.isClient ? 0.8 : 1}
            disabled={!vm.isClient}
            onPress={vm.isClient ? () => navigation.navigate("PublicProfile", { 
              id: otherUserId, 
              fromChat: true,
              professionalProfileId: vm.activeJob?.perfil_profesional_id || vm.professionalServices?.[0]?.id 
            }) : undefined}
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
                {vm.isClient ? (vm.proProfession || 'Profesional') : 'Solicitud de servicio'}
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

      <View style={styles.listContainer}>
        <FlatList
          ref={flatListRef}
          data={vm.messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.messagesList, 
            vm.messages.length === 0 && styles.messagesEmpty
          ]}
          ListEmptyComponent={
            vm.loading && !vm.chatInfo && vm.messages.length === 0 ? (
              <View style={[styles.emptyChat, { justifyContent: 'center' }]}>
                <ActivityIndicator size="small" color={PURPLE} />
              </View>
            ) : (
              <View style={styles.emptyChat}>
                <MaterialCommunityIcons name="chat-outline" size={48} color="#DDD" />
                <Text style={styles.emptyChatText}>
                  {canChat ? "Envía el primer mensaje" : "No hay mensajes aún"}
                </Text>
              </View>
            )
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      </View>

      {canChat ? (
        <View style={[styles.inputBar, { paddingBottom: keyboardVisible ? 10 : (insets.bottom > 0 ? insets.bottom : 8) }]}>
          <TextInput
            style={[
              styles.textInput,
              Platform.OS === 'web' && ({
                height: chatInputHeight,
                outlineStyle: 'none',
                resize: 'none',
                overflowY: chatInputHeight >= 120 ? 'auto' : 'hidden',
              } as any)
            ]}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#999"
            value={text}
            onChangeText={(val) => {
              setText(val);
              if (!val.trim()) {
                setChatInputHeight(44);
              }
            }}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent?.contentSize?.height;
              if (h) {
                setChatInputHeight(Math.max(44, Math.min(120, h)));
              }
            }}
            multiline
            maxLength={1000}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            textContentType="none"
            {...(Platform.OS === 'web' ? ({
              'data-autocomplete': 'off',
              'data-form-type': 'other',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              name: 'chat_message_input',
              id: 'chat_message_input',
            } as any) : {})}
            onSubmitEditing={handleSend}
            blurOnSubmit={false}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
          />
          <TouchableOpacity 
            style={[styles.sendButton, (!text.trim() || vm.sending) && styles.sendButtonDisabled]} 
            onPress={handleSend}
            disabled={!text.trim() || vm.sending}
            activeOpacity={0.7}
          >
            {vm.sending ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        renderLockedInput()
      )}


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
                  setSelectedServiceToHire(svc);
                  setShowHireModal(true);
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
      <ReportChatModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        isProfessional={vm.isProfessional}
        otherUserName={vm.otherUser ? `${vm.otherUser.nombre} ${vm.otherUser.apellidos || ''}`.trim() : 'Usuario'}
        chatId={chatId}
        onSubmit={(reason, description) => vm.reportIncongruency(reason, description)}
      />

      {/* Modal: 💼 Confirmar Contratación de Servicio */}
      <SimpleActionModal
        visible={showHireModal}
        onClose={() => {
          setShowHireModal(false);
          setSelectedServiceToHire(null);
        }}
        onConfirm={async () => {
          if (selectedServiceToHire?.id) {
            await vm.requestJob(selectedServiceToHire.id);
            setShowHireModal(false);
            setSelectedServiceToHire(null);
          }
        }}
        title="¿Contratar profesional?"
        subtitle={`Estás a punto de solicitar el inicio formal del servicio con ${vm.otherUser ? `${vm.otherUser.nombre} ${vm.otherUser.apellidos || ''}`.trim() : 'el profesional'}.`}
        badgeText={selectedServiceToHire?.profesion || undefined}
        confirmText="Enviar Solicitud"
        confirmIcon="send"
        confirmType="primary"
        iconName="briefcase-check-outline"
        loading={vm.loading}
      />

      {/* Modal: 🛑 Abortar Servicio con Advertencia */}
      <SimpleActionModal
        visible={showAbortModal}
        onClose={() => setShowAbortModal(false)}
        onConfirm={async () => {
          if (vm.activeJob?.id) {
            await vm.abortJob(vm.activeJob.id);
            setShowAbortModal(false);
          }
        }}
        title="¿Abortar servicio?"
        subtitle="Hacer demasiados abortos o cancelar sin justificación puede ocasionar que tu cuenta sea suspendida."
        confirmText="Sí, abortar"
        confirmType="danger"
        iconName="alert-octagon-outline"
        loading={vm.loading}
      />

      {/* Modal: ⚡ Acción Simple (Cancelar, Rechazar, Finalizar) */}
      {actionModal && (
        <SimpleActionModal
          visible={actionModal.visible}
          onClose={() => setActionModal(null)}
          onConfirm={actionModal.onConfirm}
          title={actionModal.title}
          subtitle={actionModal.subtitle}
          confirmText={actionModal.confirmText}
          cancelText={actionModal.cancelText}
          confirmType={actionModal.confirmType}
          iconName={actionModal.iconName}
          loading={vm.loading}
        />
      )}
    </ContainerComponent>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F6F6F8" },
  container: { 
    flex: 1, 
    backgroundColor: "#F6F6F8",
    ...Platform.select({
      web: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      } as any
    })
  },
  header: { 
    backgroundColor: PURPLE, 
    paddingHorizontal: 8, 
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    zIndex: 10,
    flexShrink: 0,
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
  listContainer: { 
    flex: 1, 
    backgroundColor: "#F6F6F8",
    ...Platform.select({
      web: {
        minHeight: 0,
        overflow: 'hidden',
      } as any
    })
  },

  bannerContainer: { backgroundColor: 'white', padding: 16, borderBottomWidth: 1, borderBottomColor: '#ECECF1' },
  bannerPending: { backgroundColor: '#fff3cd', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  pendingTextContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  btnAbortSmall: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#C62828' },
  btnAbortSmallText: { color: 'white', fontSize: 12, fontWeight: '700' },
  activeJobHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 6 },
  activeJobStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#D4EDDA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  activeJobStatusText: { color: '#155724', fontWeight: 'bold', fontSize: 13 },
  serviceTagInline: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0E6FA', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  serviceTagInlineText: { color: PURPLE, fontWeight: 'bold', fontSize: 12 },
  bannerActive: { backgroundColor: '#d4edda', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12, paddingHorizontal: 16 },
  bannerActiveContent: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  closeCompletedBannerBtn: { padding: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bannerTextWarning: { color: '#856404', fontWeight: 'bold', flex: 1, fontSize: 13 },
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
  btnAccept: { backgroundColor: '#2E7D32' },
  btnReject: { backgroundColor: '#C62828' },
  btnFinish: { backgroundColor: '#2E7D32' },
  btnAcceptText: { color: 'white', fontWeight: 'bold' },
  btnRejectText: { color: 'white', fontWeight: 'bold' },

  // Counterpart abort banner styles
  counterpartAbortContainer: {
    backgroundColor: '#FFF5F5',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7D7',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  counterpartAbortHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  counterpartAbortTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#dc3545',
    flex: 1,
  },
  counterpartReasonBox: {
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FED7D7',
    marginBottom: 8,
  },
  counterpartReasonLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#C53030',
    marginBottom: 3,
  },
  counterpartReasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9B2C2C',
  },
  counterpartDetailsText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#742A2A',
    marginTop: 4,
  },
  counterpartInstructions: {
    fontSize: 11.5,
    color: '#666',
    marginBottom: 12,
    lineHeight: 16,
  },
  btnAcceptCancellation: {
    backgroundColor: '#2E7D32',
  },
  btnAcceptCancellationText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  btnAppeal: {
    backgroundColor: PURPLE,
  },
  btnAppealText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bannerAppealSubmitted: {
    backgroundColor: '#F3ECFA',
    borderLeftWidth: 4,
    borderLeftColor: PURPLE,
  },
  appealStatusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appealStatusText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: PURPLE,
  },
  appealStatusDesc: {
    fontSize: 11.5,
    color: '#555',
    lineHeight: 16,
  },
  btnDismissReview: {
    marginTop: 10,
    backgroundColor: '#2E7D32',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-end',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  btnDismissReviewText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  bannerRejectedNotice: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  bannerRejectedTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#333',
  },
  bannerAcceptedDispute: {
    backgroundColor: '#E8F5E9',
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  bannerAbortedByMe: {
    backgroundColor: '#FFF5F5',
    borderLeftWidth: 4,
    borderLeftColor: '#dc3545',
  },
  abortedByMeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  bannerTextDanger: {
    color: '#dc3545',
    fontWeight: 'bold',
    fontSize: 14,
  },
  abortedReasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: '#FFE3E3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  abortedReasonLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C53030',
  },
  abortedReasonValue: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#9B2C2C',
    flex: 1,
  },

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
  msgTime: { fontSize: 11, color: '#999', textAlign: 'right' },
  msgTimeMe: { color: 'rgba(255,255,255,0.75)' },
  msgFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 4 },

  inputBar: { 
    flexDirection: 'row', 
    alignItems: 'flex-end', 
    paddingHorizontal: 12, 
    paddingTop: 8, 
    backgroundColor: 'white', 
    borderTopWidth: 1, 
    borderTopColor: '#ECECF1', 
    gap: 8, 
    flexShrink: 0 
  },
  textInput: { 
    flex: 1, 
    backgroundColor: '#F6F6F8', 
    borderRadius: 22, 
    paddingHorizontal: 16, 
    paddingTop: 11, 
    paddingBottom: 11, 
    fontSize: 15, 
    lineHeight: 20,
    minHeight: 44, 
    maxHeight: 120, 
    color: '#333',
    textAlignVertical: 'center',
  },
  sendButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: PURPLE, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 0,
  },
  sendButtonDisabled: { opacity: 0.5 },

  lockedInputBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingTop: 12, backgroundColor: '#F0F0F0', borderTopWidth: 1, borderTopColor: '#ECECF1', gap: 8 },
  lockedText: { color: '#999', fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 20, textAlign: 'center' },
  serviceOption: { padding: 16, backgroundColor: '#F6F6F8', borderRadius: 12, marginBottom: 12 },
  serviceOptionProfession: { fontSize: 16, fontWeight: 'bold', color: PURPLE },
  serviceOptionCategory: { fontSize: 13, color: '#666', marginTop: 4 },
  cancelModalBtn: { padding: 14, alignItems: 'center', marginTop: 10, backgroundColor: '#C62828', borderRadius: 12 },
  cancelModalText: { color: 'white', fontWeight: 'bold', fontSize: 15 },
});
