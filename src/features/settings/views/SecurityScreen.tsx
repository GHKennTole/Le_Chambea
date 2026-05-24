import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useSecurityController } from '../controllers/useSecurityController';

const PURPLE = '#5A2D82';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const vm = useSecurityController();

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  const renderSetup = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Configurar Seguridad</Text>
      <Text style={styles.cardDesc}>Establece un PIN y una pregunta de seguridad para poder cambiar tu contraseña en el futuro.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nuevo PIN (min. 4 dígitos)"
        keyboardType="numeric"
        secureTextEntry
        value={vm.newPin}
        onChangeText={vm.setNewPin}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Pregunta secreta (ej. Color favorito)"
        value={vm.question}
        onChangeText={vm.setQuestion}
      />

      <TextInput
        style={styles.input}
        placeholder="Respuesta secreta"
        value={vm.answer}
        onChangeText={vm.setAnswer}
      />

      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={vm.setupSecurity}
        disabled={vm.saving}
      >
        {vm.saving ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Guardar</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderVerify = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Verificación de Seguridad</Text>
      <Text style={styles.cardDesc}>Para cambiar tu contraseña, ingresa tu PIN o responde a tu pregunta secreta.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Ingresa tu PIN"
        keyboardType="numeric"
        secureTextEntry
        value={vm.pin}
        onChangeText={vm.setPin}
      />
      
      <Text style={styles.orText}>- O -</Text>
      <Text style={styles.questionText}>Pregunta: {vm.dbQuestion}</Text>

      <TextInput
        style={styles.input}
        placeholder="Respuesta secreta"
        value={vm.answer}
        onChangeText={vm.setAnswer}
      />

      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={vm.verifySecurity}
        disabled={vm.saving}
      >
        {vm.saving ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Verificar</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderChangePassword = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cambiar Contraseña</Text>
      <Text style={styles.cardDesc}>Verificación exitosa. Ingresa tu nueva contraseña.</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Nueva contraseña (min. 6 caracteres)"
        secureTextEntry
        value={vm.newPassword}
        onChangeText={vm.setNewPassword}
      />
      
      <TouchableOpacity 
        style={styles.actionButton} 
        onPress={vm.changePassword}
        disabled={vm.saving}
      >
        {vm.saving ? <ActivityIndicator color="white" /> : <Text style={styles.actionButtonText}>Actualizar Contraseña</Text>}
      </TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Seguridad</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {vm.mode === 'SETUP' && renderSetup()}
          {vm.mode === 'VERIFY' && renderVerify()}
          {vm.mode === 'CHANGE_PASSWORD' && renderChangePassword()}
        </ScrollView>

        <FloatingBackButton />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F8' },
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  header: { height: 60, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  input: {
    backgroundColor: '#F6F6F8',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    fontSize: 16,
  },
  orText: { textAlign: 'center', color: '#999', marginVertical: 8, fontWeight: 'bold' },
  questionText: { fontSize: 15, color: '#444', fontWeight: '600', marginBottom: 12, textAlign: 'center' },
  actionButton: {
    backgroundColor: PURPLE,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
