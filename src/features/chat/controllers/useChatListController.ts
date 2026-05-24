import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../services/supabase';

export interface ChatPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  requestedService: string | null;
}

export function useChatListController() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch all chats where user is either client or professional
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('*')
        .or(`cliente_id.eq.${user.id},profesional_id.eq.${user.id}`)
        .order('fecha_creacion', { ascending: false });

      if (chatsError) throw chatsError;
      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        return;
      }

      // Fetch details for each chat
      const chatPreviews: ChatPreview[] = [];

      for (const chat of chatsData) {
        // Determine the other user's ID
        const otherUserId = chat.cliente_id === user.id ? chat.profesional_id : chat.cliente_id;

        // Get other user's profile
        const { data: userData } = await supabase
          .from('usuarios')
          .select('nombre, apellidos, foto_perfil')
          .eq('id', otherUserId)
          .single();

        // Get latest message
        const { data: lastMsgData } = await supabase
          .from('mensajes')
          .select('contenido, fecha_creacion, remitente_id')
          .eq('chat_id', chat.id)
          .order('fecha_creacion', { ascending: false })
          .limit(1)
          .maybeSingle();

        const name = userData ? `${userData.nombre} ${userData.apellidos}`.trim() : 'Usuario Desconocido';

        // Get job status
        const { data: jobData } = await supabase
          .from('trabajos')
          .select('estado, perfiles_profesionales(profesion)')

          .eq('chat_id', chat.id)
          .order('fecha_creacion', { ascending: false })
          .limit(1)
          .maybeSingle();

        const requestedService = Array.isArray(jobData?.perfiles_profesionales)
          ? (jobData.perfiles_profesionales[0]?.profesion || null)
          : ((jobData?.perfiles_profesionales as any)?.profesion || null);

        // Determine last message text
        let lastMessage = 'Inicia la conversación...';
        if (lastMsgData) {
          lastMessage = lastMsgData.contenido;
        } else if (jobData) {
          const statusMap: Record<string, string> = {
            pending: '⏳ Solicitud pendiente',
            accepted: '🔨 Trabajo en curso',
            completed: '✅ Trabajo completado',
            rejected: '❌ Solicitud rechazada',
          };
          lastMessage = statusMap[jobData.estado] || 'Inicia la conversación...';
        }

        const lastMessageTime = lastMsgData ? lastMsgData.fecha_creacion : chat.fecha_creacion;
        const isUnread = lastMsgData ? (lastMsgData.remitente_id !== user.id) : false;

        // Skip empty ghost chats
        if (!lastMsgData && !jobData) {
          continue;
        }

        chatPreviews.push({
          id: chat.id,
          otherUserId,
          otherUserName: name || 'Usuario',
          otherUserPhoto: userData?.foto_perfil || null,
          lastMessage,
          lastMessageTime,
          isUnread,
          requestedService
        });
      }

      // Sort by latest message time
      chatPreviews.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

      setChats(chatPreviews);
    } catch (error) {
      console.error('Error fetching chat list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  return {
    loading,
    chats,
    currentUser,
    refetch: fetchChats
  };
}
