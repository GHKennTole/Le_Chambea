import React, { useState } from "react";
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
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useResponsive } from "../../../shared/hooks/useResponsive";
import DatePickerDropdowns from "../../../shared/components/DatePickerDropdowns";
import type { RegisterStackParamList } from "../../../core/navigation/types";
import type { RegisterSharedProps } from "../models/register.types";
import {
  useRegisterController,
  isValidHumanName,
  getNameValidationError,
  calculateAge,
  formatPhoneNumber,
  getPhoneValidationError,
  isValidPhoneNumber,
} from "../controllers/useRegisterController";

const PURPLE = "#5A2D82";
const PURPLE_ACCENT = "#5A2D82";

const GENDER_OPTIONS = [
  { key: "mujer", label: "Mujer" },
  { key: "hombre", label: "Hombre" },
];

function getGenderLabel(val?: string) {
  if (!val) return "Por favor seleccionar su género";
  const lower = val.toLowerCase();
  if (lower === "mujer") return "Mujer";
  if (lower === "hombre") return "Hombre";
  return val;
}

const NICARAGUA_LOCATIONS: Record<string, string[]> = {
  "Managua": [
    "Managua", "Ciudad Sandino", "Tipitapa", "Mateare", 
    "San Rafael del Sur", "El Crucero", "Villa El Carmen", "Tisma", "Ticuantepe", "San Francisco Libre"
  ],
  "Chontales": [
    "Juigalpa", "Acoyapa", "Santo Tomás", "El Rama", "Comalapa", 
    "San Francisco de Cuapa", "La Libertad", "Santo Domingo", "San Pedro de Lóvago", "El Ayote"
  ],
  "León": [
    "León", "Nagarote", "La Paz Centro", "Larreynaga (Malpaisillo)", "Telica", 
    "Quezalguaque", "Santa Rosa del Peñón", "El Sauce", "Achuapa", "El Jícaro"
  ],
  "Granada": [
    "Granada", "Diriomo", "Diriá", "Nandaime"
  ],
  "Masaya": [
    "Masaya", "Nindirí", "Catarina", "San Juan de Oriente", "Niquinohomo", 
    "Nandasmo", "Masatepe", "La Concepción", "Tisma"
  ],
  "Matagalpa": [
    "Matagalpa", "Sébaco", "Ciudad Darío", "San Ramón", "San Dionisio", 
    "Esquipulas", "Muy Muy", "Matiguás", "Rancho Grande", "Río Blanco", "Tuma-La Dalia", "Terrabona", "San Isidro"
  ],
  "Estelí": [
    "Estelí", "Condega", "Pueblo Nuevo", "San Juan de Limay", "La Trinidad", "San Nicolás"
  ],
  "Chinandega": [
    "Chinandega", "El Viejo", "Corinto", "Puerto Morazán", "Chichigalpa", 
    "Posoltega", "El Realejo", "Somotillo", "Villa Nueva", "Santo Tomás del Norte", "Cinco Pinos", "San Pedro del Norte", "San Francisco del Norte"
  ],
  "Carazo": [
    "Jinotepe", "Diriamba", "San Marcos", "Santa Teresa", "La Concepción", "El Rosario", "La Paz de Carazo", "Dolores"
  ],
  "Rivas": [
    "Rivas", "San Juan del Sur", "Tola", "Belén", "Potosí", "Buenos Aires", "San Jorge", "Altagracia", "Moyogalpa", "Cárdenas"
  ],
  "Jinotega": [
    "Jinotega", "San Rafael del Norte", "San Sebastián de Yalí", "La Concordia", "San José de Bocay", "El Cuá", "Santa María de Pantasma", "Wiwilí de Jinotega"
  ],
  "Nueva Segovia": [
    "Ocotal", "Jalapa", "Jícaro", "Quilalí", "Murra", "San Fernando", "Ciudad Antigua", "Mozonte", "Santa María", "Dipilto", "Macuelizo"
  ],
  "Madriz": [
    "Somoto", "Telpaneca", "San Juan de Río Coco", "Palacagüina", "Yalagüina", "Totogalpa", "Las Sabanas", "San Lucas", "Cusmapa"
  ],
  "Boaco": [
    "Boaco", "Camoapa", "San Lorenzo", "Teustepe", "San José de los Remates", "Santa Lucía"
  ],
  "Río San Juan": [
    "San Carlos", "El Castillo", "San Miguelito", "Morrito", "San Juan de Nicaragua", "Solentiname"
  ],
  "RACCN": [
    "Puerto Cabezas (Bilwi)", "Waspam", "Rosita", "Bonanza", "Siuna", "Mulukukú", "Prinzapolka", "Waslala"
  ],
  "RACCS": [
    "Bluefields", "El Rama", "Nueva Guinea", "Muelle de los Bueyes", "Corn Island", "Desembocadura de Río Grande", "Laguna de Perlas", "Kukra Hill", "Tortuguero", "La Cruz de Río Grande"
  ]
};

type Props = NativeStackScreenProps<RegisterStackParamList, "RegisterUsers"> & RegisterSharedProps;

export default function RegisterUsers({ navigation, formData, setFormData }: Props) {
  const insets = useSafeAreaInsets();
  const vm = useRegisterController();
  const { isLargeScreen } = useResponsive();

  const [showGenderPicker, setShowGenderPicker] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  // Sincronizar estado local con formData compartido
  const [nombre, setNombre] = useState(formData.nombre || "");
  const [apellidos, setApellidos] = useState(formData.apellidos || "");
  const [telefono, setTelefono] = useState(formatPhoneNumber(formData.telefono || ""));
  const [ciudad, setCiudad] = useState(formData.ciudad || "");
  const [fechaNacimiento, setFechaNacimiento] = useState(formData.fecha_nacimiento || "");
  const [genero, setGenero] = useState(formData.genero || "");
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(formData.foto_perfil || null);

  const [touched, setTouched] = useState({
    nombre: false,
    apellidos: false,
    telefono: false,
  });

  const age = calculateAge(fechaNacimiento);

  const isNombreValid = isValidHumanName(nombre);
  const isApellidosValid = isValidHumanName(apellidos);
  const isTelefonoValid = isValidPhoneNumber(telefono);
  const isCiudadValid = ciudad.trim().length > 0;
  const isFechaValid = !!fechaNacimiento && age !== null && age >= 18;
  const isGeneroValid = genero.toLowerCase() === "hombre" || genero.toLowerCase() === "mujer";

  const nombreError = (touched.nombre || nombre.length > 0) ? getNameValidationError(nombre, "nombre", 3) : null;
  const apellidosError = (touched.apellidos || apellidos.length > 0) ? getNameValidationError(apellidos, "apellido", 3) : null;
  const telefonoError = touched.telefono ? getPhoneValidationError(telefono) : null;

  const canSubmit =
    isNombreValid &&
    isApellidosValid &&
    isTelefonoValid &&
    isCiudadValid &&
    isFechaValid &&
    isGeneroValid;

  const handlePickPhoto = () => {
    vm.pickImage((uri) => {
      setFotoPerfil(uri);
      setFormData((prev) => ({ ...prev, foto_perfil: uri }));
    });
  };

  const handleNext = () => {
    if (!canSubmit) {
      setTouched({ nombre: true, apellidos: true, telefono: true });
      const val = vm.validateProfileData({
        ...formData,
        nombre,
        apellidos,
        telefono,
        ciudad,
        fecha_nacimiento: fechaNacimiento,
        genero,
        foto_perfil: fotoPerfil,
      });
      if (!val.valid) {
        vm.showNiceAlert("danger", "Campos incompletos", val.message || "Completa todos los campos obligatorios.");
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      nombre: nombre.trim(),
      apellidos: apellidos.trim(),
      telefono: telefono.trim(),
      ciudad: ciudad.trim(),
      fecha_nacimiento: fechaNacimiento,
      genero,
      foto_perfil: fotoPerfil,
    }));

    navigation.navigate("RegisterAuth");
  };

  const alertTranslateY = vm.alertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Alerta flotante */}
        {vm.alertBox.visible && (
          <Animated.View
            style={[
              styles.alertWrap,
              {
                top: 16,
                opacity: vm.alertAnim,
                transform: [{ translateY: alertTranslateY }],
              },
            ]}
          >
            <View
              style={[
                styles.alertBox,
                vm.alertBox.type === "success" && styles.alertSuccess,
                vm.alertBox.type === "danger" && styles.alertDanger,
                vm.alertBox.type === "warning" && styles.alertWarning,
              ]}
            >
              <View style={styles.alertHeader}>
                <Text style={styles.alertTitle}>{vm.alertBox.title}</Text>
                <TouchableOpacity
                  onPress={vm.closeAlertNow}
                  style={styles.alertCloseBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.alertCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.alertMessage}>{vm.alertBox.message}</Text>
            </View>
          </Animated.View>
        )}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Morado Dinámico */}
          <View style={isLargeScreen ? styles.headerDesktopContainer : undefined}>
            <View
              style={[
                styles.purpleHeaderWrapper,
                { paddingTop: 16 },
                isLargeScreen && styles.purpleHeaderWrapperDesktop,
              ]}
            >
              <FloatingBackButton
                position="top-right"
                backgroundColor="#816ab4"
                iconColor="white"
                iconSize={isLargeScreen ? 20 : 24}
                onPress={() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    navigation.getParent()?.goBack();
                  }
                }}
                style={isLargeScreen ? styles.backButtonDesktop : { top: (insets.top || 0) + 12 }}
              />

              <View style={[styles.stepsIndicator, isLargeScreen && styles.stepsIndicatorDesktop]}>
                <View style={[styles.stepDot, styles.stepDotActive]} />
                <View style={styles.stepDot} />
              </View>

              <View style={styles.avatarSection}>
                <TouchableOpacity
                  style={[styles.avatarWrap, isLargeScreen && styles.avatarWrapDesktop]}
                  onPress={handlePickPhoto}
                  activeOpacity={0.85}
                  disabled={vm.uploadingPhoto || vm.loading}
                >
                  {fotoPerfil ? (
                    <Image source={{ uri: fotoPerfil }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <MaterialCommunityIcons name="camera-plus" size={isLargeScreen ? 32 : 38} color="#888" />
                    </View>
                  )}

                  {vm.uploadingPhoto && (
                    <View style={styles.avatarOverlay}>
                      <ActivityIndicator color="white" size="small" />
                    </View>
                  )}

                  <View style={[styles.avatarBadge, isLargeScreen && styles.avatarBadgeDesktop]}>
                    <MaterialCommunityIcons name="camera" size={isLargeScreen ? 12 : 14} color="white" />
                  </View>
                </TouchableOpacity>
                <Text style={[styles.avatarHint, isLargeScreen && styles.avatarHintDesktop]}>
                  {fotoPerfil ? "Toca para cambiar foto" : "Toca para agregar foto (opcional)"}
                </Text>
              </View>
            </View>
          </View>

          {/* Formulario / Tarjeta Información personal */}
          <View style={[styles.bodyContent, isLargeScreen && styles.bodyContentDesktop]}>
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardTitle}>Información personal</Text>
              </View>

              {/* Nombre */}
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="account" size={22} color={PURPLE} style={styles.fieldIcon} />
                <View style={styles.fieldInput}>
                  <Text style={styles.label}>Nombre *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tu nombre"
                    placeholderTextColor="#aaa"
                    value={nombre}
                    onChangeText={(t) => {
                      setNombre(t);
                      setFormData((p) => ({ ...p, nombre: t }));
                      if (!touched.nombre) setTouched((p) => ({ ...p, nombre: true }));
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, nombre: true }))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              {!!nombreError && (
                <Text style={styles.fieldError}>{nombreError}</Text>
              )}

              <View style={styles.divider} />

              {/* Apellido */}
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="account-outline" size={22} color={PURPLE} style={styles.fieldIcon} />
                <View style={styles.fieldInput}>
                  <Text style={styles.label}>Apellido *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Tu apellido"
                    placeholderTextColor="#aaa"
                    value={apellidos}
                    onChangeText={(t) => {
                      setApellidos(t);
                      setFormData((p) => ({ ...p, apellidos: t }));
                      if (!touched.apellidos) setTouched((p) => ({ ...p, apellidos: true }));
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, apellidos: true }))}
                    autoCapitalize="words"
                  />
                </View>
              </View>
              {!!apellidosError && (
                <Text style={styles.fieldError}>{apellidosError}</Text>
              )}

              <View style={styles.divider} />

              {/* Teléfono */}
              <View style={styles.fieldRow}>
                <MaterialCommunityIcons name="phone-outline" size={22} color={PURPLE} style={styles.fieldIcon} />
                <View style={styles.fieldInput}>
                  <Text style={styles.label}>Teléfono *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0000-0000"
                    placeholderTextColor="#aaa"
                    keyboardType="phone-pad"
                    maxLength={9}
                    value={telefono}
                    onChangeText={(t) => {
                      const formatted = formatPhoneNumber(t);
                      setTelefono(formatted);
                      setFormData((p) => ({ ...p, telefono: formatted }));
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, telefono: true }))}
                  />
                </View>
              </View>
              {!!telefonoError && (
                <Text style={styles.fieldError}>{telefonoError}</Text>
              )}

              <View style={styles.divider} />

              {/* Ubicación (Modal Nicaragua) */}
              <TouchableOpacity
                style={styles.fieldRow}
                onPress={() => {
                  setSelectedDepartment(null);
                  setShowLocationPicker(true);
                }}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={22} color={PURPLE} style={styles.fieldIcon} />
                <View style={styles.fieldInput}>
                  <Text style={styles.label}>Ubicación *</Text>
                  <Text style={[styles.input, !ciudad && styles.placeholderText]}>
                    {ciudad || "Seleccionar departamento y municipio"}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Fecha de nacimiento */}
              <View style={styles.fieldRowVertical}>
                <View style={styles.labelRow}>
                  <MaterialCommunityIcons name="cake-variant" size={22} color={PURPLE} style={styles.fieldIcon} />
                  <Text style={styles.label}>
                    Fecha de nacimiento * {age !== null ? `(${age} años)` : ""}
                  </Text>
                </View>
                <View style={{ marginLeft: 36, marginTop: 4 }}>
                  <DatePickerDropdowns
                    value={fechaNacimiento}
                    onChange={(iso) => {
                      setFechaNacimiento(iso);
                      setFormData((p) => ({ ...p, fecha_nacimiento: iso }));
                    }}
                    accentColor={PURPLE}
                  />
                </View>
                {fechaNacimiento.length > 0 && (age === null || age < 18) && (
                  <Text style={[styles.fieldError, { marginLeft: 36, marginTop: 6 }]}>
                    Debes tener al menos 18 años para registrarte.
                  </Text>
                )}
              </View>

              <View style={styles.divider} />

              {/* Género (Modal) */}
              <TouchableOpacity
                style={styles.fieldRow}
                onPress={() => setShowGenderPicker(true)}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons name="gender-transgender" size={22} color={PURPLE} style={styles.fieldIcon} />
                <View style={styles.fieldInput}>
                  <Text style={styles.label}>Género *</Text>
                  <Text style={[styles.input, !genero && styles.placeholderText]}>
                    {getGenderLabel(genero)}
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
              </TouchableOpacity>
            </View>

            {/* Botón Siguiente */}
            <TouchableOpacity
              style={[styles.saveButton, !canSubmit && styles.saveButtonDisabled]}
              onPress={handleNext}
              activeOpacity={0.85}
              disabled={!canSubmit}
            >
              <Text style={styles.saveButtonText}>Siguiente</Text>
              <MaterialCommunityIcons name="arrow-right" size={22} color="white" />
            </TouchableOpacity>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Modal Selección Género */}
        <Modal
          visible={showGenderPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowGenderPicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowGenderPicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Seleccionar Género</Text>
              <Text style={styles.modalSubtitle}>Selecciona tu género</Text>

              <View style={{ width: "100%", gap: 10, marginTop: 8, marginBottom: 12 }}>
                {GENDER_OPTIONS.map((opt) => {
                  const currentGen = String(genero || "").toLowerCase();
                  const isSelected = currentGen === opt.key || currentGen === opt.label.toLowerCase();

                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.modalOption, isSelected && styles.modalOptionSelected]}
                      onPress={() => {
                        setGenero(opt.key);
                        setFormData((p) => ({ ...p, genero: opt.key }));
                        setShowGenderPicker(false);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <Text style={[styles.modalOptionText, isSelected && styles.modalOptionTextSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal Selección de Ubicación (Nicaragua) */}
        <Modal
          visible={showLocationPicker}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowLocationPicker(false);
            setSelectedDepartment(null);
          }}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => {
              setShowLocationPicker(false);
              setSelectedDepartment(null);
            }}
          >
            <Pressable style={[styles.modalContent, { maxHeight: "80%", paddingBottom: 16 }]} onPress={(e) => e.stopPropagation()}>
              <View style={{ width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                {selectedDepartment ? (
                  <TouchableOpacity
                    onPress={() => setSelectedDepartment(null)}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={22} color={PURPLE} />
                    <Text style={{ fontSize: 13, color: PURPLE, fontWeight: "700" }}>Departamentos</Text>
                  </TouchableOpacity>
                ) : (
                  <View />
                )}
                <TouchableOpacity
                  onPress={() => {
                    setShowLocationPicker(false);
                    setSelectedDepartment(null);
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="close" size={24} color="#888" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>
                {selectedDepartment ? `Municipio de ${selectedDepartment}` : "Seleccionar Departamento"}
              </Text>
              <Text style={styles.modalSubtitle}>
                {selectedDepartment
                  ? "Elegí el municipio o ciudad donde te ubicás"
                  : "Elegí tu departamento en Nicaragua"}
              </Text>

              <ScrollView style={{ width: "100%", marginTop: 6 }} showsVerticalScrollIndicator={false}>
                <View style={{ gap: 8, paddingBottom: 10 }}>
                  {!selectedDepartment
                    ? Object.keys(NICARAGUA_LOCATIONS).map((dept) => {
                        const isCurrentDept = ciudad?.includes(dept);

                        return (
                          <TouchableOpacity
                            key={dept}
                            style={[
                              styles.modalOption,
                              isCurrentDept && styles.modalOptionSelected,
                            ]}
                            onPress={() => setSelectedDepartment(dept)}
                            activeOpacity={0.8}
                          >
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={20}
                              color={isCurrentDept ? PURPLE : "#666"}
                            />
                            <Text
                              style={[
                                styles.modalOptionText,
                                { flex: 1 },
                                isCurrentDept && styles.modalOptionTextSelected,
                              ]}
                            >
                              {dept}
                            </Text>
                            <MaterialCommunityIcons
                              name="chevron-right"
                              size={22}
                              color={isCurrentDept ? PURPLE : "#aaa"}
                            />
                          </TouchableOpacity>
                        );
                      })
                    : NICARAGUA_LOCATIONS[selectedDepartment]?.map((muni) => {
                        const locationString = `${muni}, ${selectedDepartment}`;
                        const isSelected = ciudad === locationString;

                        return (
                          <TouchableOpacity
                            key={muni}
                            style={[
                              styles.modalOption,
                              isSelected && styles.modalOptionSelected,
                            ]}
                            onPress={() => {
                              setCiudad(locationString);
                              setFormData((p) => ({ ...p, ciudad: locationString }));
                              setShowLocationPicker(false);
                              setSelectedDepartment(null);
                            }}
                            activeOpacity={0.8}
                          >
                            <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                              {isSelected && <View style={styles.radioInner} />}
                            </View>
                            <Text
                              style={[
                                styles.modalOptionText,
                                isSelected && styles.modalOptionTextSelected,
                              ]}
                            >
                              {muni}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                </View>
              </ScrollView>
            </Pressable>
          </Pressable>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignSelf: "center",
    width: "100%",
  },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 22,
    width: "100%",
    alignItems: "center",
    position: "relative",
  },
  headerDesktopContainer: {
    width: "100%",
    maxWidth: 800,
    paddingHorizontal: 16,
    alignSelf: "center",
    marginTop: 20,
  },
  purpleHeaderWrapperDesktop: {
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    paddingTop: 16,
    paddingBottom: 16,
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 20px rgba(90, 45, 130, 0.2)",
      } as any,
      default: {
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
      },
    }),
  },
  backButtonDesktop: {
    top: 14,
    right: 16,
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  stepsIndicatorDesktop: {
    marginBottom: 8,
  },
  avatarWrapDesktop: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarBadgeDesktop: {
    width: 26,
    height: 26,
    borderRadius: 13,
    bottom: 0,
    right: 0,
  },
  avatarHintDesktop: {
    marginTop: 6,
    fontSize: 12,
  },
  stepsIndicator: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 14,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  stepDotDone: {
    backgroundColor: "rgba(255,255,255,0.7)",
  },
  stepDotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFFFFF",
  },
  avatarSection: {
    alignItems: "center",
  },
  avatarWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#fff",
    padding: 4,
    ...Platform.select({
      web: { boxShadow: "0px 6px 12px rgba(0,0,0,0.15)" } as any,
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
    borderRadius: 999,
  },
  avatarPlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    backgroundColor: "#ECECF1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarOverlay: {
    ...(StyleSheet.absoluteFill as any),
    borderRadius: 999,
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
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignSelf: "center",
    width: "100%",
    maxWidth: 800,
  },
  bodyContentDesktop: {
    paddingTop: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(0,0,0,0.06)" } as any,
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#6B6B76",
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
  placeholderText: {
    color: "#aaa",
  },
  fieldError: {
    fontSize: 12,
    color: "#B00020",
    marginLeft: 36,
    marginBottom: 6,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: "#EFEFF4",
    marginLeft: 36,
  },
  fieldRowVertical: {
    paddingVertical: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  saveButton: {
    backgroundColor: PURPLE_ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: "0px 5px 10px rgba(91,92,156,0.3)" } as any,
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
    opacity: 0.55,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "90%",
    maxWidth: 380,
    maxHeight: "85%",
    backgroundColor: "#fff",
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 20,
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
    marginBottom: 16,
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9FB",
    gap: 10,
  },
  modalOptionSelected: {
    borderColor: PURPLE,
    backgroundColor: "#F3ECFA",
  },
  modalOptionText: {
    fontSize: 14.5,
    fontWeight: "600",
    color: "#444",
  },
  modalOptionTextSelected: {
    color: PURPLE,
    fontWeight: "800",
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
  alertWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 2000,
    paddingHorizontal: 16,
  },
  alertBox: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: "900",
  },
  alertMessage: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  alertCloseBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  alertCloseText: {
    fontSize: 18,
    fontWeight: "900",
  },
  alertSuccess: {
    backgroundColor: "#d4edda",
    borderColor: "#c3e6cb",
  },
  alertDanger: {
    backgroundColor: "#f8d7da",
    borderColor: "#f5c6cb",
  },
  alertWarning: {
    backgroundColor: "#fff3cd",
    borderColor: "#ffeeba",
  },
});
