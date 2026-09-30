import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminReport, AdminUser } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import { supabase } from "../../../services/supabase";
import { showAlert } from "../../../shared/utils/customAlert";
import AdminConfirmModal from "./AdminConfirmModal";

const PURPLE = "#5A2D82";

interface ChatMessageItem {
  id: string;
  senderRole: "client" | "pro" | "user" | "sula";
  senderName: string;
  content: string;
  createdAt?: string;
}

interface ChatViewerData {
  type: "human" | "sula";
  title: string;
  subtitle: string;
  clientInfo?: { name: string };
  proInfo?: { name: string };
  messages: ChatMessageItem[];
}

interface Props {
  visible: boolean;
  onClose: () => void;
  reports: AdminReport[];
  users: AdminUser[];
  onToggleResolved: (reportId: string, currentResolved: boolean) => void;
  onDeleteReport: (reportId: string) => void;
  onDirectNotice: (user: AdminUser, reportContext?: AdminReport) => void;
}

export default function AdminReportsModal({
  visible,
  onClose,
  reports,
  users,
  onToggleResolved,
  onDeleteReport,
  onDirectNotice,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"pending" | "resolved">("pending");

  const pendingReports = reports.filter((r) => !r.leido);
  const resolvedReports = reports.filter((r) => r.leido);

  const displayedReports = (filterTab === "pending" ? pendingReports : resolvedReports).filter((r) => {
    const title = (r.titulo || "").toLowerCase();
    const body = (r.cuerpo || "").toLowerCase();
    const userName = `${r.usuario?.nombre || ""} ${r.usuario?.apellidos || ""}`.toLowerCase();
    const query = search.toLowerCase().trim();

    return !query || title.includes(query) || body.includes(query) || userName.includes(query);
  });

  const [reportToDelete, setReportToDelete] = useState<AdminReport | null>(null);

  const confirmDelete = (report: AdminReport) => {
    setReportToDelete(report);
  };

  const handleNotifyUser = (report: AdminReport) => {
    let targetUser: AdminUser | undefined;
    if (report.usuario_id) {
      targetUser = users.find((u) => u.id === report.usuario_id);
    }
    if (!targetUser && report.usuario?.id) {
      targetUser = users.find((u) => u.id === report.usuario.id);
    }
    if (!targetUser && report.cuerpo) {
      const idMatch = report.cuerpo.match(/(?:ID de usuario|SolicitadoPor):\s*([a-f0-9-]{10,})/i);
      if (idMatch) {
        targetUser = users.find((u) => u.id === idMatch[1]);
      }
    }
    if (!targetUser) {
      // Fallback pseudo user object if user ID is present
      const fallbackId = report.usuario_id || report.usuario?.id || "";
      targetUser = {
        id: fallbackId,
        nombre: report.usuario?.nombre || "Usuario Reportante",
        apellidos: report.usuario?.apellidos || "",
        correo: report.usuario?.correo || "",
        telefono: "",
        ciudad: "",
        foto_perfil: report.usuario?.foto_perfil || null,
        rol: "usuario",
        onboarding_completado: true,
        fecha_creacion: "",
      };
    }
    onDirectNotice(targetUser, report);
  };

  // Chat Viewer State
  const [chatViewerVisible, setChatViewerVisible] = useState(false);
  const [chatViewerLoading, setChatViewerLoading] = useState(false);
  const [chatViewerError, setChatViewerError] = useState<string | null>(null);
  const [chatViewerData, setChatViewerData] = useState<ChatViewerData | null>(null);

  const parseSulaConversation = (cuerpo: string, reporterName: string): ChatMessageItem[] => {
    const markerMatch = cuerpo.match(
      /(?:•\s*Historial de la conversación(?: reportada)?|Historial de la conversación(?: reportada)?|Conversación reportada|Fragmento de conversación):\s*[\r\n]+([\s\S]*)/i
    );
    const rawText = markerMatch ? markerMatch[1].trim() : "";
    if (!rawText) {
      return [
        {
          id: "empty_sula",
          senderRole: "sula",
          senderName: "Sula AI",
          content: "No se adjuntó historial de conversación en este reporte.",
        },
      ];
    }

    const parts = rawText.split(/(?=(?:Usuario|User|Sula AI|Sula):\s*)/i);
    const result: ChatMessageItem[] = [];
    let count = 0;

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      count++;

      if (/^(?:Usuario|User):\s*/i.test(trimmed)) {
        result.push({
          id: `sula_${count}`,
          senderRole: "user",
          senderName: reporterName || "Usuario",
          content: trimmed.replace(/^(?:Usuario|User):\s*/i, "").trim(),
        });
      } else if (/^(?:Sula AI|Sula):\s*/i.test(trimmed)) {
        result.push({
          id: `sula_${count}`,
          senderRole: "sula",
          senderName: "Sula AI",
          content: trimmed.replace(/^(?:Sula AI|Sula):\s*/i, "").trim(),
        });
      } else {
        if (result.length > 0) {
          result[result.length - 1].content += "\n\n" + trimmed;
        } else {
          result.push({
            id: `sula_${count}`,
            senderRole: "user",
            senderName: reporterName || "Usuario",
            content: trimmed,
          });
        }
      }
    }

    return result.length > 0
      ? result
      : [
          {
            id: "fallback_sula",
            senderRole: "sula",
            senderName: "Sula AI",
            content: rawText,
          },
        ];
  };

  const handleOpenChat = async (report: AdminReport, cleanTitle: string) => {
    const rawBody = report.cuerpo || "";
    const rawTitle = (report.titulo || "").toLowerCase();
    const isSula =
      cleanTitle === "Reporte de Sula AI" ||
      rawTitle.includes("sula") ||
      rawTitle.includes("ai") ||
      rawBody.toLowerCase().includes("historial de la conversación");

    // Extraer nombre del reportante
    const reporterMatch =
      rawBody.match(/Quien reporta:\s*([^(\n\r]+)(?:\(([^)\n\r]+)\))?/i) ||
      rawBody.match(/El (?:Cliente|Profesional|usuario)\s+([^\n\r]+?)\s+solicita/i) ||
      rawBody.match(/El usuario\s+([^\n\r]+?)\s+report[oó]/i);
    const reporterName = reporterMatch
      ? reporterMatch[1].trim()
      : report.usuario
      ? `${report.usuario.nombre || ""} ${report.usuario.apellidos || ""}`.trim()
      : "Usuario";

    if (isSula) {
      setChatViewerError(null);
      setChatViewerLoading(false);
      const sulaMessages = parseSulaConversation(rawBody, reporterName);
      setChatViewerData({
        type: "sula",
        title: "Conversación con Sula AI",
        subtitle: `Reportado por ${reporterName}`,
        messages: sulaMessages,
      });
      setChatViewerVisible(true);
      return;
    }

    // Chat humano o solicitud de revisión: extraer chatId
    const chatMatch = rawBody.match(/(?:ID del Chat|ID de Chat|Chat ID|\(ID)\s*[:=]?\s*([a-f0-9-]{10,})/i) ||
      rawBody.match(/(?:chat_id)\s*[:=]\s*([a-f0-9-]{10,})/i);
    const chatId = chatMatch ? chatMatch[1].trim() : null;

    if (!chatId) {
      showAlert(
        "Chat no disponible",
        "No se encontró el identificador del chat asociado a este reporte.",
        undefined,
        "warning"
      );
      return;
    }

    setChatViewerError(null);
    setChatViewerLoading(true);
    setChatViewerVisible(true);

    try {
      // Consultar información del chat y mensajes en paralelo
      const [chatRes, msgsRes] = await Promise.all([
        supabase
          .from("chats")
          .select("id, cliente_id, profesional_id")
          .eq("id", chatId)
          .maybeSingle(),
        supabase
          .from("mensajes")
          .select("id, remitente_id, contenido, fecha_creacion")
          .eq("chat_id", chatId)
          .order("fecha_creacion", { ascending: true }),
      ]);

      if (msgsRes.error) throw msgsRes.error;

      const chatData = chatRes.data;
      const rawMsgs = msgsRes.data || [];

      const clientId = chatData?.cliente_id;
      const proId = chatData?.profesional_id;

      // Mapa de participantes
      const participantIds = new Set<string>();
      if (clientId) participantIds.add(clientId);
      if (proId) participantIds.add(proId);
      rawMsgs.forEach((m: any) => {
        if (m.remitente_id) participantIds.add(m.remitente_id);
      });

      const profilesMap = new Map<string, { name: string; email?: string }>();
      users.forEach((u) => {
        profilesMap.set(u.id, {
          name: `${u.nombre} ${u.apellidos || ""}`.trim(),
          email: u.correo,
        });
      });

      // Si falta alguno, consultar a usuarios
      const missingIds = Array.from(participantIds).filter((id) => !profilesMap.has(id));
      if (missingIds.length > 0) {
        const { data: missingUsers } = await supabase
          .from("usuarios")
          .select("id, nombre, apellidos, correo")
          .in("id", missingIds);

        if (missingUsers) {
          missingUsers.forEach((u: any) => {
            profilesMap.set(u.id, {
              name: `${u.nombre} ${u.apellidos || ""}`.trim(),
              email: u.correo,
            });
          });
        }
      }

      // Nombre de cliente y profesional
      const clientName = clientId && profilesMap.has(clientId)
        ? profilesMap.get(clientId)!.name
        : "Cliente";
      const proName = proId && profilesMap.has(proId)
        ? profilesMap.get(proId)!.name
        : "Profesional";

      const formattedMessages: ChatMessageItem[] = rawMsgs.map((m: any) => {
        const isClient = clientId ? m.remitente_id === clientId : false;
        const isPro = proId ? m.remitente_id === proId : false;
        const userProfile = profilesMap.get(m.remitente_id);
        const senderName = userProfile
          ? userProfile.name
          : isClient
          ? clientName
          : isPro
          ? proName
          : "Usuario";
        const senderRole: "client" | "pro" = isClient ? "client" : isPro ? "pro" : "client";

        return {
          id: m.id,
          senderRole,
          senderName,
          content: m.contenido,
          createdAt: m.fecha_creacion,
        };
      });

      const title =
        cleanTitle === "Solicitud de Revisión" ? "Chat de la Revisión" : "Chat de la Disputa";
      const subtitle = `${clientName} (Cliente) y ${proName} (Profesional)`;

      setChatViewerData({
        type: "human",
        title,
        subtitle,
        clientInfo: clientId ? { name: clientName } : undefined,
        proInfo: proId ? { name: proName } : undefined,
        messages: formattedMessages,
      });
    } catch (err: any) {
      console.error("Error al obtener mensajes de chat:", err);
      setChatViewerError(err?.message || "No se pudieron cargar los mensajes del chat.");
    } finally {
      setChatViewerLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
          {/* Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.select({
                web: 14,
                android: (insets.top || 24) + 6,
                ios: insets.top > 0 ? insets.top : 12,
                default: 14,
              }),
            },
          ]}
        >
          <TouchableOpacity onPress={onClose} style={styles.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>Solicitudes de Reporte</Text>
            <Text style={styles.headerSubtitle}>Atención a disputas, quejas e incidencias</Text>
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, filterTab === "pending" && styles.tabBtnActiveDanger]}
            onPress={() => setFilterTab("pending")}
          >
            <MaterialCommunityIcons
              name="alert-octagon"
              size={18}
              color={filterTab === "pending" ? "#E74C3C" : "#777"}
            />
            <Text style={[styles.tabBtnText, filterTab === "pending" && styles.tabBtnTextDanger]}>
              Pendientes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, filterTab === "resolved" && styles.tabBtnActiveSuccess]}
            onPress={() => setFilterTab("resolved")}
          >
            <MaterialCommunityIcons
              name="check-circle"
              size={18}
              color={filterTab === "resolved" ? "#2ECC71" : "#777"}
            />
            <Text style={[styles.tabBtnText, filterTab === "resolved" && styles.tabBtnTextSuccess]}>
              Resueltos
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchSection}>
          <View style={styles.searchBox}>
            <MaterialCommunityIcons name="magnify" size={20} color="#888" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar reporte o usuario..."
              placeholderTextColor="#999"
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Reports List */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {/* Contador previo a la lista de reportes */}
          <View style={styles.listCountHeader}>
            <Text style={styles.listCountText}>Total de Reportes: {displayedReports.length}</Text>
          </View>

          {displayedReports.length === 0 ? (
            <View style={styles.emptyWrap}>
              <MaterialCommunityIcons
                name={filterTab === "pending" ? "shield-check" : "check-all"}
                size={54}
                color="#BBB"
              />
              <Text style={styles.emptyTitle}>
                {search.trim().length > 0
                  ? `No se encontraron reportes para "${search.trim()}"`
                  : filterTab === "pending"
                  ? "No se encontraron reportes pendientes"
                  : "No se encontraron reportes resueltos"}
              </Text>
            </View>
          ) : (
            displayedReports.map((report) => {
              const isResolved = report.leido;

              // Identificar categoría y título directo limpio
              const rawTitle = report.titulo || "";
              let cleanTitle = "Reporte de Usuario";
              let reportIcon = "alert-circle-outline";
              let reportColor = PURPLE;

              if (rawTitle.toLowerCase().includes("chat")) {
                cleanTitle = "Reporte de Chat";
                reportIcon = "chat-alert-outline";
                reportColor = "#007AFF";
              } else if (rawTitle.toLowerCase().includes("sula") || rawTitle.toLowerCase().includes("ai")) {
                cleanTitle = "Reporte de Sula AI";
                reportIcon = "robot-confused-outline";
                reportColor = "#8E44AD";
              } else if (rawTitle.toLowerCase().includes("revisión") || rawTitle.toLowerCase().includes("revision") || rawTitle.toLowerCase().includes("cancelad")) {
                cleanTitle = "Solicitud de Revisión";
                reportIcon = "clipboard-text-search-outline";
                reportColor = PURPLE;
              }

              // Extraer campos clave del texto del reporte y eliminar IDs técnicos
              const rawBody = report.cuerpo || "";

              // Extraer Quien reporta / Quien solicita
              const reporterMatch = rawBody.match(/Quien reporta:\s*([^(\n\r]+)(?:\(([^)\n\r]+)\))?/i) ||
                rawBody.match(/El (?:Cliente|Profesional|usuario)\s+([^\n\r]+?)\s+solicita/i) ||
                rawBody.match(/El usuario\s+([^\n\r]+?)\s+report[oó]/i);
              const reporterName = reporterMatch
                ? reporterMatch[1].trim()
                : (report.usuario ? `${report.usuario.nombre || ""} ${report.usuario.apellidos || ""}`.trim() : "Usuario");

              // Extraer Contraparte / Usuario reportado / Quién canceló
              const reportedMatch = rawBody.match(/Usuario reportado:\s*([^(\n\r]+)(?:\(([^)\n\r]+)\))?/i) ||
                rawBody.match(/Contraparte que canceló:\s*([^\n\r]+)/i) ||
                rawBody.match(/profesional\s+([^.\n\r]+)/i);
              const reportedName = reportedMatch ? reportedMatch[1].trim() : null;

              // Extraer Motivo
              let reasonText: string | null = null;
              const reasonMatch = rawBody.match(/Motivo(?: detallado)?(?: del reporte)?:\s*[\r\n]*([\s\S]*?)(?=\n\n|\n•|\nDescripción|$)/i);
              if (reasonMatch) {
                reasonText = reasonMatch[1].trim();
              } else if (rawBody.toLowerCase().includes("cancelado") || rawBody.toLowerCase().includes("revisar el caso")) {
                const serviceCancelMatch = rawBody.match(/servicio cancelado de\s+([^\n\r.]+)/i) ||
                  rawBody.match(/servicio de\s+([^\n\r.]+)/i);
                reasonText = serviceCancelMatch 
                  ? `Cancelación del servicio de ${serviceCancelMatch[1].trim()}`
                  : "Cancelación de servicio";
              }

              // Extraer Descripción
              const descMatch = rawBody.match(/Descripción detallada:\s*[\r\n]*([\s\S]*?)(?=\n\n|\n•|$)/i);
              const descText = descMatch ? descMatch[1].trim() : null;

              // Limpiar cuerpo general eliminando cualquier línea con ID técnico
              const cleanedFallbackBody = rawBody
                .split("\n")
                .filter((line) => {
                  const l = line.toLowerCase();
                  return (
                    !l.includes("id del trabajo") &&
                    !l.includes("id del chat") &&
                    !l.includes("id de usuario") &&
                    !l.includes("solicitadopor:") &&
                    !l.includes("canceladopor:") &&
                    !l.includes("aceptadopor:") &&
                    !l.includes("rechazadopor:") &&
                    !line.match(/\b(ID|conversation_id|chat_id|user_id|usuario_id)\s*[:=]/i) &&
                    !line.match(/\(ID:\s*[^)]+\)/i)
                  );
                })
                .join("\n")
                .trim();

              const isSula =
                cleanTitle === "Reporte de Sula AI" ||
                rawTitle.toLowerCase().includes("sula") ||
                rawTitle.toLowerCase().includes("ai") ||
                rawBody.toLowerCase().includes("historial de la conversación");
              const hasChatId = !!rawBody.match(
                /(?:ID del Chat|ID de Chat|Chat ID|\(ID)\s*[:=]?\s*([a-f0-9-]{10,})/i
              ) || !!rawBody.match(/(?:chat_id)\s*[:=]\s*([a-f0-9-]{10,})/i);
              const canViewChat = hasChatId || isSula;

              return (
                <View key={report.id} style={[styles.card, isResolved && styles.cardResolved]}>
                  {/* Top Bar */}
                  <View style={styles.cardTop}>
                    <View style={[styles.typeIconBox, { backgroundColor: isResolved ? "#E8F8F0" : "#F3ECFA" }]}>
                      <MaterialCommunityIcons
                        name={reportIcon as any}
                        size={20}
                        color={isResolved ? "#2ECC71" : reportColor}
                      />
                    </View>
                    <View style={styles.titleCol}>
                      <Text style={styles.reportTitle} numberOfLines={1}>
                        {cleanTitle}
                      </Text>
                      <Text style={styles.reportDate}>
                        {report.fecha_creacion
                          ? new Date(report.fecha_creacion).toLocaleDateString("es-ES", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Fecha N/A"}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusPill,
                        isResolved ? styles.statusPillResolved : styles.statusPillPending,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          isResolved ? styles.statusPillTextResolved : styles.statusPillTextPending,
                        ]}
                      >
                        {isResolved ? "RESUELTO" : "PENDIENTE"}
                      </Text>
                    </View>
                  </View>

                  {/* Structured Details Box */}
                  <View style={styles.detailsContainer}>
                    {/* Quién reporta */}
                    <View style={styles.detailRow}>
                      <MaterialCommunityIcons name="account-arrow-right-outline" size={16} color={PURPLE} />
                      <Text style={styles.detailLabel}>Quién reporta:</Text>
                      <Text style={styles.detailValue} numberOfLines={1}>
                        {reporterName}
                        {report.usuario?.correo ? ` (${report.usuario.correo})` : ""}
                      </Text>
                    </View>

                    {/* A quién reporta o quién canceló (si aplica) */}
                    {reportedName && (
                      <View style={styles.detailRow}>
                        <MaterialCommunityIcons name="account-alert-outline" size={16} color="#E74C3C" />
                        <Text style={styles.detailLabel}>
                          {cleanTitle === "Solicitud de Revisión" ? "Contraparte que canceló:" : "Reportado:"}
                        </Text>
                        <Text style={[styles.detailValue, { color: "#C0392B" }]} numberOfLines={1}>
                          {reportedName}
                        </Text>
                      </View>
                    )}

                    {/* Motivo del reporte */}
                    {reasonText ? (
                      <View style={styles.detailBlock}>
                        <View style={styles.detailBlockHeader}>
                          <MaterialCommunityIcons name="alert-circle-outline" size={15} color="#FF9500" />
                          <Text style={styles.detailBlockLabel}>Motivo del reporte:</Text>
                        </View>
                        <Text style={styles.detailBlockContent}>{reasonText}</Text>
                      </View>
                    ) : null}

                    {/* Descripción del reporte */}
                    {descText ? (
                      <View style={styles.detailBlock}>
                        <View style={styles.detailBlockHeader}>
                          <MaterialCommunityIcons name="text-box-outline" size={15} color="#555" />
                          <Text style={styles.detailBlockLabel}>Descripción:</Text>
                        </View>
                        <Text style={styles.detailBlockContent}>{descText}</Text>
                      </View>
                    ) : (!reasonText && cleanedFallbackBody) ? (
                      <View style={styles.detailBlock}>
                        <Text style={styles.detailBlockContent}>{cleanedFallbackBody}</Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Action Buttons (2x2 Grid) */}
                  <View style={styles.cardActions}>
                    {/* Fila superior: Ver Chat y/o Notificar Usuario */}
                    <View style={styles.cardActionsRow}>
                      {canViewChat && (
                        <TouchableOpacity
                          style={[styles.cardBtn, styles.btnViewChat]}
                          activeOpacity={0.8}
                          onPress={() => handleOpenChat(report, cleanTitle)}
                        >
                          <MaterialCommunityIcons name="chat-processing-outline" size={16} color="#007AFF" />
                          <Text style={styles.btnViewChatText} numberOfLines={1}>Ver Chat</Text>
                        </TouchableOpacity>
                      )}

                      <TouchableOpacity
                        style={[styles.cardBtn, styles.btnNotice]}
                        activeOpacity={0.8}
                        onPress={() => handleNotifyUser(report)}
                      >
                        <MaterialCommunityIcons name="email-fast-outline" size={16} color={PURPLE} />
                        <Text style={styles.btnNoticeText} numberOfLines={1}>Notificar Usuario</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Fila inferior: Resolver / Reabrir y Eliminar */}
                    <View style={styles.cardActionsRow}>
                      <TouchableOpacity
                        style={[styles.cardBtn, styles.btnResolve, isResolved && styles.btnReopen]}
                        activeOpacity={0.8}
                        onPress={() => onToggleResolved(report.id, isResolved)}
                      >
                        <MaterialCommunityIcons
                          name={isResolved ? "refresh" : "check"}
                          size={16}
                          color={isResolved ? "#FF9500" : "#2ECC71"}
                        />
                        <Text
                          style={[
                            styles.btnResolveText,
                            { color: isResolved ? "#FF9500" : "#2ECC71" },
                          ]}
                          numberOfLines={1}
                        >
                          {isResolved ? "Reabrir" : "Resolver"}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.cardBtn, styles.btnDelete]}
                        activeOpacity={0.8}
                        onPress={() => confirmDelete(report)}
                      >
                        <MaterialCommunityIcons name="trash-can-outline" size={16} color="#E74C3C" />
                        <Text style={styles.btnDeleteText} numberOfLines={1}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
        </View>

        {/* Visor de Chat en Pantalla Completa */}
        {chatViewerVisible && (
          <View style={styles.chatViewerOverlay}>
            <View style={[styles.chatViewerContainer, isLargeScreen && styles.chatViewerContainerLarge]}>
              {/* Header del Visor */}
              <View
                style={[
                  styles.chatViewerHeader,
                  {
                    paddingTop: Platform.select({
                      web: 14,
                      android: (insets.top || 24) + 6,
                      ios: insets.top > 0 ? insets.top : 12,
                      default: 14,
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => setChatViewerVisible(false)}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {chatViewerData?.title || "Conversación"}
                  </Text>
                  <Text style={styles.headerSubtitle} numberOfLines={1}>
                    {chatViewerData?.subtitle || "Detalles del caso"}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setChatViewerVisible(false)}
                  style={styles.chatViewerCloseBtn}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={22} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Sub-banner informativo sin ningún ID */}
              {chatViewerData?.type === "human" && (chatViewerData.clientInfo || chatViewerData.proInfo) ? (
                <View style={styles.participantsBanner}>
                  {chatViewerData.clientInfo && (
                    <View style={styles.participantChipClient}>
                      <View style={styles.dotPurple} />
                      <Text style={styles.participantChipClientText} numberOfLines={1}>
                        {chatViewerData.clientInfo.name} (Cliente)
                      </Text>
                    </View>
                  )}
                  {chatViewerData.proInfo && (
                    <View style={styles.participantChipPro}>
                      <View style={styles.dotBlue} />
                      <Text style={styles.participantChipProText} numberOfLines={1}>
                        {chatViewerData.proInfo.name} (Profesional)
                      </Text>
                    </View>
                  )}
                </View>
              ) : chatViewerData?.type === "sula" ? (
                <View style={styles.sulaBanner}>
                  <MaterialCommunityIcons name="robot-outline" size={16} color="#8E44AD" />
                  <Text style={styles.sulaBannerText}>
                    Historial completo capturado al momento del reporte
                  </Text>
                </View>
              ) : null}

              {/* Contenedor de Mensajes */}
              <View style={styles.chatViewerBody}>
                {chatViewerLoading ? (
                  <View style={styles.chatLoadingWrap}>
                    <ActivityIndicator size="large" color={PURPLE} />
                    <Text style={styles.chatLoadingText}>Cargando mensajes del chat...</Text>
                  </View>
                ) : chatViewerError ? (
                  <View style={styles.chatErrorWrap}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#E74C3C" />
                    <Text style={styles.chatErrorTitle}>Error al cargar conversación</Text>
                    <Text style={styles.chatErrorDesc}>{chatViewerError}</Text>
                    <TouchableOpacity
                      style={styles.chatRetryBtn}
                      onPress={() => setChatViewerVisible(false)}
                    >
                      <Text style={styles.chatRetryBtnText}>Cerrar</Text>
                    </TouchableOpacity>
                  </View>
                ) : !chatViewerData?.messages || chatViewerData.messages.length === 0 ? (
                  <View style={styles.chatEmptyWrap}>
                    <MaterialCommunityIcons name="chat-outline" size={50} color="#BBB" />
                    <Text style={styles.chatEmptyTitle}>No hay mensajes registrados</Text>
                    <Text style={styles.chatEmptySubtitle}>
                      No se encontraron mensajes en esta conversación.
                    </Text>
                  </View>
                ) : (
                  <ScrollView
                    contentContainerStyle={styles.chatMessagesContent}
                    showsVerticalScrollIndicator={false}
                  >
                    {chatViewerData.messages.map((item, idx) => {
                      const isClient = item.senderRole === "client";
                      const isPro = item.senderRole === "pro";
                      const isUser = item.senderRole === "user";
                      const isSula = item.senderRole === "sula";

                      const roleBadgeBg = isClient
                        ? "#F3ECFA"
                        : isPro
                        ? "#EBF5FB"
                        : isUser
                        ? "#F3ECFA"
                        : "#F4ECF7";
                      const roleBadgeColor = isClient
                        ? PURPLE
                        : isPro
                        ? "#007AFF"
                        : isUser
                        ? PURPLE
                        : "#8E44AD";
                      const roleBadgeText = isClient
                        ? "CLIENTE"
                        : isPro
                        ? "PROFESIONAL"
                        : isUser
                        ? "USUARIO"
                        : "SULA AI";

                      const formattedTime = item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("es-ES", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : null;

                      return (
                        <View
                          key={item.id || idx}
                          style={[
                            styles.msgBubbleCard,
                            isPro && styles.msgBubbleCardPro,
                            isClient && styles.msgBubbleCardClient,
                            isSula && styles.msgBubbleCardSula,
                            isUser && styles.msgBubbleCardUser,
                          ]}
                        >
                          {/* Header del mensaje */}
                          <View style={styles.msgBubbleHeader}>
                            <View style={styles.msgSenderInfo}>
                              <MaterialCommunityIcons
                                name={
                                  isSula
                                    ? "robot-confused-outline"
                                    : isPro
                                    ? "briefcase-outline"
                                    : "account-circle-outline"
                                }
                                size={18}
                                color={roleBadgeColor}
                              />
                              <Text style={styles.msgSenderName} numberOfLines={1}>
                                {item.senderName}
                              </Text>
                              <View style={[styles.roleBadge, { backgroundColor: roleBadgeBg }]}>
                                <Text style={[styles.roleBadgeText, { color: roleBadgeColor }]}>
                                  {roleBadgeText}
                                </Text>
                              </View>
                            </View>
                            {formattedTime && (
                              <Text style={styles.msgTimeText}>{formattedTime}</Text>
                            )}
                          </View>

                          {/* Contenido del mensaje */}
                          <Text style={styles.msgBodyText}>{item.content}</Text>
                        </View>
                      );
                    })}
                  </ScrollView>
                )}
              </View>

              {/* Footer con botón para cerrar */}
              <View
                style={[
                  styles.chatViewerFooter,
                  {
                    paddingBottom: Platform.select({
                      ios: insets.bottom > 0 ? insets.bottom : 14,
                      android: (insets.bottom || 0) + 12,
                      web: 14,
                      default: 14,
                    }),
                  },
                ]}
              >
                <TouchableOpacity
                  style={styles.chatCloseFooterBtn}
                  activeOpacity={0.8}
                  onPress={() => setChatViewerVisible(false)}
                >
                  <MaterialCommunityIcons name="arrow-left" size={18} color="#FFF" />
                  <Text style={styles.chatCloseFooterBtnText}>Volver a Reportes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        {/* Modal de confirmación para eliminar reporte */}
        {reportToDelete && (
          <AdminConfirmModal
            visible={!!reportToDelete}
            type="delete"
            title="¿Eliminar reporte?"
            description="¿Estás seguro de que deseas eliminar este reporte de la bandeja de incidencias?"
            confirmText="Eliminar"
            onClose={() => setReportToDelete(null)}
            onConfirm={() => {
              onDeleteReport(reportToDelete.id);
              setReportToDelete(null);
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  backBtn: {
    padding: 6,
    marginRight: 10,
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#222",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#777",
  },
  listCountHeader: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 2,
  },
  listCountText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
    gap: 8,
  },
  tabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F2F3F7",
    gap: 6,
  },
  tabBtnActiveDanger: {
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  tabBtnActiveSuccess: {
    backgroundColor: "#E8F8F0",
    borderWidth: 1,
    borderColor: "#C5EED9",
  },
  tabBtnText: {
    fontSize: 13,
    color: "#666",
    fontWeight: "600",
  },
  tabBtnTextDanger: {
    color: "#E74C3C",
  },
  tabBtnTextSuccess: {
    color: "#2ECC71",
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F2F3F7",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchInput: {
    flex: 1,
    marginLeft: 6,
    fontSize: 13,
    color: "#222",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: { boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.03)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  cardResolved: {
    backgroundColor: "#FAFBFD",
    borderColor: "#E5E9F0",
    opacity: 0.9,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typeIconBox: {
    marginRight: 8,
  },
  titleCol: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#222",
  },
  reportDate: {
    fontSize: 11,
    color: "#888",
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillPending: {
    backgroundColor: "#FDEDEC",
  },
  statusPillResolved: {
    backgroundColor: "#E8F8F0",
  },
  statusPillText: {
    fontSize: 9,
    fontWeight: "bold",
  },
  statusPillTextPending: {
    color: "#E74C3C",
  },
  statusPillTextResolved: {
    color: "#2ECC71",
  },
  detailsContainer: {
    backgroundColor: "#F9FAFC",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#555",
  },
  detailValue: {
    fontSize: 12.5,
    fontWeight: "600",
    color: "#222",
    flexShrink: 1,
  },
  detailBlock: {
    backgroundColor: "white",
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#EAECEF",
    marginTop: 2,
  },
  detailBlockHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 3,
  },
  detailBlockLabel: {
    fontSize: 11.5,
    fontWeight: "700",
    color: "#666",
  },
  detailBlockContent: {
    fontSize: 12.5,
    color: "#333",
    lineHeight: 17,
  },
  cardActions: {
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
    paddingTop: 10,
    gap: 8,
  },
  cardActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  btnViewChat: {
    backgroundColor: "#EBF5FB",
    borderWidth: 1,
    borderColor: "#D4E6F1",
  },
  btnViewChatText: {
    color: "#007AFF",
    fontSize: 12.5,
    fontWeight: "700",
  },
  btnNotice: {
    backgroundColor: "#F3ECFA",
    borderWidth: 1,
    borderColor: "#EADBF7",
  },
  btnNoticeText: {
    color: PURPLE,
    fontSize: 12.5,
    fontWeight: "700",
  },
  btnResolve: {
    backgroundColor: "#E8F8F0",
    borderWidth: 1,
    borderColor: "#C5EED9",
  },
  btnReopen: {
    backgroundColor: "#FFF5E6",
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  btnResolveText: {
    fontSize: 12.5,
    fontWeight: "700",
  },
  btnDelete: {
    backgroundColor: "#FDEDEC",
    borderWidth: 1,
    borderColor: "#FADBD8",
  },
  btnDeleteText: {
    color: "#E74C3C",
    fontSize: 12.5,
    fontWeight: "700",
  },
  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#666",
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  chatViewerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#F6F7FA",
    zIndex: 1000,
  },
  chatViewerContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "#F6F7FA",
  },
  chatViewerContainerLarge: {
    maxWidth: 780,
    alignSelf: "center",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E5E9F0",
  },
  chatViewerHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEE",
  },
  chatViewerCloseBtn: {
    padding: 6,
    marginLeft: 10,
  },
  participantsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EAEAEA",
    gap: 10,
    flexWrap: "wrap",
  },
  participantChipClient: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  participantChipClientText: {
    fontSize: 12,
    fontWeight: "700",
    color: PURPLE,
  },
  participantChipPro: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EBF5FB",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
  },
  participantChipProText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#007AFF",
  },
  dotPurple: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: PURPLE,
  },
  dotBlue: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#007AFF",
  },
  sulaBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAF5FF",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#E9D8FD",
    gap: 8,
  },
  sulaBannerText: {
    fontSize: 12,
    color: "#7E22CE",
    fontWeight: "600",
  },
  chatViewerBody: {
    flex: 1,
  },
  chatLoadingWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 12,
  },
  chatLoadingText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "600",
  },
  chatErrorWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    gap: 8,
  },
  chatErrorTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C0392B",
    marginTop: 6,
  },
  chatErrorDesc: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    maxWidth: 320,
  },
  chatRetryBtn: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#EAECEF",
  },
  chatRetryBtnText: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#444",
  },
  chatEmptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    gap: 8,
  },
  chatEmptyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#555",
    marginTop: 8,
  },
  chatEmptySubtitle: {
    fontSize: 13,
    color: "#999",
    textAlign: "center",
  },
  chatMessagesContent: {
    padding: 16,
    gap: 12,
  },
  msgBubbleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#DDD",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    ...Platform.select({
      web: { boxShadow: "0px 1px 4px rgba(0, 0, 0, 0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  msgBubbleCardClient: {
    borderLeftColor: PURPLE,
    backgroundColor: "#FAF7FC",
  },
  msgBubbleCardPro: {
    borderLeftColor: "#007AFF",
    backgroundColor: "#F4F9FD",
  },
  msgBubbleCardUser: {
    borderLeftColor: PURPLE,
    backgroundColor: "#FAF7FC",
  },
  msgBubbleCardSula: {
    borderLeftColor: "#8E44AD",
    backgroundColor: "#FFFFFF",
  },
  msgBubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    flexWrap: "wrap",
    gap: 6,
  },
  msgSenderInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  msgSenderName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#222",
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 9.5,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  msgTimeText: {
    fontSize: 11,
    color: "#888",
  },
  msgBodyText: {
    fontSize: 13.5,
    color: "#222",
    lineHeight: 19,
  },
  chatViewerFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  chatCloseFooterBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: PURPLE,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  chatCloseFooterBtnText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
});
