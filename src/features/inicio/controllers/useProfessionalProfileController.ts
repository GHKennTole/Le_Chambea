import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../../services/supabase';
import type { ProfessionalProfile } from '../../perfil/models/profile.types';
import { CATEGORIES } from '../../../shared/constants/categories';

const MAX_SERVICES = 3;

export function useProfessionalProfileController() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPortafolio, setUploadingPortafolio] = useState(false);
  const [services, setServices] = useState<ProfessionalProfile[]>([]);
  const [initialServices, setInitialServices] = useState<ProfessionalProfile[]>([]);
  const [userLocation, setUserLocation] = useState('');
  const [activeServiceIndex, setActiveServiceIndex] = useState(0);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('usuarios')
        .select('ciudad')
        .eq('id', user.id)
        .maybeSingle();

      const userCity = userData?.ciudad || '';
      setUserLocation(userCity);

      const { data, error } = await supabase
        .from('perfiles_profesionales')
        .select('*')
        .eq('usuario_id', user.id)
        .order('indice_servicio', { ascending: true });

      if (error) {
        console.error('Error fetching pro profile:', error);
        return;
      }

      let parsedData: ProfessionalProfile[] = [];

      if (data && data.length > 0) {
        parsedData = data.map(item => ({
          ...item,
          zona: item.zona || userCity,
          portafolio: Array.isArray(item.portafolio) ? item.portafolio : [],
        }));
      } else {
        // Init first service
        parsedData = [{
          id: '',
          usuario_id: user.id,
          indice_servicio: 0,
          categoria: '',
          profesion: '',
          descripcion: '',
          rango_precio: '',
          zona: userCity,
          esta_activo: true,
          portafolio: [],
        }];
      }

      setServices(parsedData);
      setInitialServices(JSON.parse(JSON.stringify(parsedData)));
      setActiveServiceIndex(0);
    } catch (e) {
      console.error('Error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const activeService = services[activeServiceIndex] || null;

  const hasChanges = useMemo(() => {
    if (!activeService) return false;
    if (!activeService.id) return true; // Brand new service
    const initial = initialServices[activeServiceIndex];
    if (!initial) return true;

    return (
      (activeService.categoria || '') !== (initial.categoria || '') ||
      (activeService.profesion || '') !== (initial.profesion || '') ||
      (activeService.descripcion || '') !== (initial.descripcion || '') ||
      (activeService.rango_precio || '') !== (initial.rango_precio || '') ||
      (activeService.zona || '') !== (initial.zona || '') ||
      activeService.esta_activo !== initial.esta_activo ||
      JSON.stringify(activeService.portafolio || []) !== JSON.stringify(initial.portafolio || [])
    );
  }, [activeService, initialServices, activeServiceIndex]);

  const updateField = (field: keyof ProfessionalProfile, value: any) => {
    setServices(prev => {
      const newServices = [...prev];
      if (newServices[activeServiceIndex]) {
        newServices[activeServiceIndex] = { ...newServices[activeServiceIndex], [field]: value };
      }
      return newServices;
    });
  };

  const addPortfolioImage = async () => {
    try {
      if (!activeService) return;
      const currentList = activeService.portafolio || [];
      const remainingSlots = 10 - currentList.length;
      if (remainingSlots <= 0) {
        Alert.alert("Límite alcanzado", "Puedes subir hasta un máximo de 10 fotos a tu portafolio.");
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la galería para agregar fotos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;

      setUploadingPortafolio(true);
      const newUrls: string[] = [];

      for (const asset of result.assets) {
        const fileExt = asset.uri.split('.').pop() ?? 'jpg';
        const fileName = `${activeService.usuario_id}/portafolio_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const arrayBuffer = await new Response(blob).arrayBuffer();

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, arrayBuffer, {
            contentType: asset.mimeType ?? 'image/jpeg',
            cacheControl: '3600000',
            upsert: true,
          });

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          newUrls.push(urlData.publicUrl + '?t=' + Date.now());
        }
      }

      if (newUrls.length > 0) {
        updateField('portafolio', [...currentList, ...newUrls]);
      } else {
        Alert.alert('Error', 'No se pudieron subir las imágenes seleccionadas.');
      }
    } catch (e) {
      console.error('Portfolio image error:', e);
      Alert.alert('Error', 'Ocurrió un error al seleccionar las imágenes.');
    } finally {
      setUploadingPortafolio(false);
    }
  };

  const removePortfolioImage = (urlToRemove: string) => {
    if (!activeService) return;
    const currentList = activeService.portafolio || [];
    const updatedList = currentList.filter(url => url !== urlToRemove);
    updateField('portafolio', updatedList);
  };

  const saveProfile = async () => {
    if (!activeService) return;
    const effectiveZona = userLocation || activeService.zona || '';
    
    if (
      !activeService.categoria?.trim() ||
      !activeService.profesion?.trim() ||
      !activeService.descripcion?.trim() ||
      !activeService.rango_precio?.trim() ||
      !effectiveZona?.trim()
    ) {
      Alert.alert(
        'Campos incompletos',
        'Por favor completa todos los campos para guardar tu servicio profesional.'
      );
      return;
    }

    try {
      setSaving(true);
      const isNew = !activeService.id;

      if (isNew) {
        const { data, error } = await supabase
          .from('perfiles_profesionales')
          .insert({
            usuario_id: activeService.usuario_id,
            indice_servicio: activeService.indice_servicio,
            categoria: activeService.categoria,
            profesion: activeService.profesion,
            descripcion: activeService.descripcion,
            rango_precio: activeService.rango_precio,
            zona: effectiveZona,
            esta_activo: activeService.esta_activo,
            portafolio: activeService.portafolio || [],
          })
          .select()
          .single();

        if (error) {
          console.error('Insert error:', error);
          Alert.alert('Error', 'No se pudo crear el perfil profesional.');
          return;
        }

        setServices(prev => {
          const newServices = [...prev];
          newServices[activeServiceIndex] = data;
          setInitialServices(JSON.parse(JSON.stringify(newServices)));
          return newServices;
        });

      } else {
        const { error } = await supabase
          .from('perfiles_profesionales')
          .update({
            categoria: activeService.categoria,
            profesion: activeService.profesion,
            descripcion: activeService.descripcion,
            rango_precio: activeService.rango_precio,
            zona: effectiveZona,
            esta_activo: activeService.esta_activo,
            portafolio: activeService.portafolio || [],
          })
          .eq('id', activeService.id);

        if (error) {
          console.error('Update error:', error);
          Alert.alert('Error', 'No se pudo actualizar el perfil profesional.');
          return;
        }

        setInitialServices(JSON.parse(JSON.stringify(services)));
      }

      Alert.alert('Éxito', isNew ? 'Perfil profesional creado.' : 'Perfil profesional actualizado.');
    } catch (e) {
      console.error('Save error:', e);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = () => {
    if (!activeService) return;
    updateField('esta_activo', !activeService.esta_activo);
  };

  const addService = async () => {
    if (services.length >= MAX_SERVICES) {
      Alert.alert('Límite', 'No puedes tener más de 3 servicios profesionales.');
      return;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Find first missing index (0, 1, 2)
    const existingIndices = services.map(s => s.indice_servicio);
    let nextIndex = 0;
    for (let i = 0; i < MAX_SERVICES; i++) {
      if (!existingIndices.includes(i)) {
        nextIndex = i;
        break;
      }
    }

    setServices(prev => [
      ...prev,
      {
        id: '',
        usuario_id: user.id,
        indice_servicio: nextIndex,
        categoria: '',
        profesion: '',
        descripcion: '',
        rango_precio: '',
        zona: '',
        esta_activo: true,
      }
    ]);
    setActiveServiceIndex(services.length);
  };

  const removeService = async (indexToRemove: number) => {
    const serviceToRemove = services[indexToRemove];
    if (!serviceToRemove) return;

    Alert.alert(
      "Eliminar servicio",
      "¿Estás seguro de que deseas eliminar este servicio? También se eliminarán las reseñas asociadas.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            if (serviceToRemove.id) {
              setSaving(true);
              const { error } = await supabase
                .from('perfiles_profesionales')
                .delete()
                .eq('id', serviceToRemove.id);
              
              setSaving(false);

              if (error) {
                console.error("Delete error:", error);
                Alert.alert("Error", "No se pudo eliminar el servicio.");
                return;
              }
            }

            setServices(prev => {
              const newArr = prev.filter((_, i) => i !== indexToRemove);
              if (newArr.length === 0 && activeService?.usuario_id) {
                 return [{
                   id: '',
                   usuario_id: activeService.usuario_id,
                   indice_servicio: 0,
                   categoria: '',
                   profesion: '',
                   descripcion: '',
                   rango_precio: '',
                   zona: '',
                   esta_activo: true,
                 }];
              }
              return newArr;
            });
            setActiveServiceIndex(0);
          }
        }
      ]
    );
  };

  return {
    services,
    activeServiceIndex,
    setActiveServiceIndex,
    activeService,
    loading,
    saving,
    hasChanges,
    userLocation,
    uploadingPortafolio,
    categories: CATEGORIES,
    updateField,
    addPortfolioImage,
    removePortfolioImage,
    saveProfile,
    toggleActive,
    addService,
    removeService,
    refetch: fetchProfile,
  };
}
