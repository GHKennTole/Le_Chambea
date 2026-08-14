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
import { submitServiceReport } from '../../services/reportService';

const PURPLE = '#5A2D82';

interface Props {
  visible: boolean;
  onClose: () => void;
  serviceId: string;
  serviceName: string;
  professionalName: string;
}

const SERVICE_QUICK_REASONS = [
  "🚫 Servicio engañoso o fraudulento",
  "⚠️ Tarifas o cobros abusivos",
  "📦 No cumple con lo especificado",
  "💬 Trato o conducta no profesional",
];

export default function ReportServiceModal({
  visible,
  onClose,
  serviceId,
  serviceName,
  professionalName,
}: Props) {
  const [reason, setReason] = useState("");
  const [inputHeight, setInputHeight] = useState(100);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    if (submitting) return;
    setReason("");
    setInputHeight(100);
    onClose();
  };

  const handleQuickChip = (chip: string) => {
    if (!reason.includes(chip)) {
      setReason((prev) => (prev ? `${prev}\n• ${chip}` : `• ${chip}: `));
    }
  };

  const handleSubmit = async () => {
    if (!reason.trim() || submitting) return;
    setSubmitting(true);
    const success = await submitServiceReport({
      serviceId,
      serviceName,
      professionalName,
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
            <Text style={styles.title}>Reportar Servicio</Text>
            <Text style={styles.subtitle}>
              Estás reportando el servicio de <Text style={styles.highlightText}>{serviceName}</Text> ofrecido por <Text style={styles.highlightText}>{professionalName}</Text>.
            </Text>
          </View>

          {/* Motivos rápidos */}
          <Text style={styles.sectionLabel}>Motivos frecuentes:</Text>
          <View style={styles.quickChipsRow}>
            {SERVICE_QUICK_REASONS.map((chip, idx) => (
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
              placeholder="Describe detalladamente el motivo de tu reporte..."
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
    marginBottom: 14,
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
