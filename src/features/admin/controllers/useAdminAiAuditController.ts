import { useState } from "react";
import { supabase } from "../../../services/supabase";
import {
  sendAdminMessageToGemini,
  GeminiMessage,
  GeminiMessagePart,
} from "../../../services/gemini";
import { RecommendedProfessional } from "../../ai/controllers/useAiController";

export interface AuditMessage {
  id: string;
  sender: "admin" | "bot";
  text: string;
  createdAt: Date;
  professionals?: RecommendedProfessional[];
  auditMeta?: {
    latencyMs: number;
    searchQuery?: string;
    resultsCount?: number;
    tokensEstimated?: number;
  };
}

export function useAdminAiAuditController() {
  const [messages, setMessages] = useState<AuditMessage[]>([
    {
      id: "welcome_audit",
      sender: "bot",
      text: "👋 ¡Hola, Administrador! Modo Auditoría y Sandbox de Sula AI activado.\n\nEn este entorno puedes probar prompts, simular consultas de clientes, auditar cómo consulto la base de datos de profesionales en Supabase y validar el comportamiento del modelo Gemini sin alterar registros de usuarios.",
      createdAt: new Date(),
      auditMeta: {
        latencyMs: 120,
        resultsCount: 0,
      },
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [lastLatency, setLastLatency] = useState<number>(140);

  // Busca profesionales en Supabase para validar las herramientas de IA
  const queryProfessionals = async (query: string): Promise<RecommendedProfessional[]> => {
    try {
      const cleanQuery = query.trim().toLowerCase();
      const { data: profilesData, error: profilesError } = await supabase
        .from("perfiles_profesionales")
        .select(`
          id, 
          usuario_id,
          profesion, 
          categoria,
          descripcion,
          esta_activo,
          usuarios:usuario_id(nombre, apellidos, foto_perfil)
        `)
        .eq("esta_activo", true)
        .or(`profesion.ilike.%${cleanQuery}%,categoria.ilike.%${cleanQuery}%,descripcion.ilike.%${cleanQuery}%`)
        .limit(6);

      if (profilesError) throw profilesError;
      if (!profilesData || profilesData.length === 0) return [];

      const profileIds = profilesData.map((p) => p.id);

      const { data: reviewsData } = await supabase
        .from("resenas")
        .select("perfil_profesional_id, calificacion")
        .in("perfil_profesional_id", profileIds);

      return profilesData.map((p: any) => {
        const profileReviews = reviewsData?.filter((r) => r.perfil_profesional_id === p.id) || [];
        const count = profileReviews.length;
        const sum = profileReviews.reduce((acc, curr) => acc + curr.calificacion, 0);
        const avg = count > 0 ? Number((sum / count).toFixed(1)) : 0;

        return {
          id: p.id,
          usuario_id: p.usuario_id,
          nombre: `${p.usuarios?.nombre || "Profesional"} ${p.usuarios?.apellidos || ""}`.trim(),
          profesion: p.profesion || p.categoria,
          categoria: p.categoria,
          foto: p.usuarios?.foto_perfil || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250",
          calificacion: avg,
          totalResenas: count,
          descripcion: p.descripcion || "",
        };
      });
    } catch (e) {
      console.error("Error querying pros in audit mode:", e);
      return [];
    }
  };

  const handleSend = async (textOverride?: string) => {
    const messageText = (textOverride || input).trim();
    if (!messageText || loading) return;

    const userMessage: AuditMessage = {
      id: Date.now().toString(),
      sender: "admin",
      text: messageText,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textOverride) setInput("");
    setLoading(true);

    const startTime = Date.now();

    try {
      // Build history for Gemini
      const geminiHistory: GeminiMessage[] = messages
        .filter((m) => m.id !== "welcome_audit")
        .map((m) => ({
          role: m.sender === "admin" ? "user" : "model",
          parts: [{ text: m.text }],
        }));

      geminiHistory.push({
        role: "user",
        parts: [{ text: messageText }],
      });

      const response = await sendAdminMessageToGemini(geminiHistory);
      const candidate = response?.candidates?.[0];
      const modelParts: GeminiMessagePart[] = candidate?.content?.parts || [];

      const functionCallPart = modelParts.find((p: any) => "functionCall" in p);

      if (functionCallPart && "functionCall" in functionCallPart) {
        const { name, args } = functionCallPart.functionCall;
        let functionResult: any = {};
        let foundPros: RecommendedProfessional[] = [];

        if (name === "search_professionals") {
          const searchQuery = args.searchQuery || "";
          foundPros = await queryProfessionals(searchQuery);

          functionResult = {
            profesionalesEncontrados: foundPros.map((p) => ({
              id: p.id,
              nombre: p.nombre,
              profesion: p.profesion,
              categoria: p.categoria,
              calificacion: p.calificacion,
              resenas: p.totalResenas,
              descripcion: p.descripcion,
            })),
          };
        }

        // Second turn to deliver formatted audit output
        const followupHistory: GeminiMessage[] = [
          ...geminiHistory,
          {
            role: "model",
            parts: [functionCallPart],
          },
          {
            role: "user",
            parts: [
              {
                functionResponse: {
                  name,
                  response: functionResult,
                },
              },
            ],
          },
        ];

        const secondResponse = await sendAdminMessageToGemini(followupHistory);
        const secondCandidate = secondResponse?.candidates?.[0];
        const secondText =
          secondCandidate?.content?.parts?.[0]?.text ||
          `✅ Búsqueda DB ejecutada para: "${functionCallPart.functionCall.args?.searchQuery}". Se encontraron ${foundPros.length} perfiles en Supabase.`;

        const latency = Date.now() - startTime;
        setLastLatency(latency);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: secondText,
            createdAt: new Date(),
            professionals: foundPros,
            auditMeta: {
              latencyMs: latency,
              searchQuery: functionCallPart.functionCall.args?.searchQuery,
              resultsCount: foundPros.length,
              tokensEstimated: Math.round(secondText.length / 4),
            },
          },
        ]);
      } else {
        const textPart = modelParts.find((p): p is { text: string } => "text" in p);
        const botText = textPart?.text || "Diagnóstico completado sin llamadas a herramientas.";

        const latency = Date.now() - startTime;
        setLastLatency(latency);

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: "bot",
            text: botText,
            createdAt: new Date(),
            auditMeta: {
              latencyMs: latency,
              tokensEstimated: Math.round(botText.length / 4),
            },
          },
        ]);
      }
    } catch (error: any) {
      console.error("Error in admin audit chat:", error);
      const latency = Date.now() - startTime;
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: `⚠️ ERROR DE AUDITORÍA: No se pudo procesar la respuesta con el modelo Gemini.\nDetalle: ${error?.message || "Error desconocido"}`,
          createdAt: new Date(),
          auditMeta: {
            latencyMs: latency,
          },
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearSession = () => {
    setMessages([
      {
        id: "welcome_audit_" + Date.now(),
        sender: "bot",
        text: "🔄 Sesión de auditoría reiniciada. Puedes comenzar una nueva ronda de pruebas.",
        createdAt: new Date(),
        auditMeta: {
          latencyMs: 80,
          resultsCount: 0,
        },
      },
    ]);
  };

  return {
    messages,
    loading,
    input,
    setInput,
    handleSend,
    clearSession,
    lastLatency,
  };
}
