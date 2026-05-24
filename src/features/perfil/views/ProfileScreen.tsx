import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useProfileController } from "../controllers/useProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

const PURPLE = "#5A2D82";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useProfileController();

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBanner} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={vm.pickImage}
              activeOpacity={0.85}
              disabled={vm.uploading}
            >
              {vm.profile.foto_perfil ? (
                <Image
                  source={{ uri: vm.profile.foto_perfil }}
                  style={styles.avatarImg}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <MaterialCommunityIcons name="camera-plus" size={36} color="#999" />
                </View>
              )}

              {vm.uploading && (
                <View style={styles.avatarOverlay}>
                  <ActivityIndicator color="white" size="small" />
                </View>
              )}

              <View style={styles.avatarBadge}>
                <MaterialCommunityIcons name="pencil" size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toca para cambiar foto</Text>
          </View>

          {/* Formulario */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Información personal</Text>

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="account" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Nombre</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu nombre"
                  placeholderTextColor="#aaa"
                  value={vm.profile.nombre}
                  onChangeText={(v) => vm.updateField("nombre", v)}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="account-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Apellido</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Tu apellido"
                  placeholderTextColor="#aaa"
                  value={vm.profile.apellidos}
                  onChangeText={(v) => vm.updateField("apellidos", v)}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="email-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Correo</Text>
                <TextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={vm.profile.correo}
                  editable={false}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="phone-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Teléfono</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+505 0000-0000"
                  placeholderTextColor="#aaa"
                  keyboardType="phone-pad"
                  value={vm.profile.telefono}
                  onChangeText={(v) => vm.updateField("telefono", v)}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.fieldRow}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Ciudad</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: Juigalpa, Chontales"
                  placeholderTextColor="#aaa"
                  value={vm.profile.ciudad}
                  onChangeText={(v) => vm.updateField("ciudad", v)}
                />
              </View>
            </View>
          </View>

          {/* Botón guardar */}
          <TouchableOpacity
            style={[styles.saveButton, vm.saving && styles.saveButtonDisabled]}
            onPress={vm.saveProfile}
            activeOpacity={0.85}
            disabled={vm.saving}
          >
            {vm.saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <MaterialCommunityIcons name="content-save" size={20} color="white" />
                <Text style={styles.saveButtonText}>Guardar cambios</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        <FloatingBackButton />
      </View>
    </KeyboardAvoidingView>
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
    height: 160,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 30,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },

  avatarSection: {
    alignItems: "center",
    marginBottom: 20,
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#fff",
    padding: 4,
    ...Platform.select({
      web: { boxShadow: '0px 6px 12px rgba(0,0,0,0.15)' } as any,
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 6 },
    }),
  },
  avatarImg: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
    backgroundColor: "#ECECF1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 13,
    color: "white",
    fontWeight: "600",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' } as any,
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#6B6B76",
    marginBottom: 16,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  fieldIcon: {
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  fieldInput: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 2,
  },
  input: {
    fontSize: 16,
    color: "#222",
    paddingVertical: 4,
  },
  inputDisabled: {
    color: "#aaa",
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEFF4",
    marginLeft: 36,
  },

  saveButton: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 5px 10px rgba(90,45,130,0.3)' } as any,
      ios: {
        shadowColor: PURPLE,
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 5 },
      },
      android: { elevation: 6 },
    }),
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
