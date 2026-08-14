import React from "react";
import {
  View,
  StyleSheet,
  Platform,
  Image,
  ScrollView,
  Text,
  Animated,
  TouchableOpacity,
} from "react-native";
import { TextInput, Button, Title } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FloatingBackButton from "../../../shared/components/FloatingBackButton";
import { useLoginController } from "../controllers/useLoginController";

type Nav = NativeStackNavigationProp<RootStackParamList, "Login">;

export default function LoginScreen() {
  const vm = useLoginController();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [showPassword, setShowPassword] = React.useState(false);

  const extraBottom = vm.keyboardOpen ? (Platform.OS === "ios" ? 260 : 220) : 40;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FloatingBackButton
        position="top-right"
        onPress={() => navigation.navigate("Welcome")}
        backgroundColor="#5b5c9c"
        iconColor="white"
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, extraBottom) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoSection}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.appTitle}>LE CHAMBEA</Text>
          </View>
        </View>

        <View style={styles.formCard}>
          <Title style={styles.title}>INICIAR SESIÓN</Title>

          <TextInput
            label="Correo"
            value={vm.email}
            onChangeText={vm.setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="email" />}
            outlineColor="#E0E0E0"
            activeOutlineColor="#816ab4"
            textColor="#1a1a1a"
            returnKeyType="next"
          />

          <TextInput
            label="Contraseña"
            value={vm.password}
            onChangeText={vm.setPassword}
            secureTextEntry={!showPassword}
            style={styles.input}
            mode="outlined"
            left={<TextInput.Icon icon="lock" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off" : "eye"}
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            outlineColor="#E0E0E0"
            activeOutlineColor="#816ab4"
            textColor="#1a1a1a"
            returnKeyType="done"
          />

          <Button
            mode="contained"
            onPress={vm.handleLogin}
            loading={vm.loading}
            style={styles.button}
            buttonColor="#816ab4"
            textColor="white"
            contentStyle={styles.buttonContent}
          >
            Iniciar Sesión
          </Button>

          <View style={styles.forgotPasswordContainer}>
            <Button
              onPress={() => navigation.navigate("ForgotPassword")}
              textColor="#666"
              style={styles.forgotPasswordButton}
              compact
            >
              ¿Olvidaste tu contraseña?
            </Button>
          </View>
        </View>

        <View style={styles.registerContainer}>
          <Text style={styles.registerText}>
            ¿No tienes cuenta?{" "}
            <Text
              style={styles.registerLink}
              onPress={() => navigation.navigate("Register")}
            >
              Regístrate aquí
            </Text>
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  logoSection: {
    backgroundColor: "#5b5c9c",
    height: 180,
    justifyContent: "center",
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 5,
    marginBottom: 20,
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 300,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 120,
    height: 120,
  },
  appTitle: {
    fontSize: 28,
    fontFamily: "SansitaBoldItalic",
    color: "#000000",
    letterSpacing: 1.0,
    transform: [{ skewX: "-5deg" }],
    textAlign: "center",
  },
  formCard: {
    backgroundColor: "#E0E0E0",
    borderRadius: 30,
    padding: 24,
    width: "90%",
    maxWidth: 480,
    alignSelf: "center",
    marginBottom: 20,
  },
  title: {
    textAlign: "center",
    marginBottom: 24,
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
    borderRadius: 300,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  forgotPasswordContainer: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordButton: {
    marginTop: 8,
    fontSize: 14,
  },
  registerContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  registerText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  registerLink: {
    color: "#007bffa1",
    fontWeight: "bold",
    textDecorationLine: "underline",
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
    color: "#333",
  },
  alertMessage: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    color: "#444",
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
    color: "#666",
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

