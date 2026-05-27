import { useState, useEffect, useCallback } from 'react';
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
        .select('*')
        .eq('usuario_id', activeUid)
        .order('fecha_creacion', { ascending: false });

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

      let unreadChats = 0;

      // Check if there are any unread messages from the other user in each chat
      for (const chat of chatsData) {
        const { count, error: countError } = await supabase
          .from('mensajes')
          .select('id', { count: 'exact', head: true })
          .eq('chat_id', chat.id)
          .neq('remitente_id', activeUid)
          .eq('leido', false);

        if (!countError && count && count > 0) {
          unreadChats += 1;
        }
      }

      setUnreadChatsCount(unreadChats);

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

    // Subscription to messages
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
          fetchCountsAndNotifications(userId);
        }
      )
      .subscribe();

    return () => {
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

  return {
    unreadNotificationsCount,
    unreadChatsCount,
    notifications,
    markAllNotificationsAsRead,
    refetch: () => userId && fetchCountsAndNotifications(userId)
  };
}
