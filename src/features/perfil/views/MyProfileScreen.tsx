import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileController } from "../controllers/useProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

const PURPLE = "#5A2D82";

export default function MyProfileScreen() {
  const insets = useSafeAreaInsets();
  const vm = useProfileController();

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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBanner} />
      
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar */}
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
          <Text style={styles.userEmail}>{vm.profile.correo}</Text>
        </View>

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

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Para modificar estos datos, utiliza el botón "Editar Perfil" en el menú principal.
          </Text>
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
  headerBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 40,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },
  avatarSection: {
    alignItems: "center",
    marginBottom: 30,
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
  userEmail: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    marginTop: 4,
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
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#F0F0F5",
    padding: 16,
    borderRadius: 16,
    marginTop: 20,
    alignItems: "center",
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  }
});
