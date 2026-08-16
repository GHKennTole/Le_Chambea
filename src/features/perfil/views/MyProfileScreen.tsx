import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useProfileController } from "../controllers/useProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useResponsive } from "../../../shared/hooks/useResponsive";

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PURPLE = "#5A2D82";
const PURPLE_ACCENT = "#5A2D82";
const PURPLE_LIGHT = "#F3ECFA";

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const vm = useProfileController();
  const { isLargeScreen } = useResponsive();

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const DataRow = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
    <View style={styles.dataRow}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name={icon} size={20} color={PURPLE} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value || "No especificado"}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Morado Dinámico */}
        <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 16 }]}>
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              {vm.profile.foto_perfil ? (
                <Image
                  source={{ uri: vm.profile.foto_perfil }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="account" size={60} color="#999" />
                </View>
              )}
            </View>
            <Text style={styles.userName}>
              {vm.profile.nombre} {vm.profile.apellidos}
            </Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Información Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Datos del Perfil</Text>
          
          <DataRow 
            icon="account-outline" 
            label="Nombre completo" 
            value={`${vm.profile.nombre} ${vm.profile.apellidos}`.trim() || "Usuario"} 
          />
          <View style={styles.divider} />
          
          <DataRow 
            icon="email-outline" 
            label="Correo electrónico" 
            value={vm.profile.correo} 
          />
          <View style={styles.divider} />
          
          <DataRow 
            icon="phone-outline" 
            label="Teléfono" 
            value={vm.profile.telefono} 
          />
          <View style={styles.divider} />
          
          <DataRow 
            icon="map-marker-outline" 
            label="Ciudad" 
            value={vm.profile.ciudad} 
          />
          <View style={styles.divider} />
          
          <DataRow 
            icon="cake-variant" 
            label="Fecha de nacimiento" 
            value={vm.profile.fecha_nacimiento} 
          />
          <View style={styles.divider} />
          
          <DataRow 
            icon="gender-transgender" 
            label="Género" 
            value={vm.profile.genero} 
          />
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Profile")}
        >
          <MaterialCommunityIcons name="account-edit-outline" size={22} color="#fff" />
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F6F8",
  },
  container: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 18,
    width: "100%",
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  avatarSection: {
    alignItems: "center",
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    padding: 5,
    marginBottom: 15,
    ...Platform.select({
      web: { boxShadow: '0px 8px 20px rgba(0,0,0,0.2)' } as any,
      default: { elevation: 8, shadowColor: "#000", shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 8 } },
    }),
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 60,
    backgroundColor: "#ECECF1",
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: '0px 4px 15px rgba(0,0,0,0.05)' } as any,
      default: { elevation: 3, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#333",
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  dataRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F3ECFA",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    color: "#888",
    fontWeight: "700",
    marginBottom: 2,
  },
  value: {
    fontSize: 16,
    color: "#222",
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F5",
    marginLeft: 55,
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: PURPLE_ACCENT,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 14px rgba(91,92,156,0.3)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
