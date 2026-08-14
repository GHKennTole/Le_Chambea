import { supabase } from './supabase';
import { showAlert } from '../shared/utils/customAlert';

export async function submitServiceReport({
  serviceId,
  serviceName,
  professionalName,
  reason,
}: {
  serviceId: string;
  serviceName: string;
  professionalName: string;
  reason: string;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let senderName = 'Un usuario';
    if (user) {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single();
      if (profile) {
        senderName = `${profile.nombre} ${profile.apellidos}`.trim();
      }
    }

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: null,
      titulo: `🚨 REPORTE: Servicio de ${serviceName}`,
      cuerpo: `El usuario ${senderName} reportó el servicio "${serviceName}" del profesional ${professionalName}.\n\nID del servicio: ${serviceId}\n\nMotivo del reporte:\n${reason.trim()}`,
      leido: false,
    });

    if (error) throw error;

    showAlert(
      "🚨 Reporte Enviado",
      "Gracias por tu reporte. Nuestro equipo de soporte revisará este servicio a la brevedad.",
      [{ text: "Entendido" }],
      "success"
    );
    return true;
  } catch (error) {
    console.error("Error reporting service:", error);
    showAlert("Error", "No se pudo enviar el reporte del servicio. Por favor inténtalo de nuevo.");
    return false;
  }
}

export async function submitReviewReport({
  reviewId,
  infractionBy,
  clientName,
  professionalName,
  reviewComment,
  reviewReply,
  reason,
}: {
  reviewId: string;
  infractionBy: 'client' | 'professional';
  clientName: string;
  professionalName?: string;
  reviewComment?: string;
  reviewReply?: string;
  reason: string;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let senderName = 'Un usuario';
    if (user) {
      const { data: profile } = await supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single();
      if (profile) {
        senderName = `${profile.nombre} ${profile.apellidos}`.trim();
      }
    }

    const targetLabel = infractionBy === 'client' 
      ? 'El Cliente (en la reseña original)' 
      : 'El Profesional (en su respuesta)';

    let details = `El usuario ${senderName} reportó una reseña.\n\n`;
    details += `• Infracción cometida por: ${targetLabel}\n`;
    details += `• Cliente: ${clientName || 'Anónimo'}\n`;
    if (professionalName) {
      details += `• Profesional: ${professionalName}\n`;
    }
    if (reviewComment) {
      details += `• Comentario de la reseña: "${reviewComment}"\n`;
    }
    if (reviewReply) {
      details += `• Respuesta del profesional: "${reviewReply}"\n`;
    }
    details += `• ID de la reseña: ${reviewId}\n\n`;
    details += `Motivo detallado del reporte:\n${reason.trim()}`;

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: null,
      titulo: `🚨 REPORTE: Reseña de ${clientName || 'Usuario'}`,
      cuerpo: details,
      leido: false,
    });

    if (error) throw error;

    showAlert(
      "🚨 Reporte Enviado",
      "Gracias por tu reporte. Nuestro equipo de moderación revisará la reseña y tomará las medidas pertinentes.",
      [{ text: "Entendido" }],
      "success"
    );
    return true;
  } catch (error) {
    console.error("Error reporting review:", error);
    showAlert("Error", "No se pudo enviar el reporte de la reseña. Por favor inténtalo de nuevo.");
    return false;
  }
}
