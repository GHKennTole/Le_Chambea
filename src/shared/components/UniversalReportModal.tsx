import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useResponsive } from '../hooks/useResponsive';

const PURPLE = '#5A2D82';

export interface ReportReasonOption {
  id: string;
  label: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export interface UniversalReportModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  targetBadge?: {
    label: string;
    name: string;
    icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  };
  reasons?: ReportReasonOption[];
  chips?: string[];
  placeholder?: string;
  onSubmit: (reason: string, description?: string) => Promise<boolean>;
  successTitle?: string;
  successMessage?: string;
  successInfoText?: string;
  extraContent?: React.ReactNode;
}

export default function UniversalReportModal({
  visible,
  onClose,
  title,
  subtitle,
  targetBadge,
  reasons,
  chips,
  placeholder,
  onSubmit,
  successTitle = "¡Reporte enviado con éxito!",
  successMessage = "El reporte se mandó con éxito y nuestro equipo revisará el caso a la brevedad.",
  successInfoText = "Tu reporte nos ayuda a mantener un entorno seguro y de confianza para toda la comunidad.",
  extraContent,
}: UniversalReportModalProps) {
  const { isLargeScreen } = useResponsive();
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [inputHeight, setInputHeight] = useState<number>(90);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const resetForm = () => {
    setSelectedReason('');
    setDescription('');
    setInputHeight(90);
    setSubmitting(false);
    setErrorMessage(null);
    setIsSuccess(false);
  };

  const handleClose = () => {
    if (submitting) return;
    resetForm();
    onClose();
  };

  const handleAcceptSuccess = () => {
    resetForm();
    onClose();
  };

  const handleChipPress = (chip: string) => {
    if (description.includes(chip)) return;
    setDescription((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}: `));
  };

  const handleSubmit = async () => {
    if (submitting) return;

    if (reasons && reasons.length > 0 && !selectedReason) {
      setErrorMessage("Por favor selecciona un motivo para continuar.");
      return;
    }

    if (chips && chips.length > 0 && !description.trim()) {
      setErrorMessage("Por favor ingresa una descripción o motivo para continuar.");
      return;
    }

    if (selectedReason === 'Otro motivo' && !description.trim()) {
      setErrorMessage("Por favor describe el motivo de tu reporte.");
      return;
    }

    setErrorMessage(null);
    setSubmitting(true);

    try {
      const finalReason = selectedReason || description.trim();
      const finalDesc = selectedReason ? description.trim() : undefined;
      const success = await onSubmit(finalReason, finalDesc);

      if (success) {
        setIsSuccess(true);
      } else {
        setErrorMessage("Hubo un error al procesar el reporte. Por favor intenta de nuevo.");
      }
    } catch {
      setErrorMessage("No fue posible enviar el reporte. Verifica tu conexión e inténtalo más tarde.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!visible) return null;

  const isSubmitDisabled =
    submitting ||
    (reasons && reasons.length > 0 && !selectedReason) ||
    (chips && chips.length > 0 && !description.trim()) ||
    (selectedReason === 'Otro motivo' && !description.trim());

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isSuccess ? handleAcceptSuccess : handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={isSuccess ? handleAcceptSuccess : handleClose}
        />

        <View style={[styles.modalCard, isLargeScreen && styles.modalCardLarge]}>
          {isSuccess ? (
            /* Vista de Éxito */
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <MaterialCommunityIcons name="check-circle" size={54} color="#10B981" />
              </View>

              <Text style={styles.successTitle}>{successTitle}</Text>
              <Text style={styles.successMessage}>{successMessage}</Text>

              {successInfoText ? (
                <View style={styles.successInfoBox}>
                  <MaterialCommunityIcons name="shield-check-outline" size={20} color={PURPLE} />
                  <Text style={styles.successInfoText}>{successInfoText}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.acceptButton}
                activeOpacity={0.8}
                onPress={handleAcceptSuccess}
              >
                <Text style={styles.acceptButtonText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Formulario de Reporte */
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.alertIconCircle}>
                  <Text style={styles.alertEmoji}>🚨</Text>
                </View>
                <Text style={styles.title}>{title}</Text>

                {targetBadge ? (
                  <View style={styles.roleBadge}>
                    <MaterialCommunityIcons
                      name={targetBadge.icon || "account-alert"}
                      size={14}
                      color={PURPLE}
                      style={styles.assistantIcon}
                    />
                    <Text style={styles.roleBadgeText}>
                      {targetBadge.label}: <Text style={styles.roleBadgeName}>{targetBadge.name}</Text>
                    </Text>
                  </View>
                ) : null}

                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
              </View>

              {extraContent}

              {errorMessage && (
                <View style={styles.errorBox}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Selector de Motivos (Radio List) */}
              {reasons && reasons.length > 0 && (
                <>
                  <Text style={styles.sectionLabel}>Selecciona el motivo del reporte:</Text>
                  <View style={styles.reasonsList}>
                    {reasons.map((item) => {
                      const isSelected = selectedReason === item.label;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          style={[styles.reasonItem, isSelected && styles.reasonItemSelected]}
                          activeOpacity={0.7}
                          onPress={() => {
                            setSelectedReason(item.label);
                            if (errorMessage) setErrorMessage(null);
                          }}
                        >
                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioDot} />}
                          </View>
                          {item.icon && (
                            <MaterialCommunityIcons
                              name={item.icon}
                              size={19}
                              color={isSelected ? '#DC2626' : '#6B7280'}
                              style={styles.reasonIcon}
                            />
                          )}
                          <Text style={[styles.reasonText, isSelected && styles.reasonTextSelected]}>
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Selector de Chips Rápidos */}
              {chips && chips.length > 0 && (
                <View style={styles.chipsSection}>
                  <Text style={styles.sectionLabel}>Motivos rápidos (toca para agregar):</Text>
                  <View style={styles.chipsWrap}>
                    {chips.map((chip, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.chipButton}
                        activeOpacity={0.7}
                        onPress={() => handleChipPress(chip)}
                      >
                        <Text style={styles.chipText}>{chip}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Campo de Descripción Detallada */}
              <View style={styles.descriptionSection}>
                <Text style={styles.sectionLabel}>
                  {reasons && reasons.length > 0
                    ? `Descripción de lo ocurrido ${selectedReason === 'Otro motivo' ? '(requerido)' : '(opcional)'}:`
                    : 'Detalla el motivo del reporte:'}
                </Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.textInput, { height: inputHeight }]}
                    placeholder={
                      placeholder ||
                      (selectedReason === 'Otro motivo'
                        ? 'Por favor especifica el motivo y qué ocurrió...'
                        : 'Describe detalladamente los hechos para que el equipo pueda revisar el caso...')
                    }
                    placeholderTextColor="#9CA3AF"
                    value={description}
                    onChangeText={(val) => {
                      setDescription(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    textAlignVertical="top"
                    onContentSizeChange={(e) => {
                      const h = e.nativeEvent.contentSize.height;
                      setInputHeight(Math.max(90, Math.min(180, h + 24)));
                    }}
                  />
                  <Text style={styles.charCount}>{description.length}/500</Text>
                </View>
              </View>

              {/* Acciones del Modal */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  disabled={submitting}
                  onPress={handleClose}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    isSubmitDisabled && styles.submitButtonDisabled,
                  ]}
                  disabled={isSubmitDisabled}
                  onPress={handleSubmit}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="send"
                        size={16}
                        color="white"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.submitButtonText}>Enviar reporte</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...Platform.select({
      web: {
        maxWidth: 500,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
      } as any,
      default: {
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
      },
    }),
  },
  modalCardLarge: {
    maxWidth: 520,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  alertIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertEmoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 6,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  assistantIcon: {
    marginRight: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  roleBadgeName: {
    fontWeight: '700',
    color: PURPLE,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 12.5,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    marginBottom: 8,
  },
  reasonsList: {
    gap: 8,
    marginBottom: 16,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  reasonItemSelected: {
    backgroundColor: '#FEF2F2',
    borderColor: '#F87171',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioCircleSelected: {
    borderColor: '#DC2626',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  reasonIcon: {
    marginRight: 10,
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    flex: 1,
  },
  reasonTextSelected: {
    color: '#991B1B',
    fontWeight: '700',
  },
  chipsSection: {
    marginBottom: 14,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chipButton: {
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E9D5FF',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: PURPLE,
  },
  descriptionSection: {
    marginBottom: 18,
  },
  inputWrapper: {
    position: 'relative',
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    paddingBottom: 24,
    fontSize: 13,
    color: '#111827',
  },
  charCount: {
    position: 'absolute',
    bottom: 6,
    right: 10,
    fontSize: 11,
    color: '#9CA3AF',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  submitButton: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  successInfoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3ECFA',
    padding: 14,
    borderRadius: 14,
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 24,
  },
  successInfoText: {
    flex: 1,
    fontSize: 12.5,
    color: '#4C1D95',
    lineHeight: 18,
    fontWeight: '500',
  },
  acceptButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
