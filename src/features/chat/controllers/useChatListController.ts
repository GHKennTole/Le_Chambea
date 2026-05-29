import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { Alert, Platform } from 'react-native';

export interface ChatPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  requestedService: string | null;
  isClient: boolean;
}

export function useChatListController() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchChats = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      // Fetch all chats where user is either client or professional
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('id, cliente_id, profesional_id, fecha_creacion')
        .or(`cliente_id.eq.${user.id},profesional_id.eq.${user.id}`)
        .order('fecha_creacion', { ascending: false });

      if (chatsError) throw chatsError;
      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        return;
      }

      // Fetch details for each chat in parallel
      const chatPreviewPromises = chatsData.map(async (chat) => {
        // Determine the other user's ID
        const otherUserId = chat.cliente_id === user.id ? chat.profesional_id : chat.cliente_id;
        const isClient = chat.cliente_id === user.id;

        // Parallelize all 4 queries for this chat
        const [userResult, lastMsgResult, jobResult, unreadResult] = await Promise.all([
          // Get other user's profile
          supabase
            .from('usuarios')
            .select('nombre, apellidos, foto_perfil')
            .eq('id', otherUserId)
            .single(),
          // Get latest message
          supabase
            .from('mensajes')
            .select('contenido, fecha_creacion, remitente_id')
            .eq('chat_id', chat.id)
            .order('fecha_creacion', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Get job status
          supabase
            .from('trabajos')
            .select('estado, perfiles_profesionales(profesion)')
            .eq('chat_id', chat.id)
            .order('fecha_creacion', { ascending: false })
            .limit(1)
            .maybeSingle(),
          // Get unread count
          supabase
            .from('mensajes')
            .select('id', { count: 'exact', head: true })
            .eq('chat_id', chat.id)
            .neq('remitente_id', user.id)
            .eq('leido', false),
        ]);

        const userData = userResult.data;
        const lastMsgData = lastMsgResult.data;
        const jobData = jobResult.data;
        const unreadCount = unreadResult.count;

        const name = userData ? `${userData.nombre} ${userData.apellidos}`.trim() : 'Usuario Desconocido';

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
        
        const isUnread = unreadCount ? unreadCount > 0 : false;

        // Skip empty ghost chats
        if (!lastMsgData && !jobData) {
          return null;
        }

        return {
          id: chat.id,
          otherUserId,
          otherUserName: name || 'Usuario',
          otherUserPhoto: userData?.foto_perfil || null,
          lastMessage,
          lastMessageTime,
          isUnread,
          requestedService,
          isClient
        } as ChatPreview;
      });

      const results = await Promise.all(chatPreviewPromises);
      const chatPreviews = results.filter((cp): cp is ChatPreview => cp !== null);

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

  // Debounced version of fetchChats for real-time events
  const debouncedFetchChats = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      fetchChats();
    }, 500);
  }, [fetchChats]);

  // Real-time subscription to auto-refresh chat list when messages or jobs change
  useEffect(() => {
    if (!currentUser) return;

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channelName = `realtime-chat-list-${currentUser.id}-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mensajes'
        },
        () => {
          debouncedFetchChats();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trabajos'
        },
        () => {
          debouncedFetchChats();
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [currentUser, debouncedFetchChats]);

  const deleteChat = async (chatId: string) => {
    const performDelete = async () => {
      try {
        // 1. Delete all messages for this chat
        const { error: msgError } = await supabase
          .from('mensajes')
          .delete()
          .eq('chat_id', chatId);

        if (msgError) throw msgError;

        // 2. Delete all jobs for this chat
        const { error: jobError } = await supabase
          .from('trabajos')
          .delete()
          .eq('chat_id', chatId);

        if (jobError) throw jobError;

        // 3. Delete the chat itself
        const { error: chatError } = await supabase
          .from('chats')
          .delete()
          .eq('id', chatId);

        if (chatError) throw chatError;

        // Update state locally
        setChats(prev => prev.filter(c => c.id !== chatId));
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    };

    if (Platform.OS === 'web') {
      const confirm = window.confirm('¿Estás seguro de eliminar esta conversación?');
      if (confirm) {
        await performDelete();
      }
    } else {
      Alert.alert(
        'Confirmar eliminación',
        '¿Estás seguro de eliminar esta conversación?',
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: performDelete },
        ]
      );
    }
  };

  return {
    loading,
    chats,
    currentUser,
    deleteChat,
    refetch: fetchChats
  };
}
