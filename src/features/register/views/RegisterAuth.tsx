import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Animated,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TextInput, Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";

import type { RootStackParamList, RegisterStackParamList } from "../../../core/navigation/types";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useRegisterController } from "../controllers/useRegisterController";
import type { RegisterSharedProps } from "../models/register.types";

type Props = NativeStackScreenProps<RegisterStackParamList, "RegisterAuth"> & RegisterSharedProps;

const TOTAL_STEPS = 4;
const CURRENT_STEP = 3;

export default function RegisterAuth({ navigation, formData, setFormData }: Props) {
  const insets = useSafeAreaInsets();
  const vm = useRegisterController();



  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [passwordFocus, setPasswordFocus] = React.useState(false);

  const showStrength = passwordFocus && String(vm.formData.password).length > 0;



  const alertTranslateY = vm.alertAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 0],
  });

  const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

  const handleRegisterPress = () => {
    vm.handleCreateAccount(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: "RegisterSuccess" }],
      });
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <FloatingBackButton
        position="top-right"
        backgroundColor="#5b5c9c"
        iconColor="white"
        onPress={() => navigation.goBack()}
      />

      {vm.alertBox.visible && (
        <Animated.View
          style={[
            styles.alertWrap,
            {
              top: insets.top + 70,
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

      <View style={[styles.dotsHeader, { top: insets.top + 18 }]}>
        <View style={styles.dotsRow}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i < CURRENT_STEP && styles.dotDone,
                i === CURRENT_STEP && styles.dotActive,
              ]}
            />
          ))}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Agrega un correo electrónico</Text>

        <Text style={styles.subtitle}>
          Agrega un correo electrónico y una contraseña con los cuales podrás
          iniciar sesión más adelante.
        </Text>

        <View style={styles.form}>
          <TextInput
            label="Correo electrónico"
            value={vm.formData.correo}
            onChangeText={(t) => {
              vm.setFormData((prev) => ({ ...prev, correo: t }));
              setFormData((prev) => ({ ...prev, correo: t }));
            }}
            mode="outlined"
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            left={<TextInput.Icon icon="email" />}
            activeOutlineColor="#816ab4"
          />

          <TextInput
            label="Contraseña"
            value={vm.formData.password}
            onChangeText={(t) => {
              vm.setFormData((prev) => ({ ...prev, password: t }));
              setFormData((prev) => ({ ...prev, password: t }));
            }}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showPassword}
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            activeOutlineColor="#816ab4"
            onFocus={() => setPasswordFocus(true)}
            onBlur={() => setPasswordFocus(false)}
          />

          {showStrength && (
            <View style={styles.strengthWrapCompact}>
              <View style={styles.strengthRowCompact}>
                <Text style={styles.strengthLabel}>Seguridad:</Text>
                <Text
                  style={[
                    styles.strengthText,
                    vm.strength.type === "danger" && styles.strengthDangerText,
                    vm.strength.type === "warning" && styles.strengthWarningText,
                    vm.strength.type === "success" && styles.strengthSuccessText,
                  ]}
                >
                  {vm.strength.label}
                </Text>
              </View>

              <View style={styles.strengthBarBgCompact}>
                <View
                  style={[
                    styles.strengthBarFillCompact,
                    { width: `${vm.strength.pct}%` },
                    vm.strength.type === "danger" && styles.strengthDangerFill,
                    vm.strength.type === "warning" && styles.strengthWarningFill,
                    vm.strength.type === "success" && styles.strengthSuccessFill,
                  ]}
                />
              </View>

              <Text style={styles.strengthHintCompact}>
                Mínimo 6 caracteres. Mejor si agregas números, mayúsculas y símbolos.
              </Text>
            </View>
          )}

          <TextInput
            label="Confirmar contraseña"
            value={vm.formData.confirmPassword}
            onChangeText={(t) => {
              vm.setFormData((prev) => ({ ...prev, confirmPassword: t }));
              setFormData((prev) => ({ ...prev, confirmPassword: t }));
            }}
            mode="outlined"
            style={styles.input}
            secureTextEntry={!showConfirm}
            left={<TextInput.Icon icon="lock-check" />}
            right={
              <TextInput.Icon
                icon={showConfirm ? "eye-off" : "eye"}
                onPress={() => setShowConfirm(!showConfirm)}
              />
            }
            activeOutlineColor="#816ab4"
          />

          {!!vm.helperText && <Text style={styles.helperText}>{vm.helperText}</Text>}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              (!vm.canContinue || vm.loading) && styles.primaryButtonDisabled,
            ]}
            disabled={!vm.canContinue || vm.loading}
            onPress={handleRegisterPress}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryButtonText}>
              {vm.loading ? "Creando..." : "Crear cuenta"}
            </Text>
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>o</Text>
            <View style={styles.separatorLine} />
          </View>

          <Button
            mode="outlined"
            onPress={() => {
              vm.setGoogleLoading(true);
              setTimeout(() => vm.setGoogleLoading(false), 1000);
            }}
            loading={vm.googleLoading}
            style={styles.googleButton}
            textColor="#666"
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.googleText}>Registrate con google</Text>
              <Image
                source={require("../../../assets/images/google.png")}
                style={styles.googleG}
              />
            </View>
          </Button>
        </View>
      </ScrollView>

      <View
        style={[styles.footerFixed, { paddingBottom: Math.max(insets.bottom, 14) }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => rootNav?.navigate("ForgotPassword")}
          style={styles.searchBtn}
          hitSlop={{ top: 10, bottom: 10, left: 20, right: 20 }}
        >
          <Text style={styles.searchAccountText}>Buscar mi cuenta</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  dotsHeader: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
    padding: 10,
    borderRadius: 999,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#c7b3f0",
  },
  dotDone: { backgroundColor: "#816ab4", opacity: 0.8 },
  dotActive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#816ab4",
  },

  contenido: {
    paddingTop: 100,
    paddingBottom: 170,
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#555",
    marginBottom: 18,
  },

  form: {
    maxWidth: 360,
    alignSelf: "center",
    width: "100%",
  },

  input: {
    marginBottom: 14,
    backgroundColor: "#fff",
  },

  helperText: {
    marginTop: -6,
    marginBottom: 8,
    fontSize: 12,
    color: "#8a8a8a",
    fontWeight: "700",
    textAlign: "center",
    lineHeight: 16,
  },

  primaryButton: {
    backgroundColor: "#816ab4",
    borderRadius: 300,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 6,
  },
  primaryButtonDisabled: { opacity: 0.5 },

  primaryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },

  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  separatorLine: { flex: 1, height: 1, backgroundColor: "#ccc" },
  separatorText: { marginHorizontal: 12, color: "#666" },

  googleButton: {
    borderRadius: 300,
    borderColor: "#ccc",
  },
  googleText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  googleG: {
    width: 24,
    height: 24,
    marginLeft: 6,
  },

  strengthWrapCompact: {
    marginTop: -6,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  strengthRowCompact: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  strengthLabel: { color: "#555", fontSize: 12, fontWeight: "700" },
  strengthText: { fontSize: 12, fontWeight: "800" },

  strengthBarBgCompact: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#eee",
    overflow: "hidden",
  },
  strengthBarFillCompact: {
    height: 6,
    borderRadius: 999,
  },
  strengthDangerFill: { backgroundColor: "#dc3545" },
  strengthWarningFill: { backgroundColor: "#ffc107" },
  strengthSuccessFill: { backgroundColor: "#28a745" },

  strengthDangerText: { color: "#dc3545" },
  strengthWarningText: { color: "#c49000" },
  strengthSuccessText: { color: "#28a745" },

  strengthHintCompact: {
    marginTop: 6,
    fontSize: 11,
    color: "#777",
    fontWeight: "600",
    lineHeight: 15,
    textAlign: "center",
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

  footerFixed: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  searchBtn: {
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 10,
  },
  searchAccountText: {
    color: "#6D28D9",
    fontSize: 15,
    fontWeight: "800",
    textDecorationLine: "underline",
  },
});
