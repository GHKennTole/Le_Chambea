import React, { useState, useEffect } from "react";
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
  Switch,
  KeyboardAvoidingView,
  Modal,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useProfessionalProfileController } from "../controllers/useProfessionalProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const PURPLE_ACCENT = "#5A2D82";
const PURPLE_LIGHT = "#F3ECFA";

const PRICE_PRESETS = [
  { key: "a_cotizar", label: "A cotizar", hasInput: false },
  { key: "segun_trabajo", label: "Según trabajo", hasInput: false },
  { key: "por_hora", label: "Por hora", hasInput: false },
  { key: "precio_fijo", label: "Precio fijo", hasInput: true, placeholder: "Ej: C$ 300" },
];

export default function ProfessionalProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useProfessionalProfileController();
  const { isLargeScreen } = useResponsive();
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showPricePicker, setShowPricePicker] = useState(false);
  const [selectedPriceType, setSelectedPriceType] = useState<string>("a_cotizar");

  useEffect(() => {
    if (showPricePicker && vm.activeService) {
      const val = vm.activeService.rango_precio || "";
      if (val === "A cotizar") setSelectedPriceType("a_cotizar");
      else if (val === "Según trabajo") setSelectedPriceType("segun_trabajo");
      else if (val === "Por hora") setSelectedPriceType("por_hora");
      else if (val) setSelectedPriceType("precio_fijo");
      else setSelectedPriceType("a_cotizar");
    }
  }, [showPricePicker, vm.activeService?.rango_precio]);

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
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Morado Dinámico Compacto */}
          <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 16 }]}>
            <View style={styles.headerSection}>
              <View style={styles.headerTitleRow}>
                <MaterialCommunityIcons name="briefcase-edit" size={26} color="white" />
                <Text style={styles.headerTitle}>Crear o Editar Servicios</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Configura tus oficios, tarifas y portafolio para tus clientes
              </Text>
            </View>
          </View>

          <View style={styles.bodyContent}>
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
                    {vm.categories.map((cat) => {
                      const isSelected = activeService.categoria === cat;

                      return (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.categoriaChip,
                            isSelected && styles.categoriaChipActive,
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
                              isSelected && styles.categoriaChipTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
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

                <View style={styles.descriptionContainer}>
                  <View style={styles.descriptionHeader}>
                    <MaterialCommunityIcons name="text-box-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
                    <Text style={styles.label}>Descripción del servicio</Text>
                  </View>
                  <TextInput
                    style={styles.descriptionInput}
                    placeholder="Detallá tu experiencia, especialidades, herramientas y todo lo que incluye tu servicio..."
                    placeholderTextColor="#aaa"
                    multiline
                    scrollEnabled={false}
                    textAlignVertical="top"
                    value={activeService.descripcion}
                    onChangeText={(v) => vm.updateField("descripcion", v)}
                  />
                </View>

                <View style={styles.divider} />

                <TouchableOpacity
                  style={styles.fieldRow}
                  onPress={() => setShowPricePicker(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="cash" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Tarifa / Modalidad de precio</Text>
                    <Text style={[styles.input, !activeService.rango_precio && styles.placeholderText]}>
                      {activeService.rango_precio || "Seleccionar modalidad de tarifa"}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
                </TouchableOpacity>

                <View style={styles.divider} />

                <View style={styles.fieldRow}>
                  <MaterialCommunityIcons name="map-marker-radius" size={20} color={PURPLE} style={styles.fieldIcon} />
                  <View style={styles.fieldInput}>
                    <Text style={styles.label}>Ubicación / Zona de cobertura</Text>
                    <Text style={styles.readOnlyText}>
                      {vm.userLocation || activeService.zona || "Definida en Editar Perfil"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Portafolio Digital / Fotos de Trabajos */}
              <View style={styles.card}>
                <View style={styles.portfolioHeader}>
                  <Text style={styles.cardTitle}>Portafolio de Trabajos</Text>
                  <Text style={styles.portfolioSubtitle}>
                    Agrega fotos de tus trabajos anteriores para dar mayor confianza a tus clientes.
                  </Text>
                </View>

                <View style={styles.portfolioGrid}>
                  {(activeService.portafolio || []).map((imgUrl, idx) => (
                    <View key={idx} style={styles.portfolioItem}>
                      <Image source={{ uri: imgUrl }} style={styles.portfolioImg} />
                      <TouchableOpacity
                        style={styles.portfolioDeleteBadge}
                        onPress={() => vm.removePortfolioImage(imgUrl)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  {(activeService.portafolio || []).length < 10 && (
                    <TouchableOpacity
                      style={styles.portfolioAddBtn}
                      onPress={vm.addPortfolioImage}
                      activeOpacity={0.8}
                      disabled={vm.uploadingPortafolio}
                    >
                      {vm.uploadingPortafolio ? (
                        <ActivityIndicator color={PURPLE} size="small" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="camera-plus-outline" size={26} color={PURPLE} />
                          <Text style={styles.portfolioAddText}>Añadir foto</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Botón guardar (solo aparece cuando hay cambios o es un nuevo servicio) */}
              {(vm.hasChanges || isNew) && (
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
              )}

              {/* Botón Ver Perfil Profesional */}
              {activeService?.id ? (
                <TouchableOpacity
                  style={styles.viewProfileButton}
                  onPress={() => {
                    (navigation as any).navigate("PublicProfile", {
                      id: activeService.usuario_id,
                      professionalProfileId: activeService.id,
                    });
                  }}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="eye-outline" size={20} color={PURPLE} />
                  <Text style={styles.viewProfileButtonText}>Ver perfil profesional</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <Text style={{ textAlign: 'center', marginTop: 20 }}>No hay servicios</Text>
          )}
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <FloatingBackButton />

        {/* Modal Selección de Tarifa / Precio */}
        <Modal
          visible={showPricePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPricePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPricePicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Modalidad de Tarifa</Text>
              <Text style={styles.modalSubtitle}>Seleccioná cómo querés definir tus precios</Text>

              <View style={{ width: "100%", gap: 10, marginTop: 8, marginBottom: 12 }}>
                {PRICE_PRESETS.map((opt) => {
                  const isSelected = selectedPriceType === opt.key;

                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.genderModalOption, isSelected && styles.genderModalOptionSelected]}
                      onPress={() => {
                        setSelectedPriceType(opt.key);
                        if (!opt.hasInput) {
                          vm.updateField("rango_precio", opt.label);
                          setShowPricePicker(false);
                        } else {
                          // Clear or prepare text field
                          const currentVal = activeService?.rango_precio || "";
                          if (currentVal === "A cotizar" || currentVal === "Según trabajo") {
                            vm.updateField("rango_precio", "");
                          }
                        }
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.genderModalOptionText, isSelected && styles.genderModalOptionTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Input si elige Precio Fijo */}
              {selectedPriceType === "precio_fijo" && (
                <View style={{ width: "100%", marginTop: 4 }}>
                  <Text style={styles.label}>Escribí tu precio fijo</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: "#F6F6F8", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 4 }]}
                    placeholder="Ej: C$ 300"
                    placeholderTextColor="#aaa"
                    value={activeService?.rango_precio === "Precio fijo" ? "" : activeService?.rango_precio || ""}
                    onChangeText={(v) => vm.updateField("rango_precio", v)}
                  />
                  <TouchableOpacity
                    style={[styles.modalConfirmBtn, { marginTop: 14 }]}
                    onPress={() => setShowPricePicker(false)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.modalConfirmText}>Confirmar Tarifa</Text>
                  </TouchableOpacity>
                </View>
              )}
            </Pressable>
          </Pressable>
        </Modal>
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
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    width: "100%",
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.2)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },

  headerSection: {
    alignItems: "center",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: 12,
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
  customCategoryWrap: {
    marginTop: 14,
    backgroundColor: "#F6F6F8",
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2D4F0",
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
  inputDisabled: {
    color: "#888",
  },
  readOnlyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
    paddingVertical: 4,
  },
  inputMultiline: {
    minHeight: 60,
    textAlignVertical: "top",
  },
  descriptionContainer: {
    paddingVertical: 8,
  },
  descriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  descriptionInput: {
    backgroundColor: "#F9F9FB",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ECECF1",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#222",
    lineHeight: 22,
    minHeight: 120,
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
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  viewProfileButton: {
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#E2D4F0",
  },
  viewProfileButtonText: {
    color: PURPLE,
    fontSize: 15,
    fontWeight: "800",
  },
  placeholderText: {
    color: "#aaa",
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: "#A0A0A0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: PURPLE,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    marginBottom: 14,
  },
  genderModalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    backgroundColor: "#F9F9FB",
    gap: 12,
  },
  genderModalOptionSelected: {
    borderColor: PURPLE,
    backgroundColor: "#F3ECFA",
  },
  genderModalOptionText: {
    fontSize: 14.5,
    fontWeight: "700",
    color: "#333",
  },
  genderModalOptionTextSelected: {
    color: PURPLE,
    fontWeight: "900",
  },
  modalConfirmBtn: {
    width: "100%",
    backgroundColor: PURPLE,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
  },
  modalConfirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },

  // Portfolio Styles
  portfolioHeader: {
    marginBottom: 12,
  },
  portfolioSubtitle: {
    fontSize: 12.5,
    color: "#6B6B76",
    marginTop: 4,
    marginBottom: 8,
  },
  portfolioGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 6,
  },
  portfolioItem: {
    width: 85,
    height: 85,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#EEE",
    position: "relative",
  },
  portfolioImg: {
    width: "100%",
    height: "100%",
  },
  portfolioDeleteBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  portfolioAddBtn: {
    width: 85,
    height: 85,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2D4F0",
    borderStyle: "dashed",
    backgroundColor: "#F8F5FC",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
  },
  portfolioAddText: {
    fontSize: 11,
    fontWeight: "700",
    color: PURPLE,
  },
});
