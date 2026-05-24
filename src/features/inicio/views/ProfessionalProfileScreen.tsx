import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Switch,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useProfessionalProfileController } from "../controllers/useProfessionalProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

const PURPLE = "#5A2D82";

export default function ProfessionalProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useProfessionalProfileController();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const { activeService, isNew } = {
    activeService: vm.activeService,
    isNew: vm.activeService ? !vm.activeService.id : true,
  };

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
          {/* Header */}
          <View style={styles.headerSection}>
            <MaterialCommunityIcons name="briefcase-check" size={40} color="white" />
            <Text style={styles.headerTitle}>
              Perfil Profesional
            </Text>
            <Text style={styles.headerSubtitle}>
              Configura tus servicios para que los clientes te encuentren
            </Text>
          </View>

          {/* TABS */}
          <View style={styles.tabsContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsScroll}>
              {vm.services.map((svc, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.tabBtn, vm.activeServiceIndex === index && styles.tabBtnActive]}
                  onPress={() => vm.setActiveServiceIndex(index)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tabText, vm.activeServiceIndex === index && styles.tabTextActive]}>
                    Servicio {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
              {vm.services.length < 3 && (
                <TouchableOpacity style={styles.addTabBtn} onPress={vm.addService}>
                  <MaterialCommunityIcons name="plus" size={18} color={PURPLE} />
                  <Text style={styles.addTabText}>Añadir</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {activeService ? (
            <>
              {/* Estado Activo y Eliminar */}
              <View style={styles.statusCard}>
                <View style={styles.statusLeft}>
                  <View style={[styles.statusDot, activeService.esta_activo ? styles.statusActive : styles.statusInactive]} />
                  <Text style={styles.statusText}>
                    {activeService.esta_activo ? "Servicio activo" : "Servicio inactivo"}
                  </Text>
                  <Switch
                    value={activeService.esta_activo}
                    onValueChange={vm.toggleActive}
                    trackColor={{ false: "#ddd", true: "#c7b3f0" }}
                    thumbColor={activeService.esta_activo ? PURPLE : "#999"}
                    style={{ marginLeft: 8 }}
                  />
                </View>
                {vm.services.length > 1 && (
                  <TouchableOpacity onPress={() => vm.removeService(vm.activeServiceIndex)} style={styles.deleteBtn}>
                    <MaterialCommunityIcons name="trash-can-outline" size={22} color="#dc3545" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Categoría */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Categoría de servicio</Text>

                <TouchableOpacity
                  style={styles.categoriaSelector}
                  onPress={() => setShowCategoryPicker(!showCategoryPicker)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tag-outline" size={20} color={PURPLE} />
                  <Text style={[styles.categoriaSelectorText, !activeService.categoria && { color: "#aaa" }]}>
                    {activeService.categoria || "Selecciona una categoría"}
                  </Text>
                  <MaterialCommunityIcons
                    name={showCategoryPicker ? "chevron-up" : "chevron-down"}
                    size={22}
                    color="#999"
                  />
                </TouchableOpacity>

                {showCategoryPicker && (
                  <View style={styles.categoriaGrid}>
                    {vm.categories.map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[
                          styles.categoriaChip,
                          activeService.categoria === cat && styles.categoriaChipActive,
                        ]}
                        onPress={() => {
                          vm.updateField("categoria", cat);
                          setShowCategoryPicker(false);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.categoriaChipText,
                            activeService.categoria === cat && styles.categoriaChipTextActive,
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Datos del servicio */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Detalles del servicio</Text>

                <View style={styles.fieldRow}>
                  <MaterialCommunityIcons name="hammer-wrench" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Profesión / Oficio</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: Electricista residencial"
                      placeholderTextColor="#aaa"
                      value={activeService.profesion}
                      onChangeText={(v) => vm.updateField("profesion", v)}
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <MaterialCommunityIcons name="text-box-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Descripción</Text>
                    <TextInput
                      style={[styles.input, styles.inputMultiline]}
                      placeholder="Describe tu experiencia y servicios..."
                      placeholderTextColor="#aaa"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      value={activeService.descripcion}
                      onChangeText={(v) => vm.updateField("descripcion", v)}
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <MaterialCommunityIcons name="cash" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Rango de precios</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: C$ 200 - C$ 500"
                      placeholderTextColor="#aaa"
                      value={activeService.rango_precio}
                      onChangeText={(v) => vm.updateField("rango_precio", v)}
                    />
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <MaterialCommunityIcons name="map-marker-radius" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Zona de cobertura</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Ej: Juigalpa y alrededores"
                      placeholderTextColor="#aaa"
                      value={activeService.zona}
                      onChangeText={(v) => vm.updateField("zona", v)}
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
                    <Text style={styles.saveButtonText}>
                      {isNew ? "Crear servicio" : "Guardar cambios"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay servicios</Text>
          )}

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
    height: 150,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
  },

  headerSection: {
    alignItems: "center",
    marginBottom: 16,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    marginTop: 10,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 6,
    textAlign: "center",
  },

  tabsContainer: {
    marginBottom: 20,
    marginTop: 10,
  },
  tabsScroll: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ECECF1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  tabBtnActive: {
    backgroundColor: PURPLE,
    borderColor: PURPLE,
  },
  tabText: {
    color: "#6B6B76",
    fontWeight: "700",
    fontSize: 14,
  },
  tabTextActive: {
    color: "white",
  },
  addTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    backgroundColor: "#F3ECFA",
    borderWidth: 1,
    borderColor: "#E2D4F0",
    gap: 6,
  },
  addTabText: {
    color: PURPLE,
    fontWeight: "800",
    fontSize: 14,
  },

  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#ECECF1",
  },
  statusLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusActive: {
    backgroundColor: "#28a745",
  },
  statusInactive: {
    backgroundColor: "#dc3545",
  },
  statusText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  deleteBtn: {
    padding: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  categoriaSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F6F8",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  categoriaSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#222",
  },
  categoriaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  categoriaChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F3ECFA",
  },
  categoriaChipActive: {
    backgroundColor: PURPLE,
  },
  categoriaChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: PURPLE,
  },
  categoriaChipTextActive: {
    color: "white",
  },

  fieldRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 8,
  },
  fieldIcon: {
    marginRight: 12,
    marginTop: 4,
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
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
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
    marginTop: 12,
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
