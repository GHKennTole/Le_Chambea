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
  Modal,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useProfileController } from "../controllers/useProfileController";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const PURPLE_ACCENT = "#5A2D82";
const PURPLE_LIGHT = "#F3ECFA";

const GENDER_OPTIONS = [
  { key: "mujer", label: "Mujer" },
  { key: "hombre", label: "Hombre" },
  { key: "no_especificar", label: "Otro" },
];

function getGenderLabel(val?: string) {
  if (!val) return "Otro";
  const lower = val.toLowerCase();
  if (lower === "mujer") return "Mujer";
  if (lower === "hombre") return "Hombre";
  if (lower === "no_especificar" || lower === "otro") return "Otro";
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

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const vm = useProfileController();
  const { isLargeScreen } = useResponsive();

  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [showGenderPicker, setShowGenderPicker] = React.useState(false);
  const [showLocationPicker, setShowLocationPicker] = React.useState(false);
  const [selectedDepartment, setSelectedDepartment] = React.useState<string | null>(null);

  const parsedDate = React.useMemo(() => {
    const iso = String(vm.profile.fecha_nacimiento || "");
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (m) {
      return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
    }
    return { year: 2000, month: 1, day: 1 };
  }, [vm.profile.fecha_nacimiento]);

  const [tempDay, setTempDay] = React.useState(parsedDate.day);
  const [tempMonth, setTempMonth] = React.useState(parsedDate.month);
  const [tempYear, setTempYear] = React.useState(parsedDate.year);

  React.useEffect(() => {
    setTempDay(parsedDate.day);
    setTempMonth(parsedDate.month);
    setTempYear(parsedDate.year);
  }, [parsedDate]);

  const handleConfirmDate = () => {
    const mm = String(tempMonth).padStart(2, "0");
    const dd = String(tempDay).padStart(2, "0");
    vm.updateField("fecha_nacimiento", `${tempYear}-${mm}-${dd}`);
    setShowDatePicker(false);
  };

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
      <View style={styles.container}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Morado Dinámico */}
          <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 16 }]}>
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
          </View>

          <View style={styles.bodyContent}>
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

            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => {
                setSelectedDepartment(null);
                setShowLocationPicker(true);
              }}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="map-marker-outline" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Ubicación</Text>
                <Text style={[styles.input, !vm.profile.ciudad && styles.placeholderText]}>
                  {vm.profile.ciudad || "Seleccionar ubicación"}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="cake-variant" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Fecha de nacimiento</Text>
                <Text style={[styles.input, !vm.profile.fecha_nacimiento && styles.placeholderText]}>
                  {vm.profile.fecha_nacimiento || "Seleccionar fecha"}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.fieldRow}
              onPress={() => setShowGenderPicker(true)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="gender-transgender" size={20} color={PURPLE} style={styles.fieldIcon} />
              <View style={styles.fieldInput}>
                <Text style={styles.label}>Género</Text>
                <Text style={styles.input}>
                  {getGenderLabel(vm.profile.genero)}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={22} color="#888" />
            </TouchableOpacity>
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
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>

        <FloatingBackButton hideOnMobile />

        {/* Modal Selección Fecha de Nacimiento */}
        <Modal
          visible={showDatePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowDatePicker(false)}>
            <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
              <Text style={styles.modalTitle}>Fecha de Nacimiento</Text>
              <Text style={styles.modalSubtitle}>Seleccioná tu día, mes y año</Text>

              <View style={styles.pickerRow}>
                {/* Selector Día */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Día</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[styles.pickerItem, tempDay === d && styles.pickerItemSelected]}
                        onPress={() => setTempDay(d)}
                      >
                        <Text style={[styles.pickerItemText, tempDay === d && styles.pickerItemTextSelected]}>
                          {d}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Selector Mes */}
                <View style={[styles.pickerCol, { flex: 1.5 }]}>
                  <Text style={styles.pickerLabel}>Mes</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {[
                      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
                      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
                    ].map((m, idx) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.pickerItem, tempMonth === idx + 1 && styles.pickerItemSelected]}
                        onPress={() => setTempMonth(idx + 1)}
                      >
                        <Text style={[styles.pickerItemText, tempMonth === idx + 1 && styles.pickerItemTextSelected]}>
                          {m}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Selector Año */}
                <View style={styles.pickerCol}>
                  <Text style={styles.pickerLabel}>Año</Text>
                  <ScrollView style={styles.pickerScroll} showsVerticalScrollIndicator={false}>
                    {Array.from({ length: 90 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                      <TouchableOpacity
                        key={y}
                        style={[styles.pickerItem, tempYear === y && styles.pickerItemSelected]}
                        onPress={() => setTempYear(y)}
                      >
                        <Text style={[styles.pickerItemText, tempYear === y && styles.pickerItemTextSelected]}>
                          {y}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <TouchableOpacity style={styles.modalConfirmBtn} onPress={handleConfirmDate} activeOpacity={0.85}>
                <Text style={styles.modalConfirmText}>Confirmar Fecha</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

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
              <Text style={styles.modalSubtitle}>¿Con qué género te identificas?</Text>

              <View style={{ width: "100%", gap: 10, marginTop: 8, marginBottom: 12 }}>
                {GENDER_OPTIONS.map((opt) => {
                  const currentGen = String(vm.profile.genero || "no_especificar").toLowerCase();
                  const isSelected = currentGen === opt.key || currentGen === opt.label.toLowerCase();

                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.genderModalOption, isSelected && styles.genderModalOptionSelected]}
                      onPress={() => {
                        vm.updateField("genero", opt.key);
                        setShowGenderPicker(false);
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
            </Pressable>
          </Pressable>
        </Modal>

        {/* Modal Selección de Ubicación (Departamento y Municipio de Nicaragua) */}
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
                        const isCurrentDept = vm.profile.ciudad?.includes(dept);

                        return (
                          <TouchableOpacity
                            key={dept}
                            style={[
                              styles.genderModalOption,
                              isCurrentDept && styles.genderModalOptionSelected,
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
                                styles.genderModalOptionText,
                                { flex: 1 },
                                isCurrentDept && styles.genderModalOptionTextSelected,
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
                        const isSelected = vm.profile.ciudad === locationString;

                        return (
                          <TouchableOpacity
                            key={muni}
                            style={[
                              styles.genderModalOption,
                              isSelected && styles.genderModalOptionSelected,
                            ]}
                            onPress={() => {
                              vm.updateField("ciudad", locationString);
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
                                styles.genderModalOptionText,
                                isSelected && styles.genderModalOptionTextSelected,
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
    paddingBottom: 16,
    width: "100%",
  },
  scroll: { flex: 1 },
  scrollContent: {
    alignSelf: 'center',
    width: '100%',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
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
    backgroundColor: PURPLE_ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    marginTop: 24,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      web: { boxShadow: '0px 5px 10px rgba(91,92,156,0.3)' } as any,
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
  placeholderText: {
    color: "#aaa",
  },
  fieldRowVertical: {
    paddingVertical: 10,
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  genderChipContainer: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 36,
  },
  genderChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    backgroundColor: "#F9F9FB",
    gap: 6,
  },
  genderChipSelected: {
    borderColor: PURPLE,
    backgroundColor: "#F3ECFA",
  },
  genderChipText: {
    fontSize: 13.5,
    fontWeight: "600",
    color: "#555",
  },
  genderChipTextSelected: {
    color: PURPLE,
    fontWeight: "800",
  },
  radioOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#A0A0A0",
    justifyContent: "center",
    alignItems: "center",
  },
  radioOuterSelected: {
    borderColor: PURPLE,
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: PURPLE,
  },

  // Modal Styles
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
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: "row",
    height: 180,
    gap: 8,
    marginBottom: 20,
  },
  pickerCol: {
    flex: 1,
    alignItems: "center",
  },
  pickerLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888",
    marginBottom: 6,
  },
  pickerScroll: {
    width: "100%",
    backgroundColor: "#F6F6F8",
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  pickerItem: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 2,
  },
  pickerItemSelected: {
    backgroundColor: PURPLE,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  pickerItemTextSelected: {
    color: "#fff",
    fontWeight: "800",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#333",
  },
  genderModalOptionTextSelected: {
    color: PURPLE,
    fontWeight: "900",
  },
});
