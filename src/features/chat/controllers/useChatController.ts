import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import type { Job, ProfessionalProfile } from '../../perfil/models/profile.types';
import { Alert, Platform, AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { submitChatReport } from '../../../services/reportService';

export interface Message {
  id: string;
  chat_id: string;
  remitente_id: string;
  contenido: string;
  fecha_creacion: string;
}

export interface AbortInfo {
  isAbortedByMe: boolean;
  isInitialRejection: boolean;
  hasRequestedReview: boolean;
  hasAccepted: boolean;
  hasDismissedReview?: boolean;
  hasDismissedNotice?: boolean;
}

export function useChatController(chatId: string, otherUserId: string) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [abortInfo, setAbortInfo] = useState<AbortInfo | null>(null);
  const [isReviewed, setIsReviewed] = useState(false);
  const [sending, setSending] = useState(false);
  const navigation = useNavigation<any>();
  const subscriptionRef = useRef<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const activeJobRef = useRef<Job | null>(null);
  const hasLoadedRef = useRef(false);

  const isReviewedRef = useRef(false);
  const chatInfoRef = useRef<any>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeJobRef.current = activeJob;
  }, [activeJob]);

  useEffect(() => {
    isReviewedRef.current = isReviewed;
  }, [isReviewed]);

  useEffect(() => {
    chatInfoRef.current = chatInfo;
  }, [chatInfo]);

  const broadcastJobUpdate = useCallback((payload?: any) => {
    if (subscriptionRef.current) {
      subscriptionRef.current.send({
        type: 'broadcast',
        event: 'job_updated',
        payload: payload || {},
      });
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);
      currentUserRef.current = user;

      // Parallelize independent queries: otherUser, chat, and messages
      const [otherResult, chatResult, msgResult] = await Promise.all([
        // Fetch other user profile
        supabase
          .from('usuarios')
          .select('nombre, apellidos, foto_perfil')
          .eq('id', otherUserId)
          .single(),
        // Fetch chat data
        supabase
          .from('chats')
          .select('*')
          .eq('id', chatId)
          .limit(1)
          .maybeSingle(),
        // Fetch messages with pagination
        supabase
          .from('mensajes')
          .select('*')
          .eq('chat_id', chatId)
          .order('fecha_creacion', { ascending: true })
          .limit(50),
      ]);

      if (otherResult.data) setOtherUser(otherResult.data);

      const chatData = chatResult.data;
      const chatError = chatResult.error;
      if (chatError) throw chatError;
      if (!chatData) {
        setLoading(false);
        return;
      }
      setChatInfo(chatData);

      const isClient = chatData.cliente_id === user.id;

      // Parallelize jobData and proServices (both depend on chatData)
      const [jobResult, proServicesResult] = await Promise.all([
        supabase
          .from('trabajos')
          .select('*, perfiles_profesionales(profesion, categoria)')
          .eq('chat_id', chatId)
          .order('fecha_creacion', { ascending: false })
          .limit(1)
          .maybeSingle(),
        isClient
          ? supabase
              .from('perfiles_profesionales')
              .select('*')
              .eq('usuario_id', chatData.profesional_id)
              .order('esta_activo', { ascending: false })
          : Promise.resolve({ data: null }),
      ]);

      const jobData = jobResult.data;

      if (jobData) {
        if (jobData.estado === 'cancelled') {
          setActiveJob(null);
          setIsReviewed(false);
          setAbortInfo(null);
        } else {
          setActiveJob(jobData);
          
          // Check if client already reviewed this specific job (trabajo_id)
          const clientUserId = chatData.cliente_id;
          let reviewQuery = supabase
            .from('resenas')
            .select('id')
            .eq('cliente_id', clientUserId);

          if (jobData.id) {
            reviewQuery = reviewQuery.eq('trabajo_id', jobData.id);
          } else {
            reviewQuery = reviewQuery.eq('perfil_profesional_id', jobData.perfil_profesional_id).is('trabajo_id', null);
          }

          const { data: reviewData } = await reviewQuery.limit(1).maybeSingle();
          
          setIsReviewed(!!reviewData);

          if (jobData.estado === 'rejected') {
            const { data: jobNotifs } = await supabase
              .from('notificaciones')
              .select('*')
              .like('cuerpo', `%ID del Trabajo: ${jobData.id}%`)
              .order('fecha_creacion', { ascending: false });

            const notifList = jobNotifs || [];

            // Consultamos registros del sistema (usuario_id null) para trazabilidad compartida
            const { data: systemNotifs } = await supabase
              .from('notificaciones')
              .select('*')
              .is('usuario_id', null)
              .like('cuerpo', `%ID del Trabajo: ${jobData.id}%`)
              .limit(5);

            const allNotifList = [...notifList, ...(systemNotifs || [])];

            // Si fue una cancelación del cliente antes de que el profesional respondiera, no mostrar nada a ninguno
            const wasCancelledByClient = allNotifList.some(n => 
              n.titulo?.includes('cancelada por el cliente') || 
              n.cuerpo?.includes('El cliente canceló la solicitud antes de ser aceptada')
            );

            if (wasCancelledByClient) {
              setActiveJob(null);
              setIsReviewed(false);
              setAbortInfo(null);
            } else {
              // Verificar en almacenamiento local si fue rechazo inicial por el profesional
              const localInitialRejection = await AsyncStorage.getItem(`initial_rejected_by_pro_${jobData.id}`);

              const isInitialRejection = localInitialRejection === 'true' || allNotifList.some(n => 
                n.titulo?.includes('Solicitud rechazada') || 
                n.cuerpo?.includes('RechazoInicial')
              );

              const hasRequestedReview = notifList.some(n => 
                n.titulo?.includes('revisión') || 
                n.titulo?.includes('Revisión') || 
                n.cuerpo?.includes('revisar') ||
                n.titulo?.includes('APELACIÓN')
              );
              const hasAccepted = notifList.some(n => 
                n.titulo?.includes('Aceptada') || 
                n.titulo?.includes('aceptada')
              );

              // Verificar si el usuario descartó localmente el aviso de revisión de la pantalla
              const dismissedReviewLocal = await AsyncStorage.getItem(`dismissed_review_${jobData.id}`);
              const hasDismissedReview = dismissedReviewLocal === 'true';

              // Verificar si el usuario descartó localmente el aviso de solicitud rechazada
              const dismissedNoticeLocal = await AsyncStorage.getItem(`dismissed_job_${jobData.id}`);
              const hasDismissedNotice = dismissedNoticeLocal === 'true';

              // Limpiar notificaciones huérfanas de 'Revisión descartada' si existían previamente
              if (notifList.some(n => n.titulo?.includes('Revisión descartada'))) {
                await supabase.from('notificaciones').delete().eq('usuario_id', user.id).eq('titulo', 'Revisión descartada');
              }
              
              const abortNotif = notifList.find(n => 
                n.titulo?.includes('cancelado') || 
                n.titulo?.includes('Cancelaste') || 
                n.titulo?.includes('Abortado')
              );

              let isAbortedByMe = false;
              if (abortNotif) {
                if (abortNotif.cuerpo?.includes(`CanceladoPor: ${user.id}`) || abortNotif.cuerpo?.includes(`AbortadoPor: ${user.id}`)) {
                  isAbortedByMe = true;
                } else if (abortNotif.titulo?.includes('Cancelaste') || abortNotif.titulo?.includes('REPORTE')) {
                  isAbortedByMe = true;
                }
              }

              setAbortInfo({
                isAbortedByMe,
                isInitialRejection,
                hasRequestedReview,
                hasAccepted,
                hasDismissedReview,
                hasDismissedNotice,
              });
            }
          } else {
            setAbortInfo(null);
          }
        }
      } else {
        setActiveJob(null);
        setIsReviewed(false);
        setAbortInfo(null);
      }

      if (isClient && proServicesResult.data) {
        setProfessionalServices(proServicesResult.data);
      }

      if (msgResult.data) {
        let displayMessages = msgResult.data;
        const deletionDate = isClient ? chatData.borrado_cliente_en : chatData.borrado_profesional_en;
        if (deletionDate) {
          displayMessages = displayMessages.filter(
            (m: Message) => new Date(m.fecha_creacion).getTime() > new Date(deletionDate).getTime()
          );
        }

        // Preserve any pending optimistic messages that haven't been confirmed yet
        setMessages((prev) => {
          const pendingOptimistic = prev.filter((m) => m.id.startsWith('temp-'));
          if (pendingOptimistic.length === 0) {
            return displayMessages;
          }
          const combined = [...displayMessages];
          for (const opt of pendingOptimistic) {
            const alreadyExists = combined.some(
              (m) => m.remitente_id === opt.remitente_id && m.contenido === opt.contenido
            );
            if (!alreadyExists) {
              combined.push(opt);
            }
          }
          return combined;
        });

        // Mark all messages from the other user as read
        await supabase
          .from('mensajes')
          .update({ leido: true })
          .eq('chat_id', chatId)
          .neq('remitente_id', user.id)
          .eq('leido', false);
      }

    } catch (e) {
      console.error('Error fetching chat data:', e);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, [chatId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync latest messages fallback (lightweight query for messages newer than latest local)
  const syncNewMessages = useCallback(async () => {
    if (!chatId) return;
    try {
      const user = currentUserRef.current;
      if (!user) return;

      const currentList = messagesRef.current;
      const confirmed = currentList.filter((m) => !m.id.startsWith('temp-'));
      const lastMsgDate = confirmed.length > 0 ? confirmed[confirmed.length - 1].fecha_creacion : null;

      let query = supabase
        .from('mensajes')
        .select('*')
        .eq('chat_id', chatId)
        .order('fecha_creacion', { ascending: true });

      if (lastMsgDate) {
        query = query.gt('fecha_creacion', lastMsgDate);
      } else {
        query = query.limit(50);
      }

      const { data: newMsgs, error } = await query;
      if (error || !newMsgs || newMsgs.length === 0) return;

      let filteredNewMsgs = newMsgs;
      if (chatInfo) {
        const isClientUser = chatInfo.cliente_id === user.id;
        const deletionDate = isClientUser ? chatInfo.borrado_cliente_en : chatInfo.borrado_profesional_en;
        if (deletionDate) {
          filteredNewMsgs = filteredNewMsgs.filter(
            (m: Message) => new Date(m.fecha_creacion).getTime() > new Date(deletionDate).getTime()
          );
        }
      }

      if (filteredNewMsgs.length === 0) return;

      // Mark unread from other user as read
      const unreadIds = filteredNewMsgs
        .filter((m) => m.remitente_id !== user.id && !m.leido)
        .map((m) => m.id);
      if (unreadIds.length > 0) {
        supabase.from('mensajes').update({ leido: true }).in('id', unreadIds).then();
      }

      setMessages((prev) => {
        let updated = [...prev];
        let hasChanges = false;
        for (const nm of filteredNewMsgs) {
          if (updated.some((m) => m.id === nm.id)) continue;
          const tempIdx = updated.findIndex(
            (m) => m.id.startsWith('temp-') && m.contenido === nm.contenido && m.remitente_id === nm.remitente_id
          );
          if (tempIdx !== -1) {
            updated[tempIdx] = nm;
            hasChanges = true;
          } else {
            updated.push(nm);
            hasChanges = true;
          }
        }
        return hasChanges ? updated : prev;
      });
    } catch {
      // Quietly ignore background sync errors
    }
  }, [chatId, chatInfo]);

  // Sync job status fallback (detects hire, accept, reject, complete, abort without lag)
  const syncJobStatus = useCallback(async () => {
    if (!chatId) return;
    try {
      const { data: latestJob, error } = await supabase
        .from('trabajos')
        .select('*, perfiles_profesionales(profesion, categoria)')
        .eq('chat_id', chatId)
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) return;

      const current = activeJobRef.current;

      let reviewChanged = false;
      if (latestJob?.estado === 'completed') {
        const clientUserId = chatInfoRef.current?.cliente_id;
        if (clientUserId) {
          let revQuery = supabase
            .from('resenas')
            .select('id')
            .eq('cliente_id', clientUserId);

          if (latestJob.id) {
            revQuery = revQuery.eq('trabajo_id', latestJob.id);
          } else {
            revQuery = revQuery.eq('perfil_profesional_id', latestJob.perfil_profesional_id).is('trabajo_id', null);
          }

          const { data: rev } = await revQuery.limit(1).maybeSingle();
          if (!!rev !== isReviewedRef.current) {
            reviewChanged = true;
          }
        }
      }

      const hasChanged =
        (!current && latestJob && latestJob.estado !== 'cancelled') ||
        (current && !latestJob) ||
        (current && latestJob && (
          current.id !== latestJob.id ||
          current.estado !== latestJob.estado ||
          current.fecha_actualizacion !== latestJob.fecha_actualizacion
        )) ||
        reviewChanged;

      if (hasChanged) {
        await fetchData();
      }
    } catch {
      // Quietly ignore background sync errors
    }
  }, [chatId, fetchData]);

  // Sync on navigation focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchData();
      syncNewMessages();
      syncJobStatus();
    });
    return unsubscribe;
  }, [navigation, fetchData, syncNewMessages, syncJobStatus]);

  // Periodic fallback sync while chat is open (every 3 seconds)
  useEffect(() => {
    if (!chatId) return;
    const interval = setInterval(() => {
      syncNewMessages();
      syncJobStatus();
    }, 3000);
    return () => clearInterval(interval);
  }, [chatId, syncNewMessages, syncJobStatus]);

  // Sync when app returns to active/foreground
  useEffect(() => {
    const handleAppStateChange = (nextState: string) => {
      if (nextState === 'active') {
        syncNewMessages();
        syncJobStatus();
      }
    };
    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => sub.remove();
  }, [syncNewMessages, syncJobStatus]);

  // Sync on web window focus
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const onFocus = () => {
        syncNewMessages();
        syncJobStatus();
      };
      window.addEventListener('focus', onFocus);
      return () => window.removeEventListener('focus', onFocus);
    }
  }, [syncNewMessages, syncJobStatus]);

  // Real-time channel: Broadcast + Postgres Changes
  useEffect(() => {
    if (!chatId) return;

    const channelName = `chat-room:${chatId}`;

    const existing = supabase.getChannels().find((ch) => ch.topic === `realtime:${channelName}`);
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: { self: false },
      },
    });

    // 1. Instant peer-to-peer Broadcast listener (0ms latency WebSocket)
    channel.on('broadcast', { event: 'new_message' }, ({ payload }) => {
      const newMsg = payload as Message;
      if (!newMsg || newMsg.chat_id !== chatId) return;

      const user = currentUserRef.current;
      if (user && newMsg.remitente_id !== user.id) {
        supabase
          .from('mensajes')
          .update({ leido: true })
          .eq('id', newMsg.id)
          .then();
      }

      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        const tempIdx = prev.findIndex(
          (m) => m.id.startsWith('temp-') && m.contenido === newMsg.contenido && m.remitente_id === newMsg.remitente_id
        );
        if (tempIdx !== -1) {
          const updated = [...prev];
          updated[tempIdx] = newMsg;
          return updated;
        }
        return [...prev, newMsg];
      });
    });

    // 2. Broadcast for real-time job changes (hire, cancel, complete, reject)
    channel.on('broadcast', { event: 'job_updated' }, ({ payload }) => {
      if (payload?.estado) {
        setActiveJob((prev) => {
          if (!prev) return prev;
          if (payload.jobId && prev.id !== payload.jobId) return prev;
          return { ...prev, estado: payload.estado };
        });
      }
      fetchData();
    });

    // 3. Postgres changes listener (DB WAL replication)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg && newMsg.chat_id === chatId) {
          const user = currentUserRef.current;
          if (user && newMsg.remitente_id !== user.id) {
            supabase
              .from('mensajes')
              .update({ leido: true })
              .eq('id', newMsg.id)
              .then();
          }

          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            const tempIdx = prev.findIndex(
              (m) => m.id.startsWith('temp-') && m.contenido === newMsg.contenido && m.remitente_id === newMsg.remitente_id
            );
            if (tempIdx !== -1) {
              const updated = [...prev];
              updated[tempIdx] = newMsg;
              return updated;
            }
            return [...prev, newMsg];
          });
        }
      }
    );

    // 4. Postgres changes on trabajos and resenas
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'trabajos',
        filter: `chat_id=eq.${chatId}`,
      },
      () => {
        fetchData();
      }
    );

    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'resenas',
      },
      () => {
        fetchData();
      }
    );

    channel.subscribe((status, err) => {
      if (err) {
        console.warn(`[Realtime Chat] Channel status: ${status}`, err);
      }
    });

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      subscriptionRef.current = null;
    };
  }, [chatId, fetchData]);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    const user = currentUser || currentUserRef.current || (await supabase.auth.getUser()).data.user;
    if (!user) {
      console.warn('No hay usuario autenticado para enviar el mensaje.');
      return;
    }

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      remitente_id: user.id,
      contenido: trimmed,
      fecha_creacion: new Date().toISOString(),
    };

    // 1. Inmediato: actualización optimista en pantalla
    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);

    try {
      const isFirstMessage = messagesRef.current.filter((m) => !m.id.startsWith('temp-')).length === 0;

      // 2. Guardar en Base de Datos y obtener el registro creado
      const { data: insertedMsg, error } = await supabase
        .from('mensajes')
        .insert({
          chat_id: chatId,
          remitente_id: user.id,
          contenido: trimmed,
        })
        .select()
        .single();

      if (error) throw error;

      const confirmedMsg = insertedMsg as Message;

      // 3. Confirmar mensaje optimista con el ID real de BD
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? confirmedMsg : m))
      );

      // 4. Broadcast instantáneo por WebSocket a la contraparte
      if (subscriptionRef.current) {
        subscriptionRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: confirmedMsg,
        });
      }

      // 5. Si es el primer mensaje y quien envía es el cliente, notificar al profesional
      if (isFirstMessage && chatInfo && chatInfo.cliente_id === user.id) {
        supabase
          .from('notificaciones')
          .insert({
            usuario_id: chatInfo.profesional_id,
            titulo: 'Nuevo mensaje 💬',
            cuerpo: 'Tienes mensajes nuevos, revisa tu bandeja.',
            leido: false,
          })
          .then();
      }

      // 6. Si el chat estaba oculto para alguna de las partes, desocultarlo
      supabase
        .from('chats')
        .update({
          oculto_cliente: false,
          oculto_profesional: false,
        })
        .eq('id', chatId)
        .then();

    } catch (e: any) {
      console.error('Error sending message:', e);
      // Revertir mensaje optimista si falló el envío
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      const msg = 'No se pudo enviar el mensaje.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setSending(false);
    }
  };

  const requestJob = async (professionalProfileId: string) => {
    try {
      setLoading(true);
      const { data: newJob, error } = await supabase.from('trabajos').insert({
        chat_id: chatId,
        cliente_id: currentUser.id,
        perfil_profesional_id: professionalProfileId,
        estado: 'pending'
      }).select().single();
      if (error) throw error;

      // Broadcast inmediato con payload para actualización instantánea
      broadcastJobUpdate({ jobId: newJob?.id, estado: 'pending', action: 'job_requested' });

      if (chatInfo?.profesional_id) {
        const { data: clientProfile } = await supabase
          .from('usuarios')
          .select('nombre, apellidos')
          .eq('id', currentUser.id)
          .maybeSingle();

        const clientFullName = clientProfile ? `${clientProfile.nombre} ${clientProfile.apellidos}`.trim() : 'Un cliente';

        await supabase.from('notificaciones').insert({
          usuario_id: chatInfo.profesional_id,
          titulo: '¡Solicitud de contratación! 📋',
          cuerpo: `${clientFullName} desea contratar tus servicios. Revisa el chat para aceptar o rechazar.`,
          leido: false
        });
      }

      await fetchData();
    } catch (e) {
      console.error(e);
      const msg = 'No se pudo enviar la solicitud.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, estado: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('trabajos')
        .update({ estado, fecha_actualizacion: new Date().toISOString() })
        .eq('id', jobId);
      if (error) throw error;

      // Broadcast inmediato con payload de estado
      broadcastJobUpdate({ jobId, estado, action: 'status_updated' });

      if (chatInfo) {
        const isClient = chatInfo.cliente_id === currentUser?.id;
        const targetUserId = isClient ? chatInfo.profesional_id : chatInfo.cliente_id;
        let notifTitle = '';
        let notifBody = '';

        if (estado === 'accepted') {
          notifTitle = '¡Solicitud aceptada! 🔨';
          notifBody = 'El profesional ha aceptado el trabajo. El servicio está en curso.';
        } else if (estado === 'rejected') {
          notifTitle = 'Servicio cancelado ❌';
          notifBody = 'El servicio ha sido cancelado o abortado.';
        } else if (estado === 'completed') {
          notifTitle = '¡Trabajo finalizado! ✅';
          notifBody = 'El profesional ha finalizado el trabajo. ¡Ya puedes calificar el servicio!';
        }

        if (notifTitle && targetUserId) {
          await supabase.from('notificaciones').insert({
            usuario_id: targetUserId,
            titulo: notifTitle,
            cuerpo: notifBody,
            leido: false,
          });
        }
      }

      await fetchData();
    } catch (e) {
      console.error(e);
      const msg = 'No se pudo actualizar el estado.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const leaveReview = () => {
    if (!activeJob || activeJob.estado !== 'completed') return;
    navigation.navigate('WriteReview', { 
      professionalId: chatInfo.profesional_id, 
      profileId: activeJob.perfil_profesional_id,
      jobId: activeJob.id
    });
  };

  const reportIncongruency = async (reason: string, description?: string): Promise<boolean> => {
    try {
      setLoading(true);
      const otherUserName = otherUser ? `${otherUser.nombre} ${otherUser.apellidos || ''}`.trim() : 'el otro usuario';
      const success = await submitChatReport({
        chatId,
        isProfessional,
        otherUserName,
        reason,
        description,
      });
      return success;
    } catch (e) {
      console.error('Error reporting chat:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const abortJob = async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error: jobError } = await supabase
        .from('trabajos')
        .update({
          estado: 'rejected',
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Broadcast inmediato con payload
      broadcastJobUpdate({ jobId, estado: 'rejected', action: 'job_aborted', abortedBy: currentUser?.id });

      const userIsClient = chatInfo?.cliente_id === currentUser?.id;
      const targetUserId = userIsClient ? chatInfo?.profesional_id : chatInfo?.cliente_id;
      const professionName = activeJob?.perfiles_profesionales?.profesion || 'Servicio';

      // 1. Notificación a la contraparte avisando que se canceló el servicio
      if (targetUserId) {
        await supabase.from('notificaciones').insert({
          usuario_id: targetUserId,
          titulo: 'Servicio cancelado',
          cuerpo: `El servicio de ${professionName} ha sido cancelado.`,
          leido: false,
        });
      }

      // 2. Registro de trazabilidad en sistema (usuario_id null para no enviar notificación innecesaria a quien lo canceló)
      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: 'Servicio cancelado (sistema)',
        cuerpo: `El servicio de ${professionName} fue cancelado.\n\nID del Trabajo: ${jobId}\nID del Chat: ${chatId}\nCanceladoPor: ${currentUser?.id}`,
        leido: true,
      });

      await fetchData();
      return true;
    } catch (e: any) {
      console.error('Error aborting job:', e);
      const msg = 'No se pudo cancelar el servicio.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const acceptJobCancellation = async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const professionName = activeJob?.perfiles_profesionales?.profesion || 'Servicio';

      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: 'Cancelación aceptada',
        cuerpo: `Aceptación de cancelación del servicio de ${professionName}.\n\nID del Trabajo: ${jobId}\nID del Chat: ${chatId}\nAceptadoPor: ${currentUser.id}`,
        leido: true,
      });

      await AsyncStorage.setItem(`dismissed_job_${jobId}`, 'true');
      setAbortInfo(prev => prev ? { ...prev, hasAccepted: true, hasDismissedNotice: true } : null);

      // Broadcast inmediato a la contraparte
      broadcastJobUpdate({ jobId, action: 'cancellation_accepted' });

      await fetchData();
      return true;
    } catch (e) {
      console.error('Error accepting job cancellation:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const requestCaseReview = async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const userIsClient = chatInfo?.cliente_id === currentUser?.id;
      const userRole = userIsClient ? 'Cliente' : 'Profesional';
      const otherUserName = otherUser ? `${otherUser.nombre} ${otherUser.apellidos}`.trim() : 'Usuario';
      const professionName = activeJob?.perfiles_profesionales?.profesion || 'Servicio';

      const { data: myProfile } = await supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id', currentUser.id)
        .maybeSingle();

      const myFullName = myProfile ? `${myProfile.nombre} ${myProfile.apellidos}`.trim() : 'Un usuario';

      // 1. Notificación al Administrador para que revise el caso
      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: `⚠️ Solicitud de revisión de caso - ${professionName}`,
        cuerpo: `El ${userRole} ${myFullName} solicita que la administración revise el caso del servicio cancelado de ${professionName}.\n\n` +
                `Contraparte que canceló: ${otherUserName}\n` +
                `ID del Trabajo: ${jobId}\n` +
                `ID del Chat: ${chatId}\n` +
                `SolicitadoPor: ${currentUser.id}`,
        leido: false,
      });

      // 2. Registro local para marcar que la revisión fue solicitada (usuario_id null para no auto-notificar)
      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: 'Revisión solicitada',
        cuerpo: `Se solicitó a la administración revisar el caso del servicio de ${professionName}.\n\nID del Trabajo: ${jobId}\nID del Chat: ${chatId}\nSolicitadoPor: ${currentUser.id}`,
        leido: true,
      });

      // Broadcast inmediato a la contraparte
      broadcastJobUpdate({ jobId, action: 'case_review_requested' });

      const msg = 'Tu solicitud de revisión fue enviada al administrador.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Solicitud enviada', msg);

      await fetchData();
      return true;
    } catch (e) {
      console.error('Error requesting case review:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissReviewNotice = async (jobId: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(`dismissed_review_${jobId}`, 'true');
      setAbortInfo(prev => prev ? { ...prev, hasDismissedReview: true } : null);
      return true;
    } catch (e) {
      console.error('Error dismissing review notice:', e);
      return false;
    }
  };

  const rejectJobRequest = async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error: jobError } = await supabase
        .from('trabajos')
        .update({
          estado: 'rejected',
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Broadcast inmediato con payload de rechazo
      broadcastJobUpdate({ jobId, estado: 'rejected', action: 'job_rejected' });

      const professionName = activeJob?.perfiles_profesionales?.profesion || 'Servicio';

      // 1. Notificación al cliente de que su solicitud fue rechazada
      if (chatInfo?.cliente_id) {
        await supabase.from('notificaciones').insert({
          usuario_id: chatInfo.cliente_id,
          titulo: 'Solicitud rechazada',
          cuerpo: `El profesional no pudo aceptar tu solicitud de ${professionName}.\n\nID del Trabajo: ${jobId}\nID del Chat: ${chatId}\nTipo: RechazoInicial`,
          leido: false,
        });
      }

      // 2. Registro de trazabilidad en sistema (usuario_id: null para no enviar spam a bandejas)
      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: 'Solicitud rechazada (inicial)',
        cuerpo: `El profesional rechazó la solicitud inicial de ${professionName}.\n\nID del Trabajo: ${jobId}\nID del Chat: ${chatId}\nTipo: RechazoInicial\nRechazadoPor: ${currentUser?.id}`,
        leido: true,
      });

      // Guardar también localmente para que el profesional sepa que él rechazó la solicitud
      await AsyncStorage.setItem(`initial_rejected_by_pro_${jobId}`, 'true');

      await fetchData();
      return true;
    } catch (e: any) {
      console.error('Error rejecting job request:', e);
      const msg = 'No se pudo rechazar la solicitud.';
      if (Platform.OS === 'web') window.alert(msg);
      else Alert.alert('Error', msg);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelPendingRequest = async (jobId: string): Promise<boolean> => {
    try {
      setLoading(true);
      const { error: jobError } = await supabase
        .from('trabajos')
        .update({
          estado: 'cancelled',
          fecha_actualizacion: new Date().toISOString(),
        })
        .eq('id', jobId);

      if (jobError) throw jobError;

      // Broadcast inmediato de cancelación
      broadcastJobUpdate({ jobId, estado: 'cancelled', action: 'request_cancelled' });

      // Limpiar registros locales si existieran
      await AsyncStorage.removeItem(`initial_rejected_by_pro_${jobId}`);
      await AsyncStorage.removeItem(`dismissed_job_${jobId}`);

      // Limpiar notificaciones previas vinculadas a este trabajo
      await supabase
        .from('notificaciones')
        .delete()
        .like('cuerpo', `%ID del Trabajo: ${jobId}%`);

      setActiveJob(null);
      setAbortInfo(null);
      setIsReviewed(false);

      await fetchData();
      return true;
    } catch (e: any) {
      console.error('Error canceling pending request:', e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const dismissJobNotice = async (jobId: string): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(`dismissed_job_${jobId}`, 'true');
      setAbortInfo(prev => prev ? { ...prev, hasDismissedNotice: true } : null);
      return true;
    } catch (e) {
      console.error('Error dismissing job notice:', e);
      return false;
    }
  };

  const isClient = useMemo(() => chatInfo?.cliente_id === currentUser?.id, [chatInfo, currentUser]);
  const isProfessional = useMemo(() => chatInfo?.profesional_id === currentUser?.id, [chatInfo, currentUser]);

  const proProfession = useMemo(() => {
    const jobProf = Array.isArray(activeJob?.perfiles_profesionales)
      ? (activeJob?.perfiles_profesionales as any)[0]?.profesion
      : (activeJob?.perfiles_profesionales as any)?.profesion;
    if (jobProf) return jobProf;
    if (professionalServices && professionalServices.length > 0) {
      return professionalServices[0]?.profesion || professionalServices[0]?.categoria || null;
    }
    return null;
  }, [activeJob, professionalServices]);

  return {
    loading,
    sending,
    currentUser,
    chatInfo,
    activeJob,
    professionalServices,
    proProfession,
    messages,
    abortInfo,
    isClient,
    isProfessional,
    isReviewed,
    otherUser,
    sendMessage,
    requestJob,
    updateJobStatus,
    abortJob,
    rejectJobRequest,
    cancelPendingRequest,
    acceptJobCancellation,
    requestCaseReview,
    dismissReviewNotice,
    dismissJobNotice,
    leaveReview,
    reportIncongruency,
    refetch: fetchData
  };
}
