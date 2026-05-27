# ESPECIFICACIÓN DE DISEÑO ARQUITECTÓNICO Y REQUISITOS TÉCNICOS
## Proyecto: "Le Chambea" — Módulo de Inteligencia Artificial ("Chamby")
### Documento de Respaldo Académico para Tesis de Ingeniería en Sistemas de Información

---

## 1. INTRODUCCIÓN Y CONTEXTO DEL SISTEMA
El presente documento describe las especificaciones arquitectónicas, diagramas de secuencia, diseño de base de datos y flujos lógicos para el módulo de Asistente de Inteligencia Artificial, denominado comercialmente **"Chamby"**, integrado en la aplicación móvil y web **"Le Chambea"**.

"Le Chambea" es una plataforma tecnológica multifuncional diseñada para conectar clientes que requieren servicios de mantenimiento o técnicos para el hogar con profesionales calificados de diversos oficios. El módulo de IA, **Chamby**, actúa como un filtro inteligente de primer contacto con dos propósitos primordiales:
1. **Filtro de Autoservicio (Bricolaje/DIY):** Empoderar al usuario mediante la detección de fallas sencillas y la sugerencia de metodologías paso a paso de resolución casera, optimizando los costos de los usuarios en tareas de baja complejidad.
2. **Recomendación Inteligente de Profesionales (Supabase Search):** Cuando la complejidad técnica es alta o el usuario requiere explícitamente contratar un servicio, el asistente analiza la base de datos de profesionales mediante llamadas a funciones de lenguaje en tiempo real (*Function Calling*), presentando candidatos altamente calificados según su calificación promedio, reseñas e idoneidad del perfil.

---

## 2. ARQUITECTURA GENERAL DEL SISTEMA
El sistema implementa una arquitectura híbrida cliente-servidor con integración directa de un modelo fundacional de IA mediante APIs seguras. El backend de la aplicación se basa en **Supabase** (PostgreSQL as a Service, Auth, Storage), mientras que el motor de inferencia cognitiva utiliza el modelo **Gemini 1.5 Flash** de Google.

```
       +--------------------------------------------------------------+
       |                  CLIENTE: EXPO APPLICATION                   |
       |                (React Native + React Web)                    |
       +--------------+-------------------------------+---------------+
                      |                               |
                      | 1. HTTP JSON API              | 3. Supabase Client
                      | (System Prompt + History)     | (JS SDK Queries)
                      v                               v
       +--------------+--------------+ +---------------+---------------+
       |       AI ENGINE (API)       | |        DATABASE / AUTH        |
       |     Google Gemini 1.5       | |      Supabase (PostgreSQL)    |
       +-----------------------------+ +-------------------------------+
```

### Protocolo de Interacción y Flujo Lógico:
1. El usuario envía una consulta en lenguaje natural desde la interfaz de chat en la aplicación.
2. El componente controlador inyecta la consulta del usuario en una estructura estructurada de historial de chat, la cual incluye un **System Instruction** (Instrucciones del Sistema) persistente.
3. Se realiza una solicitud HTTP POST al endpoint de inferencia de Gemini.
4. El modelo realiza un análisis semántico del texto y toma una de dos decisiones:
   - **Flujo A (Respuesta de Texto Directa):** Gemini responde con explicaciones didácticas, pasos sistemáticos de solución y lista de herramientas sugeridas.
   - **Flujo B (Llamada a Función - Tool Calling):** Gemini detecta la necesidad de buscar un profesional especializado. Genera un objeto JSON solicitando la invocación de la herramienta `search_professionals` con variables de palabra clave (p. ej., `searchQuery = "fontanero"`).
5. El cliente intercepta la solicitud de llamada a función generada por el modelo, suspende momentáneamente la salida de texto al usuario, y realiza una consulta optimizada a Supabase.
6. Supabase retorna los registros que coinciden semántica y físicamente con el criterio de búsqueda (profesionales activos, datos de usuario, y calificaciones promedio).
7. El cliente envía estos registros en crudo de vuelta a la API de Gemini como una respuesta de función (`functionResponse`).
8. Gemini consolida la respuesta final integrando los datos reales del sistema con un tono empático y conversacional.
9. El cliente renderiza la respuesta textual de Chamby y, simultáneamente, interpreta el arreglo de profesionales para dibujar **tarjetas visuales interactivas y clicables** en el chat que permiten la navegación hacia el perfil público del profesional para una contratación inmediata.

---

## 3. ESPECIFICACIÓN DE LA BASE DE DATOS (MODELO ENTIDAD-RELACIÓN)
A continuación, se detalla el esquema relacional de Supabase en español que es utilizado directamente por el motor de búsqueda de Chamby.

### 3.1. Tabla: `usuarios`
Almacena la identidad y datos generales de todos los usuarios registrados en el sistema (tanto clientes como profesionales).

| Columna | Tipo de Datos | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `REFERENCES auth.users` | Identificador único global (UUID) |
| `nombre` | `varchar` | `NOT NULL` | Nombre de pila del usuario |
| `apellidos` | `varchar` | `NOT NULL` | Apellidos del usuario |
| `correo` | `varchar` | `UNIQUE`, `NOT NULL` | Correo electrónico de contacto |
| `genero` | `varchar` | - | Identidad de género |
| `fecha_nacimiento` | `date` | - | Fecha de nacimiento para validación de edad |
| `foto_perfil` | `text` | - | URL pública del avatar guardado en el Storage Bucket |
| `onboarding_completado` | `boolean` | `DEFAULT false` | Estado del tutorial inicial |
| `fecha_creacion` | `timestamp` | `DEFAULT now()` | Fecha de registro en el sistema |

### 3.2. Tabla: `perfiles_profesionales`
Define la oferta de servicios de los usuarios que deciden auto-registrarse como prestadores de servicios o profesionales técnicos.

| Columna | Tipo de Datos | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador del servicio técnico |
| `usuario_id` | `uuid` | `REFERENCES usuarios(id) ON DELETE CASCADE` | Enlace al perfil de usuario general |
| `profesion` | `varchar` | `NOT NULL` | Título del servicio (ej. "Electricista de alta tensión") |
| `categoria` | `varchar` | `NOT NULL` | Categoría general (ej. "Electricidad", "Plomería") |
| `descripcion` | `text` | `NOT NULL` | Detalle exhaustivo de la experiencia y tarifas |
| `esta_activo` | `boolean` | `DEFAULT true` | Estado de disponibilidad en la plataforma |
| `indice_servicio` | `integer` | `DEFAULT 0` | Prioridad visual o índice de ordenamiento |
| `fecha_creacion` | `timestamp` | `DEFAULT now()` | Fecha de publicación del perfil profesional |

### 3.3. Tabla: `resenas`
Guarda las evaluaciones y retroalimentación proporcionadas por los clientes hacia los perfiles profesionales tras culminar los trabajos.

| Columna | Tipo de Datos | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, `DEFAULT gen_random_uuid()` | Identificador de la reseña |
| `perfil_profesional_id`| `uuid` | `REFERENCES perfiles_profesionales(id) ON DELETE CASCADE`| Enlace al perfil del servicio calificado |
| `cliente_id` | `uuid` | `REFERENCES usuarios(id)` | Identificador del cliente calificador |
| `calificacion` | `integer` | `CHECK (calificacion >= 1 AND calificacion <= 5)` | Puntaje en estrellas (1 a 5) |
| `comentario` | `text` | - | Crítica constructiva o comentario de soporte |
| `fecha_creacion` | `timestamp` | `DEFAULT now()` | Fecha de emisión de la reseña |

---

## 4. ESQUEMA DE LLAMADA A FUNCIONES (GEMINI FUNCTION CALLING)
La clave tecnológica que conecta la Inteligencia Artificial con los datos relacionales de Supabase es el esquema de herramientas. La API de Gemini admite la definición de esquemas JSON compatibles con OpenAPI 3.0 para la declaración de funciones de ayuda.

### Declaración JSON de la Herramienta:
```json
{
  "name": "search_professionals",
  "description": "Busca profesionales técnicos activos y calificados en la base de datos de Le Chambea basándose en una categoría de oficio, especialidad o descripción del problema.",
  "parameters": {
    "type": "OBJECT",
    "properties": {
      "searchQuery": {
        "type": "STRING",
        "description": "Palabra clave en español representativa de la profesión (p. ej., plomero, cerrajero, jardinero, electricista, carpintero, pintor)."
      },
      "category": {
        "type": "STRING",
        "description": "La categoría general a la que pertenece el problema detectado, si es identificable por el contexto."
      }
    },
    "required": []
  }
}
```

---

## 5. FLUJO DE TRABAJO E INSTRUCCIONES DEL AGENTE (SYSTEM INSTRUCTIONS)
Para garantizar un comportamiento riguroso acorde a una tesis de ingeniería, el agente cognitivo de IA opera bajo un conjunto estricto de directrices inyectadas en su configuración de arranque.

### Prontuario de Instrucciones del Sistema (System Prompt):
```text
Eres "Chamby", el Asistente de Inteligencia Artificial inteligente, empático y profesional de la plataforma "Le Chambea". Tu propósito es ayudar a los usuarios con problemas y fallas del hogar u oficios técnicos en general.

Sigue rigurosamente estas reglas de comportamiento:
1. Empatía y Diagnóstico: Escucha atentamente la descripción del problema del usuario. Haz preguntas de aclaración si el problema es muy vago.
2. Enfoque Bricolaje (Hazlo tú mismo / DIY): Si detectas que el problema descrito es fácil y seguro de resolver por el propio usuario (por ejemplo: un grifo que gotea debido a un empaque flojo, cambiar una bombilla, purgar un radiador), indícale amablemente que es algo que probablemente puede solucionar él mismo de forma rápida. Proporciona:
   - Una explicación didáctica de la posible falla.
   - Pasos claros, enumerados y seguros para solucionarlo.
   - Herramientas y materiales recomendados que comúnmente se tienen en casa.
3. Transición a Profesionales: Deja en claro que si el usuario no se siente seguro, prefiere ahorrar tiempo o si el problema resulta ser complejo (p. ej. fugas internas de gas, cortocircuitos severos, filtraciones estructurales), debe dejarlo en manos de un experto.
4. Búsqueda y Recomendación en Supabase: Si el usuario solicita explícitamente contratar a un experto, indica que el problema requiere atención profesional o acepta tu propuesta de contratar a alguien, debes llamar de inmediato a la herramienta 'search_professionals' pasándole el término de búsqueda deducido (p. ej. 'plomero', 'electricista').
5. Presentación de Resultados: Cuando recibas los datos de los profesionales recomendados de la base de datos, presenta una respuesta amable. Explica brevemente por qué son excelentes candidatos basándote en sus descripciones o calificaciones promedio reales (provistas en el JSON de respuesta) e invita al usuario a dar clic en sus tarjetas interactivas integradas en el chat para ver sus perfiles públicos detallados.
```

---

## 6. DIAGRAMAS DE FLUJO Y NAVEGACIÓN
El módulo mantiene una alta coherencia visual gracias a la reutilización del layout adaptable en computadoras y móviles.

1. **Flujo de Pantalla Completa en Móvil:** Ofrece una experiencia inmersiva tipo chat clásico (estilo WhatsApp/Telegram) con elementos táctiles sobrios y elegantes.
2. **Flujo Integrado en Web (Escritorio):** Gracias a `MainLayout.tsx` (ancho >= 1024px), el chat de la IA se embebe fluidamente en el panel derecho de la interfaz, manteniendo visible de forma persistente la barra lateral de navegación morada de la marca, garantizando una usabilidad multidispositivo excelente.

---
*Este diseño arquitectónico y de bases de datos representa un caso de estudio real de integración de IA generativa (Generative AI) con bases de datos SQL relacionales tradicionales, aplicando las mejores prácticas de ingeniería de software e interfaces responsivas.*
