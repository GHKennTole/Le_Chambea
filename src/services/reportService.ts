import { supabase } from './supabase';

export async function submitChatReport({
  chatId,
  isProfessional,
  otherUserName,
  reason,
  description,
}: {
  chatId: string;
  isProfessional: boolean;
  otherUserName: string;
  reason: string;
  description?: string;
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
        senderName = `${profile.nombre} ${profile.apellidos || ''}`.trim();
      }
    }

    const reporterRole = isProfessional ? 'Profesional' : 'Cliente';
    const reportedRole = isProfessional ? 'Cliente' : 'Profesional';

    let details = `🚨 Reporte en Conversación de Chat (ID: ${chatId})\n\n`;
    details += `• Quien reporta: ${senderName} (${reporterRole})\n`;
    if (user?.id) {
      details += `• ID de usuario: ${user.id}\n`;
    }
    details += `• Usuario reportado: ${otherUserName} (${reportedRole})\n`;
    details += `• Motivo del reporte:\n  ${reason.trim()}\n`;
    if (description && description.trim()) {
      details += `\n• Descripción detallada:\n  ${description.trim()}\n`;
    }

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: null,
      titulo: `🚨 REPORTE CHAT: ${reporterRole} reportó a ${reportedRole} (${otherUserName})`,
      cuerpo: details,
      leido: false,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error reporting chat:", error);
    return false;
  }
}

export async function submitAiReport({
  reason,
  description,
  conversationSnippet,
}: {
  reason: string;
  description?: string;
  conversationSnippet?: string;
}): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    let senderName = 'Un usuario';
    let senderEmail = '';
    if (user) {
      senderEmail = user.email || '';
      const { data: profile } = await supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single();
      if (profile) {
        senderName = `${profile.nombre} ${profile.apellidos || ''}`.trim();
      }
    }

    let details = `🚨 Reporte de Asistente Virtual Sula AI\n\n`;
    details += `• Quien reporta: ${senderName}${senderEmail ? ` (${senderEmail})` : ''}\n`;
    if (user?.id) {
      details += `• ID de usuario: ${user.id}\n`;
    }
    details += `• Motivo del reporte:\n  ${reason.trim()}\n`;
    if (description && description.trim()) {
      details += `\n• Descripción detallada:\n  ${description.trim()}\n`;
    }
    if (conversationSnippet && conversationSnippet.trim()) {
      details += `\n• Historial de la conversación reportada:\n${conversationSnippet.trim()}\n`;
    }

    const { error } = await supabase.from('notificaciones').insert({
      usuario_id: null,
      titulo: `🚨 REPORTE AI: Sula AI - ${reason.trim()}`,
      cuerpo: details,
      leido: false,
    });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error reporting AI issue:", error);
    return false;
  }
}
