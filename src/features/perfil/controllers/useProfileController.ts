import { useState, useEffect, useCallback, useRef } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../services/supabase';
import { showAlert } from '../../../shared/utils/customAlert';
import type { UserProfile } from '../models/profile.types';

export function useProfileController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const hasLoadedRef = useRef(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    nombre: '',
    apellidos: '',
    correo: '',
    telefono: '',
    ciudad: '',
    foto_perfil: null,
    fecha_nacimiento: '',
    genero: '',
  });

  const fetchProfile = useCallback(async () => {
    try {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        setProfile({
          id: user.id,
          nombre: data.nombre ?? '',
          apellidos: data.apellidos ?? '',
          correo: data.correo ?? user.email ?? '',
          telefono: data.telefono ?? '',
          ciudad: data.ciudad ?? '',
          foto_perfil: data.foto_perfil ?? null,
          fecha_nacimiento: data.fecha_nacimiento ?? '',
          genero: data.genero ?? '',
        });
      } else {
        setProfile(prev => ({
          ...prev,
          id: user.id,
          correo: user.email ?? '',
        }));
      }
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
      hasLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateField = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showAlert('Permiso denegado', 'Se necesita acceso a la galería.', undefined, 'warning');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.4,
      });

      if (result.canceled || !result.assets[0]) return;

      setUploading(true);
      const asset = result.assets[0];
      const fileExt = asset.uri.split('.').pop() ?? 'jpg';
      const fileName = `${profile.id}/avatar.${fileExt}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          contentType: asset.mimeType ?? 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        showAlert('Error', 'No se pudo subir la imagen.', undefined, 'danger');
        return;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl + '?t=' + Date.now();
      setProfile(prev => ({ ...prev, foto_perfil: publicUrl }));

      await supabase
        .from('usuarios')
        .update({ foto_perfil: publicUrl })
        .eq('id', profile.id);
    } catch (e) {
      console.error('Pick image error:', e);
      showAlert('Error', 'Ocurrió un error al seleccionar la imagen.', undefined, 'danger');
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      const { error } = await supabase
        .from('usuarios')
        .upsert({
          id: profile.id,
          nombre: profile.nombre,
          apellidos: profile.apellidos,
          correo: profile.correo,
          telefono: profile.telefono,
          ciudad: profile.ciudad,
          foto_perfil: profile.foto_perfil,
          fecha_nacimiento: profile.fecha_nacimiento,
          genero: profile.genero,
        });

      if (error) {
        console.error('Save error:', error);
        showAlert('Error', 'No se pudo guardar el perfil.', undefined, 'danger');
        return;
      }

      showAlert('Éxito', 'Perfil actualizado correctamente.', undefined, 'success');
    } catch (e) {
      console.error('Save error:', e);
      showAlert('Error', 'Ocurrió un error inesperado.', undefined, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return {
    profile,
    loading,
    saving,
    uploading,
    updateField,
    pickImage,
    saveProfile,
    refetch: fetchProfile,
  };
}
