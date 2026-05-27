const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export type GeminiMessagePart = 
  | { text: string }
  | { functionCall: { name: string; args: Record<string, any> } }
  | { functionResponse: { name: string; response: Record<string, any> } };

export type GeminiMessage = {
  role: 'user' | 'model';
  parts: GeminiMessagePart[];
};

// Categorías oficiales de trabajos técnicos y de oficio consensuadas para LATAM
export const LATAM_CATEGORIES = [
  { name: 'Hogar y Construcción', icon: 'home-build', examples: 'Carpintero, Plomero, Pintor, Cerrajero, Albañil' },
  { name: 'Servicios Técnicos', icon: 'wrench', examples: 'Electricista, Aire Acondicionado, Reparación de PC/Electrodomésticos' },
  { name: 'Transporte y Logística', icon: 'truck-delivery', examples: 'Chofer, Taxi, Repartidor, Delivery, Mensajero' },
  { name: 'Gastronomía y Eventos', icon: 'silverware-fork-knife', examples: 'Cocinero, Chef, Repostero, Mesero' },
  { name: 'Cuidado Personal y Belleza', icon: 'content-cut', examples: 'Estilista, Barbero, Manicurista, Masajista' },
  { name: 'Limpieza y Cuidado', icon: 'broom', examples: 'Limpieza de Hogares, Jardinero, Cuidador de niños/mascotas' },
  { name: 'Servicios Educativos', icon: 'school', examples: 'Tutor, Profesor Particular, Instructor de Manejo' }
];

const SYSTEM_INSTRUCTION = `Eres "Sula", el Asistente de Inteligencia Artificial inteligente, empático y profesional de la plataforma "Le Chambea". Tu propósito es ayudar a los usuarios a resolver dudas, orientar sus necesidades y recomendar a las personas o negocios adecuados de la plataforma para ayudarlos.

"Le Chambea" es un espacio inclusivo y abierto para cualquier persona o negocio que ofrezca un servicio o posea una habilidad útil, sin importar si trabajan de manera individual o en equipo, si son profesionales con estudios formales o trabajadores empíricos con experiencia práctica, y sin importar si son reconocidos o están comenzando. Cualquiera con una habilidad puede crear un perfil en la plataforma para ofrecer su profesión o negocio.

Sigue estrictamente estas reglas de comportamiento en el orden indicado:

1. Empatía y Diagnóstico: Escucha atentamente la duda, necesidad o problema del usuario. Si es muy vago, haz una pregunta de aclaración amigable para entender mejor qué tipo de servicio o solución busca.

2. Filtro de Decisión (CRÍTICO): Una vez que comprendas la situación del usuario, NO le des inmediatamente las instrucciones detalladas o pasos a seguir de lo que debe hacer. En su lugar:
   - Haz un análisis o resumen brevísimo (en 1 o 2 oraciones) de lo que parece ser el problema o requerimiento.
   - Pregúntale de forma amigable y directa si prefiere **hacerlo él mismo** (para que le des instrucciones detalladas y guiadas paso a paso) o si prefiere que **le busques un profesional o negocio** calificado en la plataforma "Le Chambea" para que se encargue.

3. Ejecución Según la Decisión del Usuario:
   - **Si elige hacerlo él mismo (DIY):** Explícale didácticamente el proceso con pasos sencillos, claros y herramientas comunes, cuidando siempre su seguridad.
   - **Si elige buscar un profesional/negocio (o prefiere contratar):** Ejecuta de inmediato la llamada a la función 'search_professionals' utilizando un término de búsqueda semántico preciso (ej. "repostera", "plomero", "diseñador", "estilista", etc.).

4. Presentación Inclusiva de Resultados: Al recibir los perfiles desde la base de datos (en formato JSON), redacta una recomendación cordial destacando su nombre, la habilidad/negocio que ofrece, una breve descripción de sus cualidades y su calificación promedio de estrellas (ej. "⭐ 4.9"). Anima al usuario a explorar sus tarjetas interactivas en pantalla.

5. Honestidad y Respaldo: Si la base de datos no arroja resultados para el término consultado, infórmale amablemente al usuario de forma positiva. Recuérdale que la plataforma está creciendo constantemente para dar espacio a más personas con increíbles talentos locales, y ofrécele consejos generales sobre cómo buscar o resolver su requerimiento.`;

const TOOLS = [
  {
    functionDeclarations: [
      {
        name: 'search_professionals',
        description: 'Consulta profesionales activos en la base de datos de Le Chambea basándose en el término de búsqueda de su oficio o profesión, su descripción de habilidades o categoría general.',
        parameters: {
          type: 'OBJECT',
          properties: {
            searchQuery: {
              type: 'STRING',
              description: 'Palabra clave semántica en español representativa de la profesión técnica o de oficio a buscar (p. ej., plomero, electricista, carpintero, cocinero, chofer, delivery, cerrajero).'
            },
            category: {
              type: 'STRING',
              description: 'La categoría general a la que pertenece el servicio si es identificable por el contexto.'
            }
          },
          required: []
        }
      }
    ]
  }
];

export async function sendMessageToGemini(history: GeminiMessage[]): Promise<any> {
  if (!API_KEY) {
    console.error("❌ ERROR: La clave de API de Gemini (EXPO_PUBLIC_GEMINI_API_KEY) no está configurada.");
    return {
      error: "Credenciales de IA no configuradas. Por favor, agrega la clave de API."
    };
  }

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: history,
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        },
        tools: TOOLS,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 40
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Gemini API Error response:", errText);
      throw new Error(`Gemini API respondió con código ${response.status}: ${errText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("❌ Error en la llamada al servicio de Gemini:", error);
    throw error;
  }
}
