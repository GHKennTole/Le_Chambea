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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUser(user);

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .limit(1)
        .maybeSingle();
      
      if (chatError) throw chatError;
      if (!chatData) {
        setLoading(false);
        return;
      }
      setChatInfo(chatData);

      const isClient = chatData.cliente_id === user.id;

      const { data: jobData, error: jobError } = await supabase
        .from('trabajos')
        .select('*, perfiles_profesionales(profesion, categoria)')
        .eq('chat_id', chatId)
        .order('fecha_creacion', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (jobData) {
        setActiveJob(jobData);
        
        // Check if this specific job already has a review
        const { data: reviewData } = await supabase
          .from('resenas')
          .select('id')
          .eq('trabajo_id', jobData.id)
          .limit(1)
          .maybeSingle();
        
        setIsReviewed(!!reviewData);
      } else {
        setActiveJob(null);
        setIsReviewed(false);
      }

      if (isClient) {
        const { data: proServices } = await supabase
          .from('perfiles_profesionales')
          .select('*')
          .eq('usuario_id', chatData.profesional_id)
          .eq('esta_activo', true);
        if (proServices) setProfessionalServices(proServices);
      }

      const { data: msgData } = await supabase
        .from('mensajes')
        .select('*')
        .eq('chat_id', chatId)
        .order('fecha_creacion', { ascending: true });

      if (msgData) setMessages(msgData);

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
    const channel = supabase
      .channel(`chat-${chatId}`)
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
            setMessages((prev) => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              const next = [...prev, newMsg];
              return next.sort((a, b) => new Date(a.fecha_creacion).getTime() - new Date(b.fecha_creacion).getTime());
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
      
      // Fallback: fetch immediately so the sender sees the message
      const { data: latestMsgs } = await supabase
        .from('mensajes')
        .select('*')
        .eq('chat_id', chatId)
        .order('fecha_creacion', { ascending: true });
      if (latestMsgs) setMessages(latestMsgs);
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
    sendMessage,
    requestJob,
    updateJobStatus,
    leaveReview,
    refetch: fetchData
  };
}
