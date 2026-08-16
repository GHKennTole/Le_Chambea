// src/screens/menu/MenuScreen.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import MainLayout from "../../../shared/components/MainLayout";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useMenuController } from "../controllers/useMenuController";
import { useResponsive } from "../../../shared/hooks/useResponsive";

type Nav = NativeStackNavigationProp<RootStackParamList>;

type MenuItemProps = {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  rightText?: string;
  rightTextColor?: string;
  danger?: boolean;
  onPress: () => void;
};

function MenuItem({ icon, title, subtitle, rightText, rightTextColor, danger, onPress }: MenuItemProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.item}>
      <View style={[styles.itemIconWrap, danger && styles.itemIconWrapDanger]}>
        <MaterialCommunityIcons
          name={icon}
          size={22}
          color={danger ? "#B00020" : PURPLE}
        />
      </View>

      <View style={styles.itemText}>
        <Text style={[styles.itemTitle, danger && styles.itemTitleDanger]}>{title}</Text>
        {!!subtitle && <Text style={styles.itemSubtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.itemRight}>
        {!!rightText && (
          <Text style={[styles.itemRightText, rightTextColor ? { color: rightTextColor } : null]}>
            {rightText}
          </Text>
        )}
        <MaterialCommunityIcons name="chevron-right" size={24} color="#9A9AA3" />
      </View>
    </TouchableOpacity>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const vm = useMenuController();
  const { isLargeScreen } = useResponsive();

  return (
    <MainLayout active="Menu">
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header Perfil estático */}
        <View style={styles.staticHeaderContainer}>
          <View style={styles.topBanner} />
          <TouchableOpacity 
            activeOpacity={0.9} 
            onPress={() => navigation.navigate("MyProfile")} 
            style={styles.profileCard}
          >
            <View style={styles.avatarShadow}>
              <View style={styles.avatar}>
                {vm.user.foto_perfil ? (
                  <Image source={{ uri: vm.user.foto_perfil }} style={styles.avatarImg} />
                ) : (
                  <View style={[styles.avatarImg, { backgroundColor: '#ECECF1', justifyContent: 'center', alignItems: 'center' }]}>
                    <MaterialCommunityIcons name="account" size={30} color="#999" />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {vm.user?.nombre ? `${vm.user?.nombre} ${vm.user.apellidos}`.trim() : 'Usuario registrado'}
                </Text>
              </View>

              <Text style={styles.profileEmail} numberOfLines={1}>
                {vm.user.correo || 'Sin correo'}
              </Text>

              <View style={styles.badgeContainer}>
                <View style={[styles.accountBadge, vm.hasProProfile ? styles.proBadge : styles.noProBadge]}>
                  <MaterialCommunityIcons 
                    name="briefcase-check" 
                    size={14} 
                    color={PURPLE} 
                  />
                  <Text style={[styles.accountBadgeText, vm.hasProProfile ? styles.proBadgeText : styles.noProBadgeText]}>
                    {vm.hasProProfile ? "Cuenta Profesional Activa" : "Cuenta Profesional Inactiva"}
                  </Text>
                </View>
              </View>
            </View>

            <MaterialCommunityIcons name="chevron-right" size={24} color="#9A9AA3" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          // Android:
          overScrollMode="never"
          // iOS extra:
          scrollEventThrottle={16}
        >
          {/* Cuenta */}
          <Section title="Cuenta">
            <MenuItem
              icon="account-edit"
              title="Editar perfil"
              subtitle="Nombre, foto, teléfono, ubicación..."
              onPress={() => navigation.navigate("Profile")}
            />

            <View style={styles.divider} />

            <MenuItem
              icon="star-outline"
              title="Reseñas dejadas"
              subtitle="Administrar reseñas hechas como cliente"
              onPress={() => navigation.navigate("MyReviews")}
            />
          </Section>

        {/* Profesional */}
        <Section title="Profesional">
          <MenuItem
            icon={vm.hasProProfile ? "briefcase-edit" : "briefcase-plus"}
            title="Crear o editar servicios"
            subtitle="Profesión, descripción, precios, portafolio..."
            rightText={vm.hasProProfile ? "Activo" : "Inactivo"}
            rightTextColor={vm.hasProProfile ? "#15803D" : "#DC2626"}
            onPress={() => navigation.navigate("ProfessionalProfile")}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="clipboard-text-clock"
            title="Historial de trabajos realizados"
            subtitle="Completados, en curso y solicitudes"
            onPress={() => navigation.navigate("JobHistory")}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="star-circle"
            title="Reseñas y calificación"
            subtitle="Estrellas, comentarios y métricas"
            onPress={() => navigation.navigate("Reviews")}
          />
        </Section>

        {/* Seguridad */}
        <Section title="Seguridad">
          <MenuItem
            icon="lock-outline"
            title="Cambiar contraseña"
            subtitle="Actualizá tu contraseña"
            onPress={() => vm.goToSecurity(navigation)}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="shield-account-outline"
            title="Privacidad"
            subtitle="Control de datos y visibilidad"
            onPress={() => vm.goToPrivacy(navigation)}
          />
        </Section>

        {/* Ayuda */}
        <Section title="Ayuda">
          <MenuItem
            icon="help-circle-outline"
            title="Soporte"
            subtitle="Reportar un problema o pedir ayuda"
            onPress={() => vm.goToSupport(navigation)}
          />

          <View style={styles.divider} />

          <MenuItem
            icon="file-document-outline"
            title="Términos y políticas"
            subtitle="Información legal"
            onPress={() => vm.goToTerms(navigation)}
          />
        </Section>

        {/* Sesión */}
        <Section title="Sesión">
          <MenuItem
            icon="logout"
            title="Cerrar sesión"
            subtitle="Salir de tu cuenta"
            danger
            onPress={() => {
              if (Platform.OS === 'web') {
                const confirmed = window.confirm("¿Seguro que querés salir?");
                if (confirmed) vm.handleLogout();
              } else {
                Alert.alert("Cerrar sesión", "¿Seguro que querés salir?", [
                  { text: "Cancelar", style: "cancel" },
                  { text: "Salir", style: "destructive", onPress: vm.handleLogout },
                ]);
              }
            }}
          />
        </Section>

        {/* Espacio mínimo para respirar, sin permitir “scroll vacío” */}
        <View style={{ height: 12 }} />
      </ScrollView>
      </View>
    </MainLayout>
  );
}

const PURPLE = "#5A2D82";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F6F8" },

  topBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
    opacity: 0.95,
  },

  staticHeaderContainer: {
    position: "relative",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
    zIndex: 10,
  },

  scroll: { flex: 1, backgroundColor: "#F6F6F8" },
  scrollContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 24 },

  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: '0px 6px 14px rgba(0,0,0,0.07)' } as any,
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
    }),
  },

  avatarShadow: {
    marginRight: 12,
    borderRadius: 999,
    backgroundColor: "#fff",
    padding: 2,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(0,0,0,0.08)' } as any,
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 999,
    backgroundColor: "#EEE",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },

  profileInfo: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  profileName: { fontSize: 16, fontWeight: "900", color: "#111", flexShrink: 1 },

  profileEmail: { fontSize: 13, color: "#5F5F6B", marginTop: 2 },
  
  badgeContainer: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  accountBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  proBadge: {
    backgroundColor: "#DCFCE7",
    borderWidth: 1,
    borderColor: "#86EFAC",
  },
  noProBadge: {
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
  },
  accountBadgeText: {
    fontSize: 11.5,
    fontWeight: "700",
  },
  proBadgeText: {
    color: "#15803D",
  },
  noProBadgeText: {
    color: "#DC2626",
  },

  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: "#6B6B76",
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#ECECF1",
    overflow: "hidden",
  },

  item: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 12 },
  itemIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#F3ECFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemIconWrapDanger: { backgroundColor: "#FCE8EA" },

  itemText: { flex: 1 },
  itemTitle: { fontSize: 15, fontWeight: "900", color: "#111" },
  itemTitleDanger: { color: "#B00020" },
  itemSubtitle: { fontSize: 12.5, color: "#666", marginTop: 2 },

  itemRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  itemRightText: { fontSize: 12, color: "#888", fontWeight: "900" },

  divider: { height: 1, backgroundColor: "#EFEFF4", marginLeft: 66 },
});
