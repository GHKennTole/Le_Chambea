import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabase';

export interface NotificationItem {
  id: string;
  title: string;
  body?: string;
  leido: boolean;
  fecha_creacion: string;
}

export function useAppBadges() {
  const [userId, setUserId] = useState<string | null>(null);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchCountsAndNotifications = useCallback(async (currentUserId?: string) => {
    try {
      let activeUid = currentUserId || userId;
      if (!activeUid) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        activeUid = user.id;
        setUserId(user.id);
      }

      // 1. Fetch unread notifications count and list
      const { data: notisData, error: notisError } = await supabase
        .from('notificaciones')
        .select('id, titulo, cuerpo, leido, fecha_creacion')
        .eq('usuario_id', activeUid)
        .order('fecha_creacion', { ascending: false })
        .limit(50);

      if (notisError) throw notisError;

      if (notisData) {
        const mapped: NotificationItem[] = notisData.map(n => ({
          id: n.id,
          title: n.titulo,
          body: n.cuerpo,
          leido: n.leido,
          fecha_creacion: n.fecha_creacion
        }));
        setNotifications(mapped);
        setUnreadNotificationsCount(mapped.filter(n => !n.leido).length);
      }

      // 2. Fetch all chats for the user
      const { data: chatsData, error: chatsError } = await supabase
        .from('chats')
        .select('id, cliente_id, profesional_id')
        .or(`cliente_id.eq.${activeUid},profesional_id.eq.${activeUid}`);

      if (chatsError) throw chatsError;

      if (!chatsData || chatsData.length === 0) {
        setUnreadChatsCount(0);
        return;
      }

      const chatIds = chatsData.map(c => c.id);
      const { data: unreadData, error: unreadError } = await supabase
        .from('mensajes')
        .select('chat_id')
        .in('chat_id', chatIds)
        .neq('remitente_id', activeUid)
        .eq('leido', false);

      if (!unreadError && unreadData) {
        // Count unique chat_ids that have unread messages
        const unreadChatIds = new Set(unreadData.map(m => m.chat_id));
        setUnreadChatsCount(unreadChatIds.size);
      } else {
        setUnreadChatsCount(0);
      }

    } catch (error) {
      console.error('Error fetching badges and notifications:', error);
    }
  }, [userId]);

  useEffect(() => {
    let activeUser: string | null = null;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        activeUser = user.id;
        setUserId(user.id);
        fetchCountsAndNotifications(user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        activeUser = session.user.id;
        setUserId(session.user.id);
        fetchCountsAndNotifications(session.user.id);
      } else {
        setUserId(null);
        setUnreadNotificationsCount(0);
        setUnreadChatsCount(0);
        setNotifications([]);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchCountsAndNotifications]);

  // Real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Generate unique channel names for this hook instance to prevent collision
    const uniqueId = Math.random().toString(36).substring(2, 9);
    const notificationsChannelName = `realtime-notifications-${userId}-${uniqueId}`;
    const messagesChannelName = `realtime-messages-badges-${userId}-${uniqueId}`;

    // Subscription to notifications
    const notificationsChannel = supabase
      .channel(notificationsChannelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notificaciones',
          filter: `usuario_id=eq.${userId}`
        },
        () => {
          fetchCountsAndNotifications(userId);
        }
      )
      .subscribe();

    // Subscription to messages (debounced to avoid excessive refetches)
    const debouncedFetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchCountsAndNotifications(userId);
      }, 500);
    };

    const messagesChannel = supabase
      .channel(messagesChannelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mensajes'
        },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      supabase.removeChannel(notificationsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [userId, fetchCountsAndNotifications]);

  const markAllNotificationsAsRead = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notificaciones')
        .update({ leido: true })
        .eq('usuario_id', userId)
        .eq('leido', false);

      if (error) throw error;

      // Update state locally
      setNotifications(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update state locally
      setNotifications(prev => prev.filter(n => n.id !== id));
      // Re-calculate unread count if the deleted one was unread
      setUnreadNotificationsCount(prev => {
        const deletedNoti = notifications.find(n => n.id === id);
        if (deletedNoti && !deletedNoti.leido) {
          return Math.max(0, prev - 1);
        }
        return prev;
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const deleteAllNotifications = async () => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('notificaciones')
        .delete()
        .eq('usuario_id', userId);

      if (error) throw error;

      // Update state locally
      setNotifications([]);
      setUnreadNotificationsCount(0);
    } catch (error) {
      console.error('Error deleting all notifications:', error);
    }
  };

  return {
    unreadNotificationsCount,
    unreadChatsCount,
    notifications,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
    refetch: () => userId && fetchCountsAndNotifications(userId)
  };
}
