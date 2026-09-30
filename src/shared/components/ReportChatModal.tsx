import React from 'react';
import UniversalReportModal, { ReportReasonOption } from './UniversalReportModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  isProfessional: boolean;
  otherUserName: string;
  chatId?: string;
  onSubmit: (reason: string, description?: string) => Promise<boolean>;
}

// Motivos cuando el Cliente reporta al Profesional
const CLIENT_REPORT_REASONS: ReportReasonOption[] = [
  { id: 'c1', label: 'Cobro no acordado o tarifas excesivas', icon: 'cash-remove' },
  { id: 'c2', label: 'Incumplimiento de servicio o inasistencia', icon: 'calendar-remove' },
  { id: 'c3', label: 'Conducta inapropiada, acoso o lenguaje ofensivo', icon: 'account-alert' },
  { id: 'c4', label: 'Mala calidad en el trabajo o daño a propiedad', icon: 'hammer-wrench' },
  { id: 'c5', label: 'Información falsa o perfil engañoso', icon: 'shield-account-variant' },
  { id: 'c6', label: 'Otro motivo', icon: 'dots-horizontal-circle-outline' },
];

// Motivos cuando el Profesional reporta al Cliente
const PRO_REPORT_REASONS: ReportReasonOption[] = [
  { id: 'p1', label: 'Falta o negativa de pago de lo acordado', icon: 'credit-card-remove' },
  { id: 'p2', label: 'Conducta irrespetuosa, agresiva o acoso', icon: 'account-alert' },
  { id: 'p3', label: 'Cancelación injustificada de último momento', icon: 'clock-alert-outline' },
  { id: 'p4', label: 'Solicitud de trabajos peligrosos o fuera de alcance', icon: 'alert-octagon' },
  { id: 'p5', label: 'Dirección o condiciones del lugar engañosas', icon: 'map-marker-remove' },
  { id: 'p6', label: 'Otro motivo', icon: 'dots-horizontal-circle-outline' },
];

export default function ReportChatModal({
  visible,
  onClose,
  isProfessional,
  otherUserName,
  onSubmit,
}: Props) {
  const reasons = isProfessional ? PRO_REPORT_REASONS : CLIENT_REPORT_REASONS;
  const userRoleLabel = isProfessional ? "Cliente" : "Profesional";

  return (
    <UniversalReportModal
      visible={visible}
      onClose={onClose}
      title="Reportar Usuario"
      targetBadge={{
        label: userRoleLabel,
        name: otherUserName || 'Usuario',
        icon: 'account-alert',
      }}
      subtitle="Selecciona el motivo que mejor describa la situación con este usuario. Tu reporte será evaluado directamente por el equipo de moderación."
      reasons={reasons}
      onSubmit={onSubmit}
      successMessage="El reporte sobre este usuario se mandó con éxito y el equipo técnico revisará el caso a la brevedad."
      successInfoText="Las conversaciones y reportes en Le Chambea son revisados para garantizar un entorno seguro y de confianza para todos."
    />
  );
}
