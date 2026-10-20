import { useState, useRef } from 'react';
import { supabase } from '../../../services/supabase';
import { 
  sendMessageToGemini, 
  GeminiMessage, 
  GeminiMessagePart 
} from '../../../services/gemini';
import { submitAiReport } from '../../../services/reportService';
import { logAiQuery } from '../../../services/aiLogService';
import { CATEGORIES } from '../../../shared/constants/categories';

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

function stripAccentsPreservingEnie(str: string): string {
  return str
    .replace(/[áàäâ]/gi, 'a')
    .replace(/[éèëê]/gi, 'e')
    .replace(/[íìïî]/gi, 'i')
    .replace(/[óòöô]/gi, 'o')
    .replace(/[úùüû]/gi, 'u');
}

/**
 * Extrae la raíz léxica (stem) en español eliminando flexiones de género, número y sufijos de oficio.
 * Ej: 'enfermero', 'enfermera', 'enfermeros' -> 'enferm'
 *     'cocinero', 'cocinera' -> 'cocin'
 *     'plomero', 'plomera', 'plomería' -> 'plom'
 *     'carpintero', 'carpintera' -> 'carpint'
 *     'pintor', 'pintora', 'pintores' -> 'pint'
 *     'electricista', 'electricistas' -> 'electric'
 *     'albañil', 'albañiles' -> 'albañil'
 */
export function getSpanishStem(word: string): string {
  if (!word || word.length < 4) return word;
  const w = stripAccentsPreservingEnie(word.toLowerCase().trim());

  const suffixes = [
    /er[ií]as?$/,          // enfermería, plomería
    /er[oa]s?$/,           // enfermero, enfermera, enfermeros, enfermeras, carpintero
    /(ores|oras|ora|or)$/, // pintor, pintora, pintores, pintoras
    /(istas|ista)$/,       // electricista, electricistas
    /[ií]c[oa]s?$/,        // mecánico, mecánica, médico
    /ari[oa]s?$/,          // veterinario, veterinaria
    /ad[oa]s?$/,           // abogado, abogada
    /(dores|doras|dora|dor)$/, // soldador, soldadora
    /(eros|eras|ero|era)$/,
    /(eñas|eños|eño|eña)$/,
    /(es|s)$/,             // albañiles -> albañil, choferes -> chofer
    /[oa]s?$/              // maestro, maestra
  ];

  for (const regex of suffixes) {
    if (regex.test(w)) {
      const stem = w.replace(regex, '');
      if (stem.length >= 3) return stem;
    }
  }
  return w;
}

export function extractKeywords(rawQuery: string): string[] {
  const baseWords = rawQuery
    .toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/gi, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3 && !STOP_WORDS.has(w));

  const allKeywords = new Set<string>();

  baseWords.forEach(word => {
    allKeywords.add(word);
    const cleanNoAccents = stripAccentsPreservingEnie(word);
    if (cleanNoAccents !== word) {
      allKeywords.add(cleanNoAccents);
    }
    const stem = getSpanishStem(word);
    if (stem && stem.length >= 3) {
      allKeywords.add(stem);
    }
  });

  return Array.from(allKeywords);
}

export function stripContactInfo(text: string): string {
  if (!text) return '';
  return text
    .replace(/(?:(?:escr[ií]beme|cont[aá]ctame|ll[aá]mame|comun[ií]cate|cotizaciones|consultas|pedidos)?\s*(?:al|por|en|v[ií]a|mi)?\s*(?:n[uú]mero\s+de\s+)?(?:celular|tel[eé]fono|whatsapp|wsp|ws|m[oó]vil)?(?:\s+(?:claro|tigo))?[\s:.\-_]*\(?\+?\d{1,4}[^\w\n]*\d{3,4}[^\w\n]*\d{3,4}\)?)/gi, '')
    .replace(/(?:\b|[\(\[])(?:\+?\d{1,4}[\s\-_.]*)?\d{3,4}[\s\-_.]\d{3,4}(?:[\)\]]|\b)/g, '')
    .replace(/\b\d{7,11}\b/g, '')
    .replace(/(?:escr[ií]beme|cont[aá]ctame|ll[aá]mame|comun[ií]cate)?\s*(?:al|por|en|v[ií]a|mi)?\s*(?:celular|tel[eé]fono|whatsapp|wsp|ws)\s*(?:claro|tigo)?\s*[\(\)\s\-_.]*/gi, '')
    .replace(/\s+([.,;:])/g, '$1')
    .replace(/\(\s*\)/g, '')
    .replace(/([.,;:])\s*\1+/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .replace(/[,;:\-]\s*$/, '.')
    .trim();
}

const getFriendlyErrorMessage = (errMessage: string): string => {
  const msg = (errMessage || '').toLowerCase();
  
  // 1. No internet or network failure
  if (msg.includes("network request failed") || msg.includes("failed to fetch") || msg.includes("network error") || msg.includes("fetch error")) {
    return "Lo siento mucho, parece que no tienes una conexión activa a internet... 🔌\n\nPor favor, revisa tu conexión e intenta de nuevo en unos momentos.";
  }
  
  // 2. Quota Exceeded (429)
  if (msg.includes("429") || msg.includes("quota") || msg.includes("resource_exhausted") || msg.includes("resourceexhausted") || msg.includes("rate limit")) {
    return "Lo siento, en este momento estoy recibiendo muchos mensajes simultáneos... ⏳\n\nPor favor, regálame unos segundos e inténtalo nuevamente.";
  }
  
  // 3. Server Busy / Unavailable (503)
  if (msg.includes("503") || msg.includes("unavailable") || msg.includes("high demand") || msg.includes("service unavailable")) {
    return "Lo siento, en este momento hay una gran cantidad de consultas al mismo tiempo... ⏳\n\nPor favor, intenta de nuevo en un minuto.";
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
    return "Lo siento, la asistencia interactiva no está disponible temporalmente... 🛠️\n\nEstamos haciendo mejoras para darte una mejor experiencia. ¡Regresaremos muy pronto!";
  }
  
  // 5. Fallback
  return "Lo siento, ocurrió un pequeño problema al procesar tu consulta... 🔧\n\nPor favor, intenta de nuevo en unos momentos.";
};

export function useAiController() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '¡Hola! Soy Sula, el asistente virtual de **"Le Chambea"**. 🛠️\n\n¿En qué te puedo ayudar hoy?',
      createdAt: new Date()
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');

  // Registro de IDs de profesionales ya recomendados en la sesión actual para evitar repeticiones inmediatas
  const shownProfessionalIdsRef = useRef<Set<string>>(new Set());
  // Referencia al profesional actualmente activo o recomendado en la conversación
  const currentProfessionalRef = useRef<RecommendedProfessional | null>(null);

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
          descripcion: stripContactInfo(p.descripcion || '')
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

    const startTime = Date.now();

    try {
      // 1. Construir el historial compatible con Gemini API (iniciando siempre con rol 'user')
      const conversationMessages = newMessages.filter(msg => msg.id !== 'welcome');
      const geminiHistory: GeminiMessage[] = conversationMessages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }]
      }));

      // Preparar contexto del profesional actualmente activo si existe
      const activePro = currentProfessionalRef.current;
      let activeProContext = '';
      if (activePro) {
        activeProContext = `DATOS DEL PROFESIONAL ACTUALMENTE EN CONVERSACIÓN:
- Nombre: ${activePro.nombre}
- Oficio / Especialidad: ${activePro.profesion}
- Categoría: ${activePro.categoria}
- Calificación en estrellas: ${activePro.calificacion > 0 ? `${activePro.calificacion} estrellas` : 'Nuevo (Sin reseñas todavía)'}
- Cantidad de reseñas: ${activePro.totalResenas}
- Lo que el profesional describe en su perfil: ${activePro.descripcion || 'Sin descripción adicional'}

INSTRUCCIONES CLAVE DE DESCARGO Y ATRIBUCIÓN PARA ESTE PROFESIONAL:
1. DESCARGO DE RESPONSABILIDAD OBLIGATORIO: NUNCA afirmes como verdad absoluta o garantía personal de la plataforma que el profesional "tiene mucha experiencia", "es un experto" o "hace muy bien su trabajo". Debes ATRIBUIRLO SIEMPRE a su perfil diciendo frases como: "El profesional indica en su perfil que...", "Según describe en su perfil...", "En su información comenta que...", etc.
2. Si el cliente pregunta sobre sus estrellas, reseñas o experiencia: responde de forma DIRECTA, BREVE y TRANSPARENTE. Si no tiene reseñas, di con total naturalidad que es nuevo en la plataforma y aún no cuenta con opiniones de clientes para verificarlo, pero que en su perfil indica dedicarse a dicho oficio. Si tuviera reseñas, atribúyelas diciendo "Los clientes que lo han contratado comentan que...". PROHIBIDO dar discursos o sermones sobre por qué la plataforma no se basa en estrellas.
3. NO repitas mecánicamente frases cliché como "Recuerda que con el botón Ver Perfil en su tarjeta..." en cada mensaje. Solo menciónalo si el usuario pregunta cómo contactarlo, cómo chatear con él o dónde ver sus detalles.`;
      }

      // 2. Enviar petición inicial a Gemini con el contexto del profesional activo
      const response = await sendMessageToGemini(geminiHistory, activeProContext);

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

          // Actualizar la referencia al profesional activo
          if (searchResult.chosen) {
            currentProfessionalRef.current = searchResult.chosen;
          }

          const functionResponseData = searchResult.chosen
            ? {
                candidato_seleccionado_al_azar: {
                  id: searchResult.chosen.id,
                  nombre: searchResult.chosen.nombre,
                  profesion: searchResult.chosen.profesion,
                  categoria: searchResult.chosen.categoria,
                  calificacion_estrellas: searchResult.chosen.calificacion,
                  total_resenas: searchResult.chosen.totalResenas,
                  es_nuevo_sin_resenas: searchResult.chosen.totalResenas === 0,
                  descripcion: stripContactInfo(searchResult.chosen.descripcion)
                },
                total_candidatos_coincidentes: searchResult.totalMatches,
                hay_mas_opciones_disponibles: searchResult.hasMore,
                todos_mostrados_previamente: searchResult.allAlreadyShown
              }
            : {
                candidatos_encontrados: 0,
                mensaje: "En este momento no hay profesionales ni personas registradas con ese oficio o servicio en la plataforma Le Chambea."
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
          const finalResponse = await sendMessageToGemini(expandedHistory, activeProContext);
          const finalCandidate = finalResponse.candidates?.[0];
          const finalParts = finalCandidate?.content?.parts || [];
          const finalText = finalParts.map((p: any) => p.text || '').join('');

          const latency = Date.now() - startTime;
          const rawCat = (searchResult.chosen?.categoria || args?.category || '').trim();
          let detectedCategory: string | undefined = undefined;

          if (rawCat) {
            const clean = rawCat.toLowerCase();
            const matched = CATEGORIES.find(c => c.toLowerCase() === clean);
            if (matched) {
              detectedCategory = matched;
            } else if (clean === 'otro' || clean === 'otros' || clean === 'otra' || clean === 'otras') {
              detectedCategory = 'Otros';
            }
          }

          // Registrar consulta real categorizada en Supabase con latencia
          logAiQuery({
            query: userMessageText,
            source: 'client',
            category: detectedCategory,
            resultsCount: searchResult.totalMatches,
            responseTimeMs: latency,
          }).catch(err => console.warn('No se pudo registrar log de IA:', err));

          // Agregar el mensaje final con la tarjeta del profesional recomendado adjunta
          const botMessage: Message = {
            id: `bot-${Date.now()}`,
            sender: 'bot',
            text: stripContactInfo(finalText) || 'Te presento la siguiente opción para tu requerimiento. ¿Te parece bien o prefieres que busque a otra persona registrada en la plataforma?',
            createdAt: new Date(),
            professionals: searchResult.chosen ? [searchResult.chosen] : undefined
          };

          setMessages(prev => [...prev, botMessage]);
        }
      } else {
        // Flujo A: Respuesta de texto directa (DIY / Consejos / Conversación general)
        const textResponse = parts.map((p: any) => p.text || '').join('');
        const cleanText = stripContactInfo(textResponse);
        const latency = Date.now() - startTime;

        // Registrar consulta en Supabase sin categoría inventada
        logAiQuery({
          query: userMessageText,
          source: 'client',
          resultsCount: 0,
          responseTimeMs: latency,
        }).catch(err => console.warn('No se pudo registrar log de IA:', err));
        
        // Determinar si debemos re-mostrar la tarjeta del profesional activo
        const currentPro = currentProfessionalRef.current;
        const userAsksCardOrPro = /tarjeta|bot[oó]n|perfil|reseña|opini[oó]n|estrella|calificaci[oó]n|precio|costo|cobra|caro|barato|experiencia|contacto|llamar|chatear|escribir|d[oó]nde|qui[eé]n|ver\b/i.test(userMessageText);
        const botMentionsCardOrPro = /tarjeta|perfil|ver perfil|chatear|contactar/i.test(cleanText) ||
          Boolean(currentPro && cleanText.toLowerCase().includes(currentPro.nombre.toLowerCase().split(' ')[0]));

        const shouldAttachCard = Boolean(currentPro && (userAsksCardOrPro || botMentionsCardOrPro));

        const botMessage: Message = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: cleanText || 'No he podido procesar tu solicitud. Por favor intenta reformular tu consulta.',
          createdAt: new Date(),
          professionals: shouldAttachCard && currentPro ? [currentPro] : undefined
        };

        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error: any) {
      console.error('❌ Error enviando mensaje a Sula:', error);
      
      const latency = Date.now() - startTime;
      logAiQuery({
        query: userMessageText,
        source: 'client',
        resultsCount: 0,
        responseTimeMs: latency,
      }).catch(err => console.warn('No se pudo registrar log de IA en error:', err));

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

  const reportAiIssue = async (
    reason: string,
    description?: string,
    conversationSnippet?: string
  ): Promise<boolean> => {
    return await submitAiReport({ reason, description, conversationSnippet });
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
