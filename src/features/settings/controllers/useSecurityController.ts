import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../services/supabase';

export function useSecurityController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [hasPin, setHasPin] = useState(false);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const [mode, setMode] = useState<'SETUP' | 'VERIFY' | 'CHANGE_PASSWORD'>('SETUP');
  const [newPassword, setNewPassword] = useState('');

  const [dbQuestion, setDbQuestion] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const { data, error } = await supabase
        .from('usuarios')
        .select('pin_seguridad, pregunta_seguridad')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      
      if (data && data.pin_seguridad) {
        setHasPin(true);
        setMode('VERIFY');
        setDbQuestion(data.pregunta_seguridad || '¿Cuál es tu color favorito?');
      } else {
        setHasPin(false);
        setMode('SETUP');
      }
    } catch (error) {
      console.error('Error fetching security info:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setupSecurity = async () => {
    if (newPin.length < 4) {
      Alert.alert('Error', 'El PIN debe tener al menos 4 dígitos.');
      return;
    }
    if (!question || !answer) {
      Alert.alert('Error', 'Debes ingresar una pregunta y una respuesta secreta.');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('usuarios')
        .update({
          pin_seguridad: newPin,
          pregunta_seguridad: question,
          respuesta_seguridad: answer.toLowerCase().trim()
        })
        .eq('id', userId);

      if (error) throw error;
      Alert.alert('Éxito', 'Seguridad configurada correctamente.');
      await fetchData();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo configurar la seguridad.');
    } finally {
      setSaving(false);
    }
  };

  const verifySecurity = async () => {
    try {
      setSaving(true);
      const { data, error } = await supabase
        .from('usuarios')
        .select('pin_seguridad, respuesta_seguridad')
        .eq('id', userId)
        .single();

      if (error) throw error;

      const answerMatch = data.respuesta_seguridad === answer.toLowerCase().trim();
      const pinMatch = data.pin_seguridad === pin;

      // You can verify by PIN OR Answer
      if ((pin && pinMatch) || (answer && answerMatch)) {
        setMode('CHANGE_PASSWORD');
      } else {
        Alert.alert('Error', 'El PIN o la respuesta son incorrectos.');
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Error al verificar la seguridad.');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async () => {
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    try {
      setSaving(true);
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      Alert.alert('Éxito', 'Contraseña actualizada correctamente.');
      setMode('VERIFY'); // reset to locked state
      setPin('');
      setAnswer('');
      setNewPassword('');
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'No se pudo actualizar la contraseña. Asegúrate de haber iniciado sesión recientemente.');
    } finally {
      setSaving(false);
    }
  };

  return {
    loading,
    saving,
    hasPin,
    mode,
    pin, setPin,
    newPin, setNewPin,
    question, setQuestion,
    answer, setAnswer,
    newPassword, setNewPassword,
    dbQuestion,
    setupSecurity,
    verifySecurity,
    changePassword,
  };
}
