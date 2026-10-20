import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { Alert, Platform, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export interface ChatPreview {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPhoto: string | null;
  lastMessage: string;
  lastMessageTime: string;
  isUnread: boolean;
  unreadCount: number;
  isLastMessageFromMe: boolean;
  requestedService: string | null;
  jobStatus: string | null;
  isClient: boolean;
}

export function useChatListController() {
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef(false);

  const fetchChats = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      currentUserRef.current = user;

      // Fetch all chats where user is either client or professional
      let chatsData: any[] | null = null;
      let chatsError: any = null;

      const primaryQuery = await supabase
        .from('chats')
        .select('id, cliente_id, profesional_id, fecha_creacion, oculto_cliente, oculto_profesional, borrado_cliente_en, borrado_profesional_en')
        .or(`cliente_id.eq.${user.id},profesional_id.eq.${user.id}`)
        .order('fecha_creacion', { ascending: false });

      chatsData = primaryQuery.data;
      chatsError = primaryQuery.error;

      // Fallback si las nuevas columnas aún no se han aplicado en la BD
      if (chatsError && (chatsError.code === '42703' || chatsError.message?.includes('does not exist'))) {
        const fallbackRes = await supabase
          .from('chats')
          .select('id, cliente_id, profesional_id, fecha_creacion')
          .or(`cliente_id.eq.${user.id},profesional_id.eq.${user.id}`)
          .order('fecha_creacion', { ascending: false });
        chatsData = fallbackRes.data;
        chatsError = fallbackRes.error;
      }

      if (chatsError) throw chatsError;
      if (!chatsData || chatsData.length === 0) {
        setChats([]);
        return;
      }

      // Filtrar chats que el usuario actual haya eliminado/ocultado
      const visibleChats = chatsData.filter((chat: any) => {
        const isClient = chat.cliente_id === user.id;
        if (isClient && chat.oculto_cliente) return false;
        if (!isClient && chat.oculto_profesional) return false;
        return true;
      });

      if (visibleChats.length === 0) {
        setChats([]);
        return;
      }

      // Fetch details for each chat in parallel
      const chatPreviewPromises = visibleChats.map(async (chat) => {
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

        let requestedService = Array.isArray(jobData?.perfiles_profesionales)
          ? (jobData.perfiles_profesionales[0]?.profesion || null)
          : ((jobData?.perfiles_profesionales as any)?.profesion || null);

        if (!requestedService && isClient) {
          const { data: proProfile } = await supabase
            .from('perfiles_profesionales')
            .select('profesion')
            .eq('usuario_id', otherUserId)
            .eq('esta_activo', true)
            .limit(1)
            .maybeSingle();
          if (proProfile?.profesion) {
            requestedService = proProfile.profesion;
          }
        }

        // Determine last message text (siempre el último mensaje de chat)
        let lastMessage = 'Inicia la conversación...';
        if (lastMsgData) {
          lastMessage = lastMsgData.contenido;
        }

        const lastMessageTime = lastMsgData ? lastMsgData.fecha_creacion : chat.fecha_creacion;
        
        const isLastMessageFromMe = lastMsgData ? lastMsgData.remitente_id === user.id : false;
        const unreadNum = unreadCount || 0;
        const isUnread = unreadNum > 0;
        const jobStatus = jobData?.estado || null;

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
          unreadCount: unreadNum,
          isLastMessageFromMe,
          requestedService,
          jobStatus,
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
      hasLoadedRef.current = true;
    }
  }, []);

  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  // Recargar automáticamente cuando la pantalla recibe foco (al volver de un chat)
  useEffect(() => {
    const unsubscribe = navigation?.addListener?.('focus', () => {
      fetchChats();
    });
    return unsubscribe;
  }, [navigation, fetchChats]);

  // Recargar cuando la app vuelve al primer plano
  useEffect(() => {
    const handleAppState = (nextState: string) => {
      if (nextState === 'active') {
        fetchChats();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub.remove();
  }, [fetchChats]);

  // Sync suave periódico cada 5 segundos para mantener mensajes recientes y badges al día
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChats();
    }, 5000);
    return () => clearInterval(interval);
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

  // Real-time subscription to auto-refresh chat list when messages, chats or jobs change
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
          table: 'mensajes',
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
          table: 'chats',
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
          table: 'trabajos',
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

  const deleteChat = async (chatId: string): Promise<boolean> => {
    try {
      const user = currentUserRef.current || (await supabase.auth.getUser()).data.user;
      if (!user) return false;

      // Determinar si el usuario actual es cliente o profesional en este chat
      const { data: chatData, error: chatFetchErr } = await supabase
        .from('chats')
        .select('id, cliente_id, profesional_id')
        .eq('id', chatId)
        .single();

      if (chatFetchErr) throw chatFetchErr;

      const isClient = chatData.cliente_id === user.id;
      const now = new Date().toISOString();

      // Borrado lógico (Soft Delete): Solo oculta el chat para este usuario.
      // NUNCA se eliminan físicamente los mensajes, ni los trabajos, ni el chat de la BD.
      const updatePayload: any = isClient
        ? { oculto_cliente: true, borrado_cliente_en: now }
        : { oculto_profesional: true, borrado_profesional_en: now };

      const { error: updateError } = await supabase
        .from('chats')
        .update(updatePayload)
        .eq('id', chatId);

      if (updateError) {
        console.warn('Advertencia al ocultar chat en BD:', updateError.message);
      }

      // Actualizar estado local inmediatamente para removerlo de su vista
      setChats(prev => prev.filter(c => c.id !== chatId));
      return true;
    } catch (error) {
      console.error('Error al ocultar chat:', error);
      return false;
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
