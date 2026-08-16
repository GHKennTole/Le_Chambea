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
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { submitReviewReport } from '../../services/reportService';
import type { Review } from '../../features/perfil/models/profile.types';
import { useResponsive } from '../hooks/useResponsive';

const PURPLE = '#5A2D82';

interface Props {
  visible: boolean;
  onClose: () => void;
  review: Review | null;
  professionalName?: string;
}

const REVIEW_QUICK_REASONS = [
  "💬 Lenguaje ofensivo o inapropiado",
  "⚠️ Reseña falsa / No hubo servicio",
  "🚫 Acoso, difamación o extorsión",
  "📦 Información engañosa o spam",
];

export default function ReportReviewModal({
  visible,
  onClose,
  review,
  professionalName,
}: Props) {
  const { isLargeScreen } = useResponsive();
  const [infractionBy, setInfractionBy] = useState<'client' | 'professional'>('client');
  const [reason, setReason] = useState("");
  const [inputHeight, setInputHeight] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const clientName = review?.usuarios 
    ? `${review.usuarios.nombre} ${review.usuarios.apellidos || ''}`.trim() 
    : 'Cliente';

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    setInfractionBy('client');
    setInputHeight(100);
    onClose();
  };

  const handleQuickChip = (chip: string) => {
    if (!reason.includes(chip)) {
      setReason((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}: `));
    }
  };

  const handleSubmit = async () => {
    if (!review || !reason.trim() || submitting) return;
    setSubmitting(true);
    const success = await submitReviewReport({
      reviewId: review.id,
      infractionBy,
      clientName,
      professionalName,
      reviewComment: review.comentario,
      reviewReply: review.respuesta_profesional,
      reason,
    });
    setSubmitting(false);
    if (success) {
      handleClose();
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={handleClose} />
        
        <View style={styles.modalCard}>
          {/* Header del modal con insignia 🚨 */}
          <View style={styles.header}>
            <View style={styles.alertIconCircle}>
              <Text style={styles.alertEmoji}>🚨</Text>
            </View>
            <Text style={styles.title}>Reportar Reseña</Text>
            <Text style={styles.subtitle}>
              Reseña realizada por <Text style={styles.highlightText}>{clientName}</Text>
              {professionalName ? <> para el profesional <Text style={styles.highlightText}>{professionalName}</Text></> : null}.
            </Text>
          </View>

          {/* Selector: ¿Quién comete la infracción? */}
          <Text style={styles.sectionLabel}>¿Quién comete la infracción?</Text>
          <View style={styles.targetSelectorRow}>
            <TouchableOpacity
              style={[
                styles.targetOption,
                infractionBy === 'client' && styles.targetOptionActive,
              ]}
              onPress={() => setInfractionBy('client')}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, infractionBy === 'client' && styles.radioCircleActive]}>
                {infractionBy === 'client' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.targetOptionTextWrapper}>
                <Text style={[styles.targetOptionTitle, infractionBy === 'client' && styles.targetOptionTitleActive]}>
                  👤 El Cliente
                </Text>
                <Text style={styles.targetOptionSubtitle}>En el comentario o calificación</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.targetOption,
                infractionBy === 'professional' && styles.targetOptionActive,
              ]}
              onPress={() => setInfractionBy('professional')}
              activeOpacity={0.8}
            >
              <View style={[styles.radioCircle, infractionBy === 'professional' && styles.radioCircleActive]}>
                {infractionBy === 'professional' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.targetOptionTextWrapper}>
                <Text style={[styles.targetOptionTitle, infractionBy === 'professional' && styles.targetOptionTitleActive]}>
                  🛠️ El Profesional
                </Text>
                <Text style={styles.targetOptionSubtitle}>En la respuesta dada</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Motivos sugeridos rápidos */}
          <Text style={styles.sectionLabel}>Motivos frecuentes:</Text>
          <View style={styles.quickChipsRow}>
            {REVIEW_QUICK_REASONS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickChip}
                activeOpacity={0.7}
                onPress={() => handleQuickChip(chip)}
              >
                <Text style={styles.quickChipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Cuadro de texto auto-expandible */}
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.textInput, { height: inputHeight }]}
              placeholder="Describe detalladamente qué sucedió en esta reseña..."
              placeholderTextColor="#999"
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                setInputHeight(Math.max(100, Math.min(200, h + 24)));
              }}
            />
            <Text style={styles.charCount}>{reason.length}/500</Text>
          </View>

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              disabled={submitting}
              onPress={handleClose}
              activeOpacity={0.75}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!reason.trim() || submitting) && styles.submitBtnDisabled,
              ]}
              disabled={!reason.trim() || submitting}
              onPress={handleSubmit}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <MaterialCommunityIcons name="shield-alert-outline" size={16} color="white" />
                  <Text style={styles.submitBtnText}>Enviar Reporte</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalCard: {
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
        shadowRadius: 10,
      },
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertEmoji: {
    fontSize: 22,
  },
  title: {
    fontSize: 19,
    fontWeight: '900',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12.5,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 6,
  },
  highlightText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  targetSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  targetOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  targetOptionActive: {
    backgroundColor: '#FCFAFF',
    borderColor: PURPLE,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#9CA3AF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: PURPLE,
  },
  radioDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: PURPLE,
  },
  targetOptionTextWrapper: {
    flex: 1,
  },
  targetOptionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
  },
  targetOptionTitleActive: {
    color: PURPLE,
  },
  targetOptionSubtitle: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 1,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
  },
  quickChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  quickChipText: {
    fontSize: 11,
    color: '#4B5563',
    fontWeight: '600',
  },
  inputWrapper: {
    marginBottom: 14,
  },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    padding: 12,
    fontSize: 14,
    color: '#1F2937',
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
    marginRight: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4B5563',
  },
  submitBtn: {
    flex: 1.4,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  submitBtnDisabled: {
    backgroundColor: '#FCA5A5',
    opacity: 0.7,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
});
