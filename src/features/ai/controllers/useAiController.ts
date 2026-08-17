import { useState, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import { supabase } from '../../../services/supabase';
import { 
  sendMessageToGemini, 
  GeminiMessage, 
  GeminiMessagePart 
} from '../../../services/gemini';

export type Message = {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  createdAt: Date;
  professionals?: RecommendedProfessional[];
};

export type RecommendedProfessional = {
  id: string;
  usuario_id: string;
  nombre: string;
  profesion: string;
  categoria: string;
  foto: string;
  calificacion: number;
  totalResenas: number;
  descripcion: string;
};

export type QueryProfessionalsResult = {
  chosen: RecommendedProfessional | null;
  totalMatches: number;
  hasMore: boolean;
  allAlreadyShown: boolean;
};

const STOP_WORDS = new Set([
  'de', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'del', 'al',
  'y', 'o', 'en', 'para', 'por', 'con', 'sin', 'sobre', 'que', 'se', 'mi',
  'su', 'tu', 'como', 'busco', 'necesito', 'quiero', 'ayuda', 'servicio',
  'urgente', 'alguien', 'quien', 'haga', 'arregle', 'favor'
]);

function extractKeywords(rawQuery: string): string[] {
  return rawQuery
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/gi, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));
}

const getFriendlyErrorMessage = (errMessage: string): string => {
  const msg = (errMessage || '').toLowerCase();
  
  // 1. No internet or network failure
  if (msg.includes("network request failed") || msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("fetch error")) {
    return "Lo siento mucho, pero parece que no tienes una conexión activa a internet... 🔌\n\nPor favor, revisa tu Wi-Fi o datos móviles e intenta de nuevo en unos momentos.";
  }
  
  // 2. Quota Exceeded (429)
  if (msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("resourceexhausted") || msg.includes("rate limit")) {
    return "Lo siento, pero la bandeja de peticiones está un poco saturada en este momento... ⏳\n\nEstamos procesando muchas consultas simultáneamente. Por favor, regálanos unos segundos e inténtalo nuevamente.";
  }
  
  // 3. Server Busy / Unavailable (503)
  if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("service unavailable")) {
    return "Lo siento, en este momento nuestros servidores de IA están muy congestionados debido a una alta demanda... 🚀\n\nLos servidores están trabajando a tope para procesar todo. Por favor, dale un respiro al bot e intenta de nuevo en un minuto.";
  }
  
  // 4. API / Model Mismatch / Maintenance (400, 404, etc.)
  if (
    msg.includes("400") || 
    msg.includes("404") || 
    msg.includes("invalid json") || 
    msg.includes("not found") || 
    msg.includes("api key") || 
    msg.includes("badrequest")
  ) {
    return "Lo siento, pero las funciones del bot de IA están temporalmente desactivadas o en mantenimiento técnico... 🛠️\n\nEstamos afinando algunos detalles para darte la mejor experiencia posible. ¡Regresaremos muy pronto!";
  }
  
  // 5. Fallback
  return "Lo siento, ha ocurrido un pequeño inconveniente técnico al intentar procesar tu consulta... 🔧\n\nNo te preocupes, ya estamos trabajando para resolverlo. Por favor, intenta de nuevo en unos momentos.";
};

export function useAiController() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Soy Sula, el asistente virtual de Le Chambea. 🛠️\n\n¿En qué te puedo ayudar hoy?',
      createdAt: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  // Registro de IDs de profesionales ya recomendados en la sesión actual para evitar repeticiones inmediatas
  const shownProfessionalIdsRef = useRef<Set<string>>(new Set());

  // Busca profesionales en Supabase basados en coincidencia de palabras clave y selecciona 1 al azar sin favoritismos
  const queryProfessionals = async (query: string): Promise<QueryProfessionalsResult> => {
    try {
      const cleanQuery = query.trim().toLowerCase();
      const keywords = extractKeywords(cleanQuery);

      // Condiciones de búsqueda OR: coincidencia con la frase completa y con palabras clave individuales
      const conditions: string[] = [
        `profesion.ilike.%${cleanQuery}%`,
        `categoria.ilike.%${cleanQuery}%`,
        `descripcion.ilike.%${cleanQuery}%`
      ];

      keywords.forEach(kw => {
        if (kw !== cleanQuery) {
          conditions.push(`profesion.ilike.%${kw}%`);
          conditions.push(`categoria.ilike.%${kw}%`);
          conditions.push(`descripcion.ilike.%${kw}%`);
        }
      });

      const orFilter = Array.from(new Set(conditions)).join(',');

      // Consultar perfiles de profesionales activos que coincidan
      const { data: profilesData, error: profilesError } = await supabase
        .from('perfiles_profesionales')
        .select(`
          id, 
          usuario_id,
          profesion, 
          categoria,
          descripcion,
          esta_activo,
          usuarios:usuario_id(nombre, apellidos, foto_perfil)
        `)
        .eq('esta_activo', true)
        .or(orFilter)
        .limit(30);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) {
        return {
          chosen: null,
          totalMatches: 0,
          hasMore: false,
          allAlreadyShown: false
        };
      }

      const profileIds = profilesData.map(p => p.id);

      // Consultar reseñas de estos profesionales
      const { data: reviewsData } = await supabase
        .from('resenas')
        .select('perfil_profesional_id, calificacion')
        .in('perfil_profesional_id', profileIds);

      // Mapear los profesionales encontrados
      const allMatchingPros: RecommendedProfessional[] = profilesData.map((p: any) => {
        const profileReviews = reviewsData?.filter(r => r.perfil_profesional_id === p.id) || [];
        const count = profileReviews.length;
        const sum = profileReviews.reduce((acc, curr) => acc + curr.calificacion, 0);
        const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

        return {
          id: p.id,
          usuario_id: p.usuario_id,
          nombre: `${p.usuarios?.nombre || 'Profesional'} ${p.usuarios?.apellidos || ''}`.trim(),
          profesion: p.profesion || p.categoria,
          categoria: p.categoria || '',
          foto: p.usuarios?.foto_perfil || 'https://via.placeholder.com/150',
          calificacion: avg,
          totalResenas: count,
          descripcion: p.descripcion || ''
        };
      });

      // FILOSOFÍA DE CERO FAVORITISMO:
      // Filtramos los que no se hayan mostrado todavía en la sesión
      const unshownPros = allMatchingPros.filter(p => !shownProfessionalIdsRef.current.has(p.id));

      let chosenPro: RecommendedProfessional;
      let allAlreadyShown = false;

      if (unshownPros.length > 0) {
        // Seleccionar 1 al azar entre los no mostrados
        const randomIndex = Math.floor(Math.random() * unshownPros.length);
        chosenPro = unshownPros[randomIndex];
        shownProfessionalIdsRef.current.add(chosenPro.id);
      } else {
        // Si todos los candidatos ya fueron mostrados previamente, reiniciar el ciclo y seleccionar 1 al azar
        allAlreadyShown = true;
        const randomIndex = Math.floor(Math.random() * allMatchingPros.length);
        chosenPro = allMatchingPros[randomIndex];
        shownProfessionalIdsRef.current.clear();
        shownProfessionalIdsRef.current.add(chosenPro.id);
      }

      const hasMore = allMatchingPros.length > 1;

      return {
        chosen: chosenPro,
        totalMatches: allMatchingPros.length,
        hasMore,
        allAlreadyShown
      };
    } catch (error) {
      console.error('❌ Error buscando profesionales en Supabase:', error);
      return {
        chosen: null,
        totalMatches: 0,
        hasMore: false,
        allAlreadyShown: false
      };
    }
  };

  // Enviar el mensaje del usuario y procesar la respuesta cognitiva de la IA
  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessageText = input.trim();
    setInput('');
    
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userMessageText,
      createdAt: new Date()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setLoading(true);

    try {
      // 1. Construir el historial compatible con Gemini API (iniciando siempre con rol 'user')
      const conversationMessages = newMessages.filter(msg => msg.id !== 'welcome');
      const geminiHistory: GeminiMessage[] = conversationMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // 2. Enviar petición inicial a Gemini
      const response = await sendMessageToGemini(geminiHistory);

      if (response.error) {
        throw new Error(response.error);
      }

      const candidate = response.candidates?.[0];
      const content = candidate?.content;
      const parts = content?.parts || [];

      // Detectar si el modelo solicitó una llamada a función (Function Calling)
      const functionCallPart = parts.find((p: any) => p.functionCall);

      if (functionCallPart) {
        const { name, args } = functionCallPart.functionCall;

        if (name === 'search_professionals') {
          const searchQuery = args.searchQuery || '';
          console.log(`🤖 Sula solicitó buscar profesional para: "${searchQuery}"`);

          // 3. Ejecutar la búsqueda de Supabase y selección aleatoria equitativa
          const searchResult = await queryProfessionals(searchQuery);

          const functionResponseData = searchResult.chosen
            ? {
                candidato_seleccionado_al_azar: {
                  id: searchResult.chosen.id,
                  nombre: searchResult.chosen.nombre,
                  profesion: searchResult.chosen.profesion,
                  categoria: searchResult.chosen.categoria,
                  descripcion: searchResult.chosen.descripcion
                },
                total_candidatos_coincidentes: searchResult.totalMatches,
                hay_mas_opciones_disponibles: searchResult.hasMore,
                todos_mostrados_previamente: searchResult.allAlreadyShown
              }
            : {
                candidatos_encontrados: 0,
                mensaje: "No se encontraron profesionales con esas palabras clave en la base de datos."
              };

          // 4. Construir el historial expandido con la llamada a función y su resultado
          const expandedHistory: GeminiMessage[] = [
            ...geminiHistory,
            {
              role: 'model',
              parts: parts
            },
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: 'search_professionals',
                    response: functionResponseData
                  }
                }
              ]
            }
          ];

          // 5. Enviar el historial enriquecido de vuelta a Gemini
          const finalResponse = await sendMessageToGemini(expandedHistory);
          const finalCandidate = finalResponse.candidates?.[0];
          const finalParts = finalCandidate?.content?.parts || [];
          const finalText = finalParts.map((p: any) => p.text || '').join('');

          // Agregar el mensaje final con la tarjeta del profesional recomendado adjunta
          const botMessage: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: finalText || 'Te presento la siguiente opción para tu requerimiento. ¿Te parece bien o prefieres que busque a otro profesional?',
            createdAt: new Date(),
            professionals: searchResult.chosen ? [searchResult.chosen] : undefined
          };

          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        // Flujo A: Respuesta de texto directa (DIY / Consejos)
        const textResponse = parts.map((p: any) => p.text || '').join('');
        
        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: textResponse || 'No he podido procesar tu solicitud. Por favor intenta reformular tu consulta.',
          createdAt: new Date()
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error('❌ Error enviando mensaje a Sula:', error);
      
      const errStr = error.message || '';
      const friendlyText = getFriendlyErrorMessage(errStr);
      
      const errorMessage: Message = {
        id: `err-${Date.now()}`,
        sender: 'bot',
        text: friendlyText,
        createdAt: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const reportAiIssue = async (reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let senderName = 'Un usuario';
      if (user) {
        const { data: profile } = await supabase
          .from('usuarios')
          .select('nombre, apellidos')
          .eq('id', user.id)
          .single();
        if (profile) {
          senderName = `${profile.nombre} ${profile.apellidos}`.trim();
        }
      }

      const { error } = await supabase.from('notificaciones').insert({
        usuario_id: null,
        titulo: `🚨 REPORTE: Mal funcionamiento de Sula AI`,
        cuerpo: `El usuario ${senderName} reportó un problema técnico o mal funcionamiento de Sula AI.\n\nDetalle del reporte:\n${reason.trim()}`,
        leido: false,
      });

      if (error) throw error;

      const successMsg = "Gracias por tu reporte. Nuestro equipo técnico revisará el funcionamiento de Sula AI.";
      if (Platform.OS === 'web') window.alert(successMsg);
      else Alert.alert("🚨 Reporte Enviado", successMsg);
      return true;
    } catch (e) {
      console.error('Error reporting AI issue:', e);
      const errMsg = "No se pudo enviar el reporte. Por favor inténtalo de nuevo más tarde.";
      if (Platform.OS === 'web') window.alert(errMsg);
      else Alert.alert("Error", errMsg);
      return false;
    }
  };

  return {
    messages,
    loading,
    input,
    setInput,
    handleSend,
    reportAiIssue
  };
}
