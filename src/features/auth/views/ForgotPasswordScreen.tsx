import React from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../../../core/navigation/types";
import { useForgotPasswordController } from "../controllers/useForgotPasswordController";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const vm = useForgotPasswordController();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Buscar mi cuenta</Text>

      <Text style={styles.subtitle}>
        Ingresa el correo asociado a tu cuenta y te enviaremos un enlace para restablecer tu contraseña.
      </Text>

      <TextInput
        placeholder="Correo electrónico"
        value={vm.email}
        onChangeText={vm.setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TouchableOpacity style={styles.button} onPress={() => vm.handleResetPassword(() => navigation.goBack())}>
        <Text style={styles.buttonText}>{vm.loading ? "Enviando..." : "Enviar enlace"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#6D28D9",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#6D28D9",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
