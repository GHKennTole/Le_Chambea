import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  Alert,
  LayoutAnimation,
  UIManager,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../../../services/supabase";

// Habilitar animaciones en Android
if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width } = Dimensions.get("window");
const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

interface MetricItem {
  id: string;
  value: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
}

interface AdminModule {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  bgColor: string;
  badges: string[];
  subActions: { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[];
}

export default function HomeAdminScreen() {
  const insets = useSafeAreaInsets();
  const [expandedModule, setExpandedModule] = useState<string | null>(null);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        Alert.alert("Error", "No se pudo cerrar la sesión: " + error.message);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const confirmLogout = () => {
    if (Platform.OS === "web") {
      if (confirm("¿Estás seguro de que deseas cerrar la sesión?")) {
        handleLogout();
      }
    } else {
      Alert.alert(
        "Cerrar Sesión",
        "¿Estás seguro de que deseas cerrar la sesión del administrador?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Cerrar Sesión", style: "destructive", onPress: handleLogout },
        ]
      );
    }
  };

  const toggleModule = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (expandedModule === id) {
      setExpandedModule(null);
    } else {
      setExpandedModule(id);
    }
  };

  // KPIs deslizables horizontalmente
  const metrics: MetricItem[] = [
    {
      id: "users",
      value: "154",
      label: "Usuarios Totales",
      icon: "account-group",
      color: PURPLE,
      bgColor: LIGHT_PURPLE,
    },
    {
      id: "professionals",
      value: "89",
      label: "Profesionales",
      icon: "card-account-details-outline",
      color: "#007AFF",
      bgColor: "#EBF3FF",
    },
    {
      id: "jobs",
      value: "42",
      label: "Trabajos Activos",
      icon: "briefcase-check",
      color: "#9B51E0",
      bgColor: "#F5EBFF",
    },
    {
      id: "reports_total",
      value: "203",
      label: "Reportes Totales",
      icon: "alert-decagram",
      color: "#FF9500",
      bgColor: "#FFF5E6",
    },
    {
      id: "reports_resolved",
      value: "195",
      label: "Reportes Resueltos",
      icon: "check-decagram-outline",
      color: "#4CD964",
      bgColor: "#E6F9EC",
    },
    {
      id: "reviews",
      value: "215",
      label: "Reseñas Totales",
      icon: "star-circle-outline",
      color: "#FFCC00",
      bgColor: "#FFF9E6",
    },
    {
      id: "ai_hits",
      value: "342",
      label: "Consultas de IA",
      icon: "robot-outline",
      color: "#FF3B30",
      bgColor: "#FFF2F2",
    },
  ];

  // Módulos basados en el diagrama iconográfico
  const modules: AdminModule[] = [
    {
      id: "gestionar_usuarios",
      title: "Gestionar Usuarios",
      description: "Administración global de las cuentas de clientes y profesionales.",
      icon: "account-cog",
      color: PURPLE,
      bgColor: LIGHT_PURPLE,
      badges: ["Suspender", "Supervisar", "Eliminar"],
      subActions: [
        { label: "Suspender Usuarios", icon: "account-off-outline" },
        { label: "Supervisar Perfiles Profesionales", icon: "shield-account-outline" },
        { label: "Eliminar Usuarios", icon: "account-remove-outline" },
      ],
    },
    {
      id: "gestionar_contenido",
      title: "Gestionar Contenido",
      description: "Moderar las interacciones, reseñas y comentarios del sistema.",
      icon: "comment-text-multiple-outline",
      color: "#FF9500",
      bgColor: "#FFF5E6",
      badges: ["Reseñas", "Moderar", "Eliminar"],
      subActions: [
        { label: "Revisar Reseñas", icon: "star-outline" },
        { label: "Moderar Comentarios", icon: "comment-remove-outline" },
        { label: "Eliminar Contenido Inapropiado", icon: "delete-outline" },
      ],
    },
    {
      id: "apartado_ia",
      title: "Apartado de IA",
      description: "Auditar y configurar el asistente cognitivo de IA.",
      icon: "brain",
      color: "#8E44AD",
      bgColor: "#F4ECF7",
      badges: ["Recomendaciones", "Resultados"],
      subActions: [
        { label: "Revisar Recomendaciones de IA", icon: "robot-happy-outline" },
        { label: "Revisar Resultados de Análisis", icon: "chart-bubble" },
      ],
    },
    {
      id: "actividad_sistema",
      title: "Actividad del Sistema",
      description: "Monitoreo del tráfico del servidor y exportación de reportes.",
      icon: "chart-timeline-variant",
      color: "#2ECC71",
      bgColor: "#EAF2F8",
      badges: ["Actividad", "Informes"],
      subActions: [
        { label: "Revisar Log de Actividad", icon: "history" },
        { label: "Generar Informes de Rendimiento", icon: "file-chart-outline" },
      ],
    },
    {
      id: "notificaciones_admin",
      title: "Notificaciones Administrativas",
      description: "Gestión de denuncias del sistema y avisos masivos globales.",
      icon: "bell-ring-outline",
      color: "#E74C3C",
      bgColor: "#FDEDEC",
      badges: ["Alertas", "Reportes", "Solución"],
      subActions: [
        { label: "Recibir Reportes de Usuarios", icon: "alert-octagon-outline" },
        { label: "Gestionar Alertas de Soporte", icon: "bell-cog-outline" },
        { label: "Finalizar y Cerrar Soluciones", icon: "check-decagram-outline" },
      ],
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header - Al estilo del Home de Usuario de Le Chambea */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandTitle}>LE CHAMBEA</Text>
            <View style={styles.badgeAdminContainer}>
              <Text style={styles.badgeAdminText}>ADMINISTRADOR</Text>
            </View>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={confirmLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Section title for KPIs */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métricas de Rendimiento</Text>
          <Text style={styles.sectionSubtitle}>Desliza para ver más indicadores</Text>
        </View>

        {/* Horizontal scroll for KPI cards */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.metricsScroll}
          contentContainerStyle={styles.metricsScrollContent}
        >
          {metrics.map((metric) => (
            <View key={metric.id} style={styles.statCard}>
              <View style={[styles.statIconContainer, { backgroundColor: metric.bgColor }]}>
                <MaterialCommunityIcons name={metric.icon} size={24} color={metric.color} />
              </View>
              <Text style={styles.statNumber}>{metric.value}</Text>
              <Text style={styles.statLabel}>{metric.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Action modules section */}
        <Text style={[styles.sectionTitle, { marginTop: 10, marginBottom: 15 }]}>
          Flujos de Trabajo
        </Text>

        <View style={styles.modulesContainer}>
          {modules.map((module) => {
            const isExpanded = expandedModule === module.id;
            return (
              <View key={module.id} style={styles.moduleWrapper}>
                <TouchableOpacity
                  style={[styles.moduleCard, isExpanded && styles.moduleCardExpanded]}
                  onPress={() => toggleModule(module.id)}
                  activeOpacity={0.9}
                >
                  <View style={styles.moduleHeaderRow}>
                    <View style={[styles.moduleIconBox, { backgroundColor: module.bgColor }]}>
                      <MaterialCommunityIcons name={module.icon} size={28} color={module.color} />
                    </View>
                    <View style={styles.moduleHeaderText}>
                      <Text style={styles.moduleTitle}>{module.title}</Text>
                      <Text style={styles.moduleDesc} numberOfLines={2}>
                        {module.description}
                      </Text>
                    </View>
                    <MaterialCommunityIcons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={24}
                      color="#999"
                    />
                  </View>

                  {/* Badge Row */}
                  <View style={styles.badgeRow}>
                    {module.badges.map((badge, idx) => (
                      <View key={idx} style={[styles.badgePill, { backgroundColor: module.bgColor }]}>
                        <Text style={[styles.badgeText, { color: module.color }]}>{badge}</Text>
                      </View>
                    ))}
                  </View>
                </TouchableOpacity>

                {/* Sub-actions collapsible menu */}
                {isExpanded && (
                  <View style={styles.subActionsContainer}>
                    {module.subActions.map((sub, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.subActionItem}
                        activeOpacity={0.7}
                        onPress={() =>
                          Alert.alert(
                            sub.label,
                            `Acceso directo del flujo administrativo: "${sub.label}". ¿Deseas iniciar este proceso?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Confirmar", onPress: () => {} },
                            ]
                          )
                        }
                      >
                        <MaterialCommunityIcons name={sub.icon} size={20} color={module.color} />
                        <Text style={styles.subActionLabel}>{sub.label}</Text>
                        <MaterialCommunityIcons name="arrow-right" size={16} color="#BBB" />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Spacer de fin */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "white",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F3",
    ...Platform.select({
      web: { boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  headerLeft: {
    flexDirection: "column",
    alignItems: "flex-start",
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#222",
    fontFamily: "SansitaBoldItalic",
    letterSpacing: 0.5,
  },
  badgeAdminContainer: {
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  badgeAdminText: {
    color: PURPLE,
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bellButton: {
    position: "relative",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F9F9FB",
    justifyContent: "center",
    alignItems: "center",
  },
  bellBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "#FF3B30",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: "white",
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "center",
  },
  logoutButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE5E5",
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1A1A1A",
    paddingHorizontal: 20,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 2,
  },
  metricsScroll: {
    marginVertical: 5,
  },
  metricsScrollContent: {
    paddingHorizontal: 20,
    paddingRight: 30, // Margen extra al final para scroll agradable
    gap: 12,
  },
  statCard: {
    width: 145,
    backgroundColor: "white",
    borderRadius: 18,
    padding: 16,
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
        elevation: 3,
      },
    }),
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#222",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: "#777",
    fontWeight: "500",
    textAlign: "center",
  },
  modulesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  moduleWrapper: {
    borderRadius: 22,
    backgroundColor: "white",
    overflow: "hidden",
    ...Platform.select({
      web: { boxShadow: "0px 4px 14px rgba(0, 0, 0, 0.04)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
        elevation: 3,
      },
    }),
  },
  moduleCard: {
    padding: 18,
    backgroundColor: "white",
  },
  moduleCardExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#F4F4F6",
  },
  moduleHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  moduleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  moduleHeaderText: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 2,
  },
  moduleDesc: {
    fontSize: 11,
    color: "#777",
    lineHeight: 15,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 12,
    paddingLeft: 66, // Alinear con el texto al lado del icono
  },
  badgePill: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "bold",
    letterSpacing: 0.2,
  },
  subActionsContainer: {
    backgroundColor: "#FAFBFD",
    paddingVertical: 8,
  },
  subActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F2F5",
  },
  subActionLabel: {
    flex: 1,
    fontSize: 13,
    color: "#444",
    fontWeight: "500",
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#BBB",
  },
  footerSubtext: {
    fontSize: 10,
    color: "#CCC",
    marginTop: 2,
  },
});
