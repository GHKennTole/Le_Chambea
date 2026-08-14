import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useSecurityController } from '../controllers/useSecurityController';

const PURPLE = '#5A2D82';
const PURPLE_ACCENT = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';

export default function SecurityScreen() {
  const insets = useSafeAreaInsets();
  const vm = useSecurityController();

  const showStrength = vm.newPasswordFocus && vm.newPassword.length > 0;
  const showMatchStatus = vm.confirmPassword.length > 0;
  const passwordsMatch = vm.newPassword.length > 0 && vm.newPassword === vm.confirmPassword;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>Cambiar Contraseña</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Actualizar tu contraseña</Text>
            <Text style={styles.cardDesc}>
              Ingresá tu contraseña actual y luego la nueva contraseña para actualizarla.
            </Text>

            {/* Contraseña Actual */}
            <Text style={styles.label}>Contraseña actual</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-outline" size={20} color={PURPLE} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Escribí tu contraseña actual"
                placeholderTextColor="#aaa"
                secureTextEntry={!vm.showCurrentPassword}
                value={vm.currentPassword}
                onChangeText={vm.setCurrentPassword}
              />
              <TouchableOpacity
                onPress={() => vm.setShowCurrentPassword(!vm.showCurrentPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={vm.showCurrentPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Nueva Contraseña */}
            <Text style={styles.label}>Nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-reset" size={20} color={PURPLE} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor="#aaa"
                secureTextEntry={!vm.showNewPassword}
                value={vm.newPassword}
                onChangeText={vm.setNewPassword}
                onFocus={() => vm.setNewPasswordFocus(true)}
                onBlur={() => vm.setNewPasswordFocus(false)}
              />
              <TouchableOpacity
                onPress={() => vm.setShowNewPassword(!vm.showNewPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={vm.showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Advertencia si la contraseña nueva es igual a la actual */}
            {vm.currentPassword.length > 0 && vm.newPassword.length > 0 && vm.currentPassword === vm.newPassword && (
              <View style={styles.matchStatusRow}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
                <Text style={[styles.matchStatusText, { color: "#DC2626" }]}>
                  La nueva contraseña debe ser diferente a la actual.
                </Text>
              </View>
            )}

            {/* Barra de Fuerza de Contraseña (Idéntica al Registro) */}
            {showStrength && (
              <View style={styles.strengthWrap}>
                <View style={styles.strengthRow}>
                  <Text style={styles.strengthTitle}>Seguridad de clave:</Text>
                  <Text
                    style={[
                      styles.strengthLabel,
                      vm.strength.type === 'danger' && styles.strengthDangerText,
                      vm.strength.type === 'warning' && styles.strengthWarningText,
                      vm.strength.type === 'success' && styles.strengthSuccessText,
                    ]}
                  >
                    {vm.strength.label}
                  </Text>
                </View>
                <View style={styles.strengthBarBg}>
                  <View
                    style={[
                      styles.strengthBarFill,
                      { width: `${vm.strength.pct}%` },
                      vm.strength.type === 'danger' && styles.strengthDangerFill,
                      vm.strength.type === 'warning' && styles.strengthWarningFill,
                      vm.strength.type === 'success' && styles.strengthSuccessFill,
                    ]}
                  />
                </View>
              </View>
            )}

            {/* Confirmar Nueva Contraseña */}
            <Text style={styles.label}>Confirmar nueva contraseña</Text>
            <View style={styles.inputContainer}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color={PURPLE} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Repetí la nueva contraseña"
                placeholderTextColor="#aaa"
                secureTextEntry={!vm.showConfirmPassword}
                value={vm.confirmPassword}
                onChangeText={vm.setConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => vm.setShowConfirmPassword(!vm.showConfirmPassword)}
                style={styles.eyeBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={vm.showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            {/* Indicador de Coincidencia de Contraseñas */}
            {showMatchStatus && (
              <View style={styles.matchStatusRow}>
                <MaterialCommunityIcons
                  name={passwordsMatch ? 'check-circle-outline' : 'alert-circle-outline'}
                  size={16}
                  color={passwordsMatch ? '#16A34A' : '#DC2626'}
                />
                <Text style={[styles.matchStatusText, { color: passwordsMatch ? '#16A34A' : '#DC2626' }]}>
                  {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                (!vm.canSubmit || vm.saving) && styles.actionButtonDisabled,
              ]}
              onPress={vm.changePassword}
              disabled={vm.saving}
              activeOpacity={0.85}
            >
              {vm.saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.actionButtonText}>Guardar contraseña</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        <FloatingBackButton />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  headerBanner: {
    height: 70,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 20,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' } as any,
      default: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
    }),
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 13.5,
    color: '#666',
    marginBottom: 20,
    lineHeight: 19,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECF1',
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: '#222',
  },
  eyeBtn: {
    padding: 6,
  },

  // Strength Bar Styles
  strengthWrap: {
    marginBottom: 14,
    marginTop: -4,
  },
  strengthRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  strengthTitle: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '800',
  },
  strengthDangerText: { color: '#DC2626' },
  strengthWarningText: { color: '#D97706' },
  strengthSuccessText: { color: '#16A34A' },
  strengthBarBg: {
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  strengthBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  strengthDangerFill: { backgroundColor: '#DC2626' },
  strengthWarningFill: { backgroundColor: '#D97706' },
  strengthSuccessFill: { backgroundColor: '#16A34A' },

  // Match Status Styles
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    marginTop: -4,
  },
  matchStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  actionButton: {
    backgroundColor: PURPLE_ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(91,92,156,0.3)' } as any,
      ios: { shadowColor: PURPLE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 5 },
    }),
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 16,
  },
});
