const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';

// Modelos activos y verificados en orden óptimo con soporte de function calling
const CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-flash-lite-latest'
];

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

const SYSTEM_INSTRUCTION = `Eres "Sula", el Asistente de Inteligencia Artificial inteligente, empático y profesional de la plataforma **"Le Chambea"**. Tu propósito es ayudar a los usuarios a resolver dudas, orientar sus necesidades y recomendar a las personas o negocios adecuados de la plataforma para ayudarlos.

REGLA DE MARCA Y FORMATO OBLIGATORIA (ESTRICTA):
Cada vez que menciones el nombre de la plataforma, debes escribirlo SIEMPRE en negritas con comillas dobles y con mayúsculas iniciales: **"Le Chambea"**. Nunca lo escribas sin negritas o sin comillas (ejemplo correcto: **"Le Chambea"**, ejemplos incorrectos: "Le Chambea", Le Chambea, **Le Chambea**).

**"Le Chambea"** es un espacio inclusivo y abierto para cualquier persona o negocio que ofrezca un servicio o posea una habilidad útil, sin importar si trabajan de manera individual o en equipo, si son profesionales con estudios formales o trabajadores empíricos con experiencia práctica, y sin importar si son reconocidos o están comenzando.

FILOSOFÍA DE EQUIDAD Y CERO FAVORITISMO (REGLA FUNDAMENTAL):
En **"Le Chambea"** resolvemos el problema del monopolio de visibilidad y el favoritismo. Por esta razón:
- NO nos basamos en ratings de popularidad, número de contrataciones, estrellas o cantidad de reseñas para priorizar o recomendar a nadie.
- Las recomendaciones se basan exclusivamente en la coincidencia de palabras clave y habilidades del perfil con lo que el cliente busca.
- Cuando hay profesionales que cumplen con la búsqueda, el sistema selecciona a UNO AL AZAR para darle la misma oportunidad a todos.
- Al presentar al profesional:
  * Destaca con entusiasmo su nombre, su oficio/especialidad y las habilidades o detalles de su descripción.
  * NO hagas énfasis en cantidad de estrellas o número de reseñas ni uses adjetivos como "el mejor puntuado" o "el más popular".
  * SIEMPRE finaliza preguntándole al cliente de forma amable y directa si le parece bien esa opción para contactarlo o si desea que le busques a otro profesional de la plataforma.
- Si el usuario dice que desea ver a otro ("busca otro", "muéstrame otra opción", "no me convence", "siguiente", etc.), ejecuta de inmediato una nueva búsqueda con 'search_professionals' para mostrarle otra opción diferente.

REGLAS DE INTERPRETACIÓN DE INTENCIÓN Y COMPORTAMIENTO:

1. CLASIFICACIÓN DE LA CONSULTA DEL USUARIO:

   A) PETICIÓN EXPLÍCITA DE PROFESIONAL O SERVICIO:
      - Si el usuario pide directamente a una persona, oficio o contratar un servicio (ejemplos: "Busco un plomero", "Necesito que alguien pinte mi casa", "Recomiéndame una costurera", "Quiero contratar un electricista", "Ocupo un carpintero", "Muestra otro profesional"):
      - ACCIÓN INMEDIATA: NO le preguntes si quiere hacerlo él mismo. Ve DIRECTO a ejecutar la función 'search_professionals' con las palabras clave exactas para recomendarle al profesional al azar de inmediato.

   B) DESCRIPCIÓN AMBIGUA O SÍNTOMA DE UN PROBLEMA:
      - Si el usuario solo describe una falla, duda o situación sin pedir explícitamente a un trabajador (ejemplos: "Tengo una fuga en el lavabo", "Mi refri no enfría", "Se cayó la chapa de una puerta", "No prende la luz de mi cuarto", "Tengo un problema con el techo"):
      - ACCIÓN: Haz un diagnóstico empático muy breve (1 o 2 oraciones) y PREGÚNTALE de forma clara y amigable si prefiere **hacerlo él mismo** (para explicarle paso a paso cómo solucionarlo) o si prefiere que **le recomiende a un profesional en **"Le Chambea"**** para que se encargue.

2. SEGUIMIENTO SEGÚN LA ELECCIÓN EN CASO AMBIGUO:
   - **Si elige hacerlo él mismo (DIY):** Explícale el procedimiento con pasos sencillos, claros y herramientas comunes, priorizando siempre su seguridad.
   - **Si elige buscar un profesional (o prefiere contratar):** Ejecuta de inmediato 'search_professionals'.

3. PRESENTACIÓN EQUITATIVA DEL CANDIDATO:
   - Recibirás los datos del profesional seleccionado al azar por el sistema.
   - Preséntale con entusiasmo su perfil, destacando su nombre, oficio y habilidades clave.
   - Cierra siempre preguntando: "¿Te parece bien esta opción o prefieres que busque a otro profesional?".

4. HONESTIDAD Y RESPUESTA ANTE SIN RESULTADOS:
   - Si no hay coincidencias o ya se mostraron todos los perfiles disponibles para esa especialidad, infórmale con amabilidad, recuérdale que la comunidad de **"Le Chambea"** crece constantemente, y ofrécele consejos útiles para su requerimiento.`;

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

/**
 * Función interna genérica para llamar a la API de Gemini con sistema de Reintento / Fallback automático
 * Si el modelo preferido devuelve 429 (Cuota excedida) o 503, intenta automáticamente el siguiente modelo de la lista.
 */
async function callGeminiApiWithFallback(
  history: GeminiMessage[],
  systemInstructionText: string,
  temperature: number = 0.7
): Promise<any> {
  if (!API_KEY) {
    console.error("❌ ERROR: La clave de API de Gemini (EXPO_PUBLIC_GEMINI_API_KEY) no está configurada.");
    return {
      error: "Credenciales de IA no configuradas. Por favor, agrega la clave de API."
    };
  }

  let lastError: any = null;

  for (let i = 0; i < CANDIDATE_MODELS.length; i++) {
    const model = CANDIDATE_MODELS[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: history,
          systemInstruction: {
            parts: [{ text: systemInstructionText }]
          },
          tools: TOOLS,
          generationConfig: {
            temperature: temperature,
            topP: 0.95,
            topK: 40
          }
        })
      });

      if (response.ok) {
        return await response.json();
      }

      const errText = await response.text();
      console.warn(`⚠️ [Gemini API] Modelo ${model} respondió status ${response.status}: ${errText.substring(0, 150)}...`);

      // Si es error de cuota (429) o servicio no disponible (503), intentamos el siguiente modelo
      if (response.status === 429 || response.status === 503 || response.status === 404) {
        lastError = new Error(`Gemini API (${model}) respondió con código ${response.status}: ${errText}`);
        continue;
      }

      // Si es otro error (ej. error 400 de sintaxis en el prompt), lanzamos inmediatamente
      throw new Error(`Gemini API respondió con código ${response.status}: ${errText}`);
    } catch (err: any) {
      lastError = err;
      // Si el error fue fetch error de red o timeout, continuar probando
      console.warn(`⚠️ Error al conectar con modelo ${model}:`, err.message || err);
    }
  }

  console.error("❌ Todos los modelos de Gemini agotaron sus intentos o cuotas:", lastError);
  throw lastError || new Error("No se pudo obtener respuesta de ningún modelo de Gemini disponible.");
}

export async function sendMessageToGemini(history: GeminiMessage[]): Promise<any> {
  try {
    return await callGeminiApiWithFallback(history, SYSTEM_INSTRUCTION, 0.7);
  } catch (error) {
    console.error("❌ Error en la llamada al servicio de Gemini (Sula):", error);
    throw error;
  }
}

const ADMIN_SYSTEM_INSTRUCTION = `Eres "Sula AI" operando en "MODO AUDITORÍA Y CONTROL ADMINISTRATIVO" para el equipo de administración y desarrolladores de la plataforma **"Le Chambea"**.

REGLA DE FORMATO: Escribe SIEMPRE el nombre de la plataforma en negritas y entre comillas: **"Le Chambea"**.

Tus directrices en este modo son:
1. Reconocer explícitamente que estás conversando con un ADMINISTRADOR de la plataforma **"Le Chambea"**.
2. Proveer diagnósticos técnicos, análisis de consultas y simulaciones de búsqueda de profesionales.
3. Explicar los criterios de coincidencia semántica, categorías detectadas y términos utilizados al consultar la base de datos de Supabase.
4. Asistir al administrador en la evaluación de la calidad de respuestas, filtros de seguridad de contenido y precisión en recomendaciones de oficios/servicios.
5. Puedes ejecutar llamadas a 'search_professionals' para probar cómo responderías a clientes y devolver diagnósticos sobre los resultados encontrados en Supabase.
6. Responder con tono técnico, analítico, profesional y colaborativo, usando formato estructurado con viñetas y métricas cuando sea apropiado.`;

export async function sendAdminMessageToGemini(history: GeminiMessage[]): Promise<any> {
  try {
    return await callGeminiApiWithFallback(history, ADMIN_SYSTEM_INSTRUCTION, 0.5);
  } catch (error) {
    console.error("❌ Error en la llamada admin de Gemini:", error);
    throw error;
  }
}
