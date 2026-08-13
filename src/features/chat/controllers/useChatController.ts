import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '../../../services/supabase';
import type { Job, ProfessionalProfile } from '../../perfil/models/profile.types';
import { Alert, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export interface Message {
  id: string;
  chat_id: string;
  remitente_id: string;
  contenido: string;
  fecha_creacion: string;
}

export function useChatController(chatId: string, otherUserId: string) {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [chatInfo, setChatInfo] = useState<any>(null);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isReviewed, setIsReviewed] = useState(false);
  const [sending, setSending] = useState(false);
  const navigation = useNavigation<any>();
  const subscriptionRef = useRef<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);
  const currentUserRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
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
              .eq('esta_activo', true)
          : Promise.resolve({ data: null }),
      ]);

      const jobData = jobResult.data;

      if (jobData) {
        setActiveJob(jobData);
        
        // Check if client already reviewed this specific service (perfil_profesional_id)
        const { data: reviewData } = await supabase
          .from('resenas')
          .select('id')
          .eq('cliente_id', user.id)
          .eq('perfil_profesional_id', jobData.perfil_profesional_id)
          .limit(1)
          .maybeSingle();
        
        setIsReviewed(!!reviewData);
      } else {
        setActiveJob(null);
        setIsReviewed(false);
      }

      if (isClient && proServicesResult.data) {
        setProfessionalServices(proServicesResult.data);
      }

      if (msgResult.data) {
        setMessages(msgResult.data);

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
    }
  }, [chatId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!chatId) return;

    const uniqueId = Math.random().toString(36).substring(2, 9);
    const channelName = `chat-${chatId}-${uniqueId}`;

    const channel = supabase
      .channel(channelName)
      .on(
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
            // Since we are looking at this chat right now, mark this message as read in the DB
            const user = currentUserRef.current;
            if (user && newMsg.remitente_id !== user.id) {
              supabase
                .from('mensajes')
                .update({ leido: true })
                .eq('id', newMsg.id)
                .then();
            }

            setMessages((prev) => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
          }
        }
      )
      .on(
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
      )
      .subscribe();

    subscriptionRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, fetchData]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !currentUser || sending) return;
    try {
      setSending(true);
      const { error } = await supabase.from('mensajes').insert({
        chat_id: chatId,
        remitente_id: currentUser.id,
        contenido: text.trim(),
      });
      if (error) throw error;
      // Real-time subscription handles adding the new message
    } catch (e) {
      console.error('Error sending message:', e);
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
      const { error } = await supabase.from('trabajos').insert({
        chat_id: chatId,
        cliente_id: currentUser.id,
        perfil_profesional_id: professionalProfileId,
        estado: 'pending'
      });
      if (error) throw error;
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

  const reportIncongruency = async (reason: string) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: senderProfile } = await supabase
        .from('usuarios')
        .select('nombre, apellidos')
        .eq('id', user.id)
        .single();
      
      const senderFullName = senderProfile ? `${senderProfile.nombre} ${senderProfile.apellidos}`.trim() : 'Un usuario';

      // Insert admin notification (usuario_id = null for system/admin alert)
      await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: `⚠️ REPORTE: Incongruencia en Chat`,
        cuerpo: `El usuario ${senderFullName} reportó una incongruencia en el chat ${chatId}. Motivo: ${reason}`,
        leido: false
      });

      const successMsg = "Gracias por tu reporte. Los administradores han sido notificados.";
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert("Reporte Enviado", successMsg);
    } catch (e) {
      console.error('Error reporting incongruency:', e);
    } finally {
      setLoading(false);
    }
  };

  const isClient = useMemo(() => chatInfo?.cliente_id === currentUser?.id, [chatInfo, currentUser]);
  const isProfessional = useMemo(() => chatInfo?.profesional_id === currentUser?.id, [chatInfo, currentUser]);

  return {
    loading,
    sending,
    currentUser,
    chatInfo,
    activeJob,
    professionalServices,
    messages,
    isClient,
    isProfessional,
    isReviewed,
    otherUser,
    sendMessage,
    requestJob,
    updateJobStatus,
    leaveReview,
    reportIncongruency,
    refetch: fetchData
  };
}
