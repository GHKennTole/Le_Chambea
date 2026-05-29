import { useState } from 'react';
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
      text: '¡Hola! Soy Sula, tu asistente de Le Chambea. 🛠️\n\n¿En qué te puedo ayudar hoy?',
      createdAt: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  // Busca profesionales en Supabase basándose en el término deducido
  const queryProfessionals = async (query: string): Promise<RecommendedProfessional[]> => {
    try {
      const cleanQuery = query.trim().toLowerCase();
      
      // Consultar perfiles de profesionales activos que coincidan en profesión, descripción o categoría
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
        .or(`profesion.ilike.%${cleanQuery}%,categoria.ilike.%${cleanQuery}%,descripcion.ilike.%${cleanQuery}%`)
        .limit(6);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      const profileIds = profilesData.map(p => p.id);

      // Consultar reseñas de estos profesionales para calcular el rating y total de comentarios
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('resenas')
        .select('perfil_profesional_id, calificacion')
        .in('perfil_profesional_id', profileIds);

      if (reviewsError) throw reviewsError;

      // Mapear los profesionales y calcular sus ratings promedio
      return profilesData.map((p: any) => {
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
    } catch (error) {
      console.error('❌ Error buscando profesionales en Supabase:', error);
      return [];
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
      // 1. Construir el historial compatible con Gemini API
      // Transformamos los mensajes locales a formato Gemini
      const geminiHistory: GeminiMessage[] = newMessages.map(msg => ({
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
          console.log(`🤖 Sula solicitó buscar profesionales para: "${searchQuery}"`);

          // 3. Ejecutar la búsqueda de Supabase
          const databaseResults = await queryProfessionals(searchQuery);

          // 4. Construir el historial expandido con la llamada a función y su resultado
          const expandedHistory: GeminiMessage[] = [
            ...geminiHistory,
            // Agregamos la intención de llamada a función del modelo
            {
              role: 'model',
              parts: [
                {
                  functionCall: {
                    name: 'search_professionals',
                    args: { searchQuery }
                  }
                }
              ]
            },
            // Agregamos la respuesta de la base de datos (Supabase) como functionResponse
            {
              role: 'user',
              parts: [
                {
                  functionResponse: {
                    name: 'search_professionals',
                    response: {
                      candidatos: databaseResults.map(p => ({
                        id: p.id,
                        nombre: p.nombre,
                        profesion: p.profesion,
                        calificacion: p.calificacion,
                        total_resenas: p.totalResenas,
                        descripcion: p.descripcion.substring(0, 100) + '...'
                      }))
                    }
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

          // Agregar el mensaje final con las tarjetas de profesionales recomendados adjuntos
          const botMessage: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: finalText || 'He encontrado a algunos profesionales que te pueden ayudar. Puedes revisar sus perfiles a continuación:',
            createdAt: new Date(),
            professionals: databaseResults
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

  return {
    messages,
    loading,
    input,
    setInput,
    handleSend
  };
}
