import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdminMetrics, AdminAiLog } from "../models/admin.types";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

import { CATEGORIES } from "../../../shared/constants/categories";

interface Props {
  visible: boolean;
  onClose: () => void;
  metrics: AdminMetrics;
  aiLogs?: AdminAiLog[];
  onLaunchAuditMode: () => void;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "Salud": [
    "medic", "doctor", "enferm", "dentist", "odontolog", "terap", "psicolog", "nutric", "salud", "farmac", "clinica", "fisioterap"
  ],
  "Hogar": [
    "plomer", "fuga", "tubo", "agua", "albañil", "albanil", "pintor", "pintar",
    "carpinter", "mueble", "fontaner", "techo", "gotera", "pared", "puerta",
    "chapa", "cerradur", "cerrajer", "jardin", "limpieza", "construcc", "piso",
    "azulejo", "instalac", "hogar", "casa"
  ],
  "Mecánica": [
    "mecanic", "taller", "motor", "freno", "llanta", "neumatic", "aceite", "afinac",
    "carro", "coche", "auto", "vehicul", "moto", "suspens", "electromecanic"
  ],
  "Tecnología": [
    "electr", "luz", "cable", "cortocircuito", "aire acond", "refri", "computad",
    "laptop", "pc", "celular", "telefono", "software", "wifi", "impresor", "camara",
    "televis", "pantalla", "tecnic", "tecnolog"
  ],
  "Educación": [
    "tutor", "profesor", "maestr", "clase", "enseñ", "manejo", "ingles", "curso",
    "asesor", "educac", "docente"
  ],
  "Belleza": [
    "corte", "cabello", "pelo", "barber", "uñas", "manicur", "pedicur", "masaj",
    "estilist", "maquill", "peinado", "pestañ", "depilac", "peluquer", "belleza", "estetic"
  ],
  "Legal": [
    "abogad", "legal", "tramit", "notari", "contrato", "juridic", "demanda", "asesoria legal"
  ],
  "Transporte": [
    "chofer", "taxi", "flete", "mudanza", "delivery", "repart", "envio", "conductor",
    "transporte", "mensajer", "viaje", "traslado"
  ],
  "Eventos": [
    "cocin", "chef", "comida", "pastel", "reposter", "meser", "evento", "banquet",
    "fiesta", "dj", "animac", "fotograf", "catering", "decorac"
  ],
  "Mascotas": [
    "veterin", "perro", "gato", "mascot", "paseador", "canin", "felin", "entrenador canino"
  ],
  "Seguridad": [
    "segurid", "guardia", "vigilan", "alarma", "camara de segurid", "cerrajero de segurid", "guardaespald", "portero", "custodi"
  ],
  "Otros": [
    "otro", "otros", "otra", "otras", "servicio general", "general"
  ],
};

/**
 * Normaliza y valida que una categoría pertenezca ESTRICTAMENTE a las categorías oficiales del sistema.
 * Si no corresponde a ninguna categoría existente, devuelve null (NUNCA agrega categorías inventadas).
 */
function getValidEstablishedCategory(log: AdminAiLog): string | null {
  // 1. Si el log tiene categoría explícita
  if (log.category && log.category.trim()) {
    const rawCat = log.category.trim();
    const clean = rawCat.toLowerCase();

    // Comprobación exacta con las categorías del sistema
    const exactMatch = CATEGORIES.find((c) => c.toLowerCase() === clean);
    if (exactMatch) return exactMatch;

    if (clean === "otro" || clean === "otros" || clean === "otra" || clean === "otras") {
      return "Otros";
    }

    // Comprobación por mapeo de palabras clave de la categoría
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => clean.includes(kw))) {
        return catName;
      }
    }
  }

  // 2. Si no tiene categoría o la categoría registrada no era estándar, analizar la query
  const q = (log.query || "").toLowerCase().trim();
  if (q) {
    for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some((kw) => q.includes(kw))) {
        return catName;
      }
    }
  }

  // 3. Si no coincide con ninguna de las categorías establecidas existentes, se descarta (no inventar)
  return null;
}

export default function AdminAiMetricsModal({
  visible,
  onClose,
  metrics,
  aiLogs = [],
  onLaunchAuditMode,
}: Props) {
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();

  // Filtrar exclusivamente consultas de clientes (excluir auditorías de administradores)
  const clientAiLogs = useMemo(() => {
    return (aiLogs || []).filter((log) => log.source !== "admin_audit");
  }, [aiLogs]);

  // Cálculo dinámico de distribución por categoría basado únicamente en las categorías establecidas
  const dynamicCategories = useMemo(() => {
    if (!clientAiLogs || clientAiLogs.length === 0) {
      return [];
    }

    const counts: Record<string, number> = {};
    let matchedCount = 0;

    clientAiLogs.forEach((log) => {
      const matchedCat = getValidEstablishedCategory(log);

      // ÚNICAMENTE sumar si pertenece a una categoría ya establecida existente
      if (matchedCat && CATEGORIES.includes(matchedCat)) {
        counts[matchedCat] = (counts[matchedCat] || 0) + 1;
        matchedCount++;
      }
    });

    if (matchedCount === 0) {
      return [];
    }

    const total = matchedCount;
    return Object.entries(counts)
      .map(([name, count]) => {
        const pct = Math.round((count / total) * 100);
        return {
          name,
          count,
          percentage: `${pct}%`,
        };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 categorías principales
  }, [clientAiLogs]);

  const totalCategorizedQueries = useMemo(() => {
    return dynamicCategories.reduce((acc, c) => acc + c.count, 0);
  }, [dynamicCategories]);

  // Velocidad de respuesta calculada según métricas reales de los logs de clientes
  const avgResponseSpeed = useMemo(() => {
    if (!clientAiLogs || clientAiLogs.length === 0) return "~1.2s";
    const logsWithLatency = clientAiLogs.filter(
      (l) => typeof l.responseTimeMs === "number" && l.responseTimeMs > 0
    );
    if (logsWithLatency.length === 0) return "~1.2s";
    const totalMs = logsWithLatency.reduce((acc, l) => acc + (l.responseTimeMs || 0), 0);
    const avgSec = (totalMs / logsWithLatency.length / 1000).toFixed(1);
    return `${avgSec}s`;
  }, [clientAiLogs]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
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
            <Text style={styles.headerTitle}>Métricas del Asistente Virtual</Text>
            <Text style={styles.headerSubtitle}>Auditoría y estadísticas en tiempo real</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Main KPI Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#F4ECF7" }]}>
                <MaterialCommunityIcons name="message-processing-outline" size={24} color="#8E44AD" />
              </View>
              <Text style={styles.statNumber}>{clientAiLogs.length}</Text>
              <Text style={styles.statLabel}>Consultas Procesadas</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#E8F8F0" }]}>
                <MaterialCommunityIcons name="database-check-outline" size={24} color="#2ECC71" />
              </View>
              <Text style={styles.statNumber}>100%</Text>
              <Text style={styles.statLabel}>Sincronización con BD</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#EBF3FF" }]}>
                <MaterialCommunityIcons name="speedometer" size={24} color="#007AFF" />
              </View>
              <Text style={styles.statNumber}>{avgResponseSpeed}</Text>
              <Text style={styles.statLabel}>Velocidad de Respuesta</Text>
            </View>

            <View style={styles.statCard}>
              <View style={[styles.statIconBox, { backgroundColor: "#FFF5E6" }]}>
                <MaterialCommunityIcons name="shield-check-outline" size={24} color="#FF9500" />
              </View>
              <Text style={styles.statNumber}>Activo</Text>
              <Text style={styles.statLabel}>Estado del Asistente</Text>
            </View>
          </View>

          {/* Top Queried Categories */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Categorías más consultadas</Text>
            <Text style={styles.sectionSubtitle}>Top de categorías</Text>

            {dynamicCategories.length === 0 ? (
              <View style={styles.emptyCategoriesBox}>
                <MaterialCommunityIcons name="tag-search-outline" size={32} color="#BDBDBD" />
                <Text style={styles.emptyCategoriesText}>
                  Aún no hay registro de consultas por categorías.
                </Text>
              </View>
            ) : (
              <View style={styles.barsList}>
                {dynamicCategories.map((item, idx) => (
                  <View key={idx} style={styles.barItem}>
                    <View style={styles.barItemHeader}>
                      <Text style={styles.barItemName}>{item.name}</Text>
                      <Text style={styles.barItemValue}>
                        {item.count} {item.count === 1 ? "consulta" : "consultas"} ({item.percentage})
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: item.percentage as any }]} />
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Real AI Queries History List */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Historial de Consultas Recientes</Text>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>En directo</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle}>
              Últimas preguntas formuladas a Sula AI registradas en la base de datos
            </Text>

            {clientAiLogs.length === 0 ? (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="robot-confused-outline" size={44} color="#BDBDBD" />
                <Text style={styles.emptyTitle}>Aún no hay consultas registradas</Text>
                <Text style={styles.emptyText}>
                  Cada vez que un cliente use el Asistente Sula AI, aparecerá registrado aquí en tiempo real y sumará a la métrica.
                </Text>
              </View>
            ) : (
              <View style={styles.logsList}>
                {clientAiLogs.slice(0, 10).map((log) => {
                  const validCategory = getValidEstablishedCategory(log);
                  return (
                    <View key={log.id} style={styles.logCard}>
                      <View style={styles.logCardHeader}>
                        <View style={styles.logCardHeaderLeft}>
                          <View
                            style={[
                              styles.sourceBadge,
                              { backgroundColor: "#E8F8F0" },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name="account"
                              size={12}
                              color="#2ECC71"
                            />
                            <Text
                              style={[
                                styles.sourceBadgeText,
                                { color: "#27AE60" },
                              ]}
                            >
                              Cliente
                            </Text>
                          </View>
                          {validCategory ? (
                            <View style={styles.categoryBadge}>
                              <Text style={styles.categoryBadgeText} numberOfLines={1}>
                                {validCategory}
                              </Text>
                            </View>
                          ) : null}
                        </View>
                        <View style={styles.logCardHeaderRight}>
                          {log.responseTimeMs ? (
                            <Text style={styles.logLatency}>
                              ⚡ {(log.responseTimeMs / 1000).toFixed(1)}s
                            </Text>
                          ) : null}
                          <Text style={styles.logDate}>{formatDate(log.timestamp)}</Text>
                        </View>
                      </View>
                      <Text style={styles.logQuery}>"{log.query}"</Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>

          {/* Botón Auditar Asistente Virtual */}
          <TouchableOpacity
            style={styles.auditBottomBtn}
            activeOpacity={0.85}
            onPress={() => {
              onClose();
              onLaunchAuditMode();
            }}
          >
            <View style={styles.auditBtnContent}>
              <View style={styles.auditIconBadge}>
                <MaterialCommunityIcons name="robot" size={20} color={PURPLE} />
              </View>
              <Text style={styles.auditBottomBtnText}>Auditar asistente virtual</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color="white" />
          </TouchableOpacity>
        </ScrollView>
        </View>
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
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EAEAEA",
    alignItems: "flex-start",
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#222",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
    marginTop: 2,
  },
  auditBottomBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 24,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  auditBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  auditIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
  },
  auditBottomBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EAEAEA",
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#222",
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: "600",
    color: PURPLE,
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#777",
    marginBottom: 14,
    marginTop: 2,
  },
  emptyCategoriesBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    gap: 6,
  },
  emptyCategoriesText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#E8F8F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2ECC71",
  },
  liveText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#27AE60",
  },
  barsList: {
    gap: 12,
  },
  barItem: {
    gap: 4,
  },
  barItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  barItemName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
  },
  barItemValue: {
    fontSize: 11,
    color: "#777",
  },
  barTrack: {
    height: 8,
    backgroundColor: "#F0F0F5",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: PURPLE,
    borderRadius: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#444",
  },
  emptyText: {
    fontSize: 12,
    color: "#888",
    textAlign: "center",
    lineHeight: 18,
  },
  logsList: {
    gap: 10,
  },
  logCard: {
    backgroundColor: "#F9F9FB",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    gap: 6,
  },
  logCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexShrink: 1,
  },
  categoryBadge: {
    backgroundColor: "#F0EBF8",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    maxWidth: 140,
  },
  categoryBadgeText: {
    fontSize: 10,
    color: PURPLE,
    fontWeight: "600",
  },
  logCardHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  logLatency: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#007AFF",
    backgroundColor: "#EBF3FF",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: "bold",
  },
  logDate: {
    fontSize: 11,
    color: "#999",
  },
  logQuery: {
    fontSize: 13,
    color: "#333",
    fontStyle: "italic",
    lineHeight: 18,
  },
});
