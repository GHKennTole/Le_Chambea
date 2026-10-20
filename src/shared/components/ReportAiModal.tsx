import React from 'react';
import UniversalReportModal, { ReportReasonOption } from './UniversalReportModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit: (reason: string, description?: string) => Promise<boolean>;
}

const AI_REPORT_REASONS: ReportReasonOption[] = [
  { id: 'ai1', label: 'Respuesta errónea, confusa o falsa', icon: 'alert-decagram-outline' },
  { id: 'ai2', label: 'Recomendación de profesional incorrecta o irrelevante', icon: 'account-search-outline' },
  { id: 'ai3', label: 'Comportamiento repetitivo o bucle de respuestas', icon: 'sync-alert' },
  { id: 'ai4', label: 'Lenguaje inapropiado o fuera de lugar', icon: 'message-alert-outline' },
  { id: 'ai5', label: 'Se congela, no responde o falla técnica', icon: 'timer-sand-empty' },
  { id: 'ai6', label: 'Otro motivo', icon: 'dots-horizontal-circle-outline' },
];

export default function ReportAiModal({ visible, onClose, onSubmit }: Props) {
  return (
    <UniversalReportModal
      visible={visible}
      onClose={onClose}
      title="Reportar Sula AI"
      targetBadge={{ label: 'Asistente Virtual', name: 'Sula AI', icon: 'robot' }}
      subtitle="Selecciona el motivo que mejor describa la situación con el asistente. Tu reporte será evaluado directamente por el equipo técnico."
      reasons={AI_REPORT_REASONS}
      onSubmit={onSubmit}
      successMessage="El reporte sobre Sula AI se mandó con éxito y el equipo técnico revisará el caso a la brevedad."
      successInfoText="Tu feedback nos ayuda a entrenar y calibrar a Sula AI para ofrecer respuestas más seguras y precisas a toda la comunidad."
    />
  );
}
