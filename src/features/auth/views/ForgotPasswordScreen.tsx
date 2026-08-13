import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../../core/navigation/types';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useForgotPasswordController } from '../controllers/useForgotPasswordController';
import { supabase } from '../../../services/supabase';

const PURPLE = '#5A2D82';
const PURPLE_LIGHT = '#816ab4';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const vm = useForgotPasswordController();

  const codeInputRef = useRef<TextInput>(null);
  const [codeFocused, setCodeFocused] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const showStrength = vm.newPasswordFocus && vm.newPassword.length > 0;
  const showMatchStatus = vm.confirmPassword.length > 0;

  const handleFinishAndLogin = async () => {
    if (leaving) return;
    setLeaving(true);
    try {
      await supabase.auth.signOut();
    } catch {}
    navigation.navigate('Login');
  };

  // ─── Step Indicator ───
  const stepIndex = vm.step === 'email' ? 0 : vm.step === 'code' ? 1 : 2;
  const stepLabels = ['Correo', 'Código', 'Clave'];

  const renderStepIndicator = () => (
    <View style={styles.stepsRow}>
      {stepLabels.map((label, i) => {
        const isActive = i === stepIndex;
        const isDone = i < stepIndex;
        return (
          <View key={label} style={styles.stepItem}>
            <View
              style={[
                styles.stepDot,
                isDone && styles.stepDotDone,
                isActive && styles.stepDotActive,
              ]}
            >
              {isDone ? (
                <MaterialCommunityIcons name="check" size={14} color="white" />
              ) : (
                <Text
                  style={[
                    styles.stepDotText,
                    isActive && styles.stepDotTextActive,
                  ]}
                >
                  {i + 1}
                </Text>
              )}
            </View>
            <Text
              style={[
                styles.stepLabel,
                (isActive || isDone) && styles.stepLabelActive,
              ]}
            >
              {label}
            </Text>
          </View>
        );
      })}
    </View>
  );

  // ─── Step 1: Email ───
  const renderEmailStep = () => (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="email-lock-outline" size={40} color={PURPLE} />
      </View>

      <Text style={styles.cardTitle}>Buscar mi cuenta</Text>
      <Text style={styles.cardDesc}>
        Ingresá el correo electrónico asociado a tu cuenta y te enviaremos un código de verificación.
      </Text>

      <Text style={styles.label}>Correo electrónico</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="email-outline" size={20} color={PURPLE} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="tu@correo.com"
          placeholderTextColor="#aaa"
          value={vm.email}
          onChangeText={vm.setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!vm.loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.actionButton, vm.loading && styles.actionButtonDisabled]}
        onPress={vm.handleSendCode}
        disabled={vm.loading}
        activeOpacity={0.85}
      >
        {vm.loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.actionButtonText}>Enviar código de verificación</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ─── Step 2: OTP Code with Individual Boxes ───
  const renderCodeStep = () => {
    const codeDigits = vm.code.split('');
    const firstGroup = [0, 1, 2, 3];
    const secondGroup = [4, 5, 6, 7];

    const renderBox = (index: number) => {
      const digit = codeDigits[index] || '';
      const isCurrent = codeFocused && (index === codeDigits.length || (index === 7 && codeDigits.length === 8));
      const isFilled = digit.length > 0;

      return (
        <View
          key={index}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isCurrent && styles.otpBoxActive,
          ]}
        >
          <Text style={[styles.otpDigit, isFilled && styles.otpDigitFilled]}>
            {digit}
          </Text>
        </View>
      );
    };

    return (
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="shield-key-outline" size={40} color={PURPLE} />
        </View>

        <Text style={styles.cardTitle}>Verificar código</Text>
        <Text style={styles.cardDesc}>
          Enviamos un código de 8 dígitos a{'\n'}
          <Text style={styles.emailHighlight}>{vm.maskedEmail}</Text>
        </Text>

        <View style={styles.codeLabelRow}>
          <Text style={styles.label}>Código de 8 dígitos</Text>
          {vm.code.length > 0 && (
            <TouchableOpacity onPress={vm.clearCode} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.clearCodeText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 8 OTP Boxes Container with Direct Tap-to-Edit */}
        <View style={styles.otpWrapper}>
          <View pointerEvents="none" style={styles.otpContainer}>
            <View style={styles.otpGroup}>
              {firstGroup.map(renderBox)}
            </View>
            <View style={styles.otpDivider}>
              <Text style={styles.otpDividerText}>-</Text>
            </View>
            <View style={styles.otpGroup}>
              {secondGroup.map(renderBox)}
            </View>
          </View>

          {/* Full-width transparent TextInput overlaid directly on top */}
          <TextInput
            ref={codeInputRef}
            style={styles.hiddenInput}
            value={vm.code}
            onChangeText={(t) => {
              const clean = t.replace(/[^0-9]/g, '').slice(0, 8);
              vm.setCode(clean);
            }}
            keyboardType="number-pad"
            maxLength={8}
            onFocus={() => setCodeFocused(true)}
            onBlur={() => setCodeFocused(false)}
            autoFocus
            editable={!vm.loading}
            caretHidden
          />
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            (vm.loading || vm.code.trim().length !== 8) && styles.actionButtonDisabled,
          ]}
          onPress={vm.handleVerifyCode}
          disabled={vm.loading || vm.code.trim().length !== 8}
          activeOpacity={0.85}
        >
          {vm.loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.actionButtonText}>Verificar código</Text>
          )}
        </TouchableOpacity>

        {/* Resend / Change email */}
        <View style={styles.codeActionsRow}>
          <TouchableOpacity
            onPress={vm.handleResendCode}
            disabled={vm.resendCooldown > 0 || vm.loading}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.linkText,
                (vm.resendCooldown > 0 || vm.loading) && styles.linkTextDisabled,
              ]}
            >
              {vm.resendCooldown > 0
                ? `Reenviar en ${vm.resendCooldown}s`
                : '¿No lo recibiste? Reenviar'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={vm.goBackToEmail} activeOpacity={0.7}>
            <Text style={styles.linkText}>Cambiar correo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // ─── Step 3: New Password ───
  const renderPasswordStep = () => (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <MaterialCommunityIcons name="lock-reset" size={40} color={PURPLE} />
      </View>

      <Text style={styles.cardTitle}>Nueva contraseña</Text>
      <Text style={styles.cardDesc}>
        Creá una nueva contraseña segura para tu cuenta.
      </Text>

      {/* New Password */}
      <Text style={styles.label}>Nueva contraseña</Text>
      <View style={styles.inputContainer}>
        <MaterialCommunityIcons name="lock-outline" size={20} color={PURPLE} style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#aaa"
          secureTextEntry={!vm.showNewPassword}
          value={vm.newPassword}
          onChangeText={vm.setNewPassword}
          onFocus={() => vm.setNewPasswordFocus(true)}
          onBlur={() => vm.setNewPasswordFocus(false)}
          editable={!vm.loading}
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

      {/* Strength Bar */}
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

      {/* Confirm Password */}
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
          editable={!vm.loading}
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

      {/* Match indicator */}
      {showMatchStatus && (
        <View style={styles.matchStatusRow}>
          <MaterialCommunityIcons
            name={vm.passwordsMatch ? 'check-circle-outline' : 'alert-circle-outline'}
            size={16}
            color={vm.passwordsMatch ? '#16A34A' : '#DC2626'}
          />
          <Text style={[styles.matchStatusText, { color: vm.passwordsMatch ? '#16A34A' : '#DC2626' }]}>
            {vm.passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.actionButton,
          (!vm.canSubmitPassword || vm.loading) && styles.actionButtonDisabled,
        ]}
        onPress={vm.handleUpdatePassword}
        disabled={!vm.canSubmitPassword || vm.loading}
        activeOpacity={0.85}
      >
        {vm.loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.actionButtonText}>Actualizar contraseña</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  // ─── Handle back button logic ───
  const handleBack = () => {
    if (vm.step === 'code') {
      vm.goBackToEmail();
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.headerBanner}>
          <Text style={styles.headerTitle}>Recuperar cuenta</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}

          {vm.step === 'email' && renderEmailStep()}
          {vm.step === 'code' && renderCodeStep()}
          {vm.step === 'password' && renderPasswordStep()}
        </ScrollView>

        <FloatingBackButton onPress={handleBack} />

        {/* ─── Ventana Emergente Simple y Limpia ─── */}
        <Modal
          visible={vm.step === 'success'}
          transparent
          animationType="fade"
          onRequestClose={handleFinishAndLogin}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconCircle}>
                <MaterialCommunityIcons name="check-circle" size={54} color="#16A34A" />
              </View>

              <Text style={styles.modalTitle}>¡Contraseña actualizada!</Text>
              <Text style={styles.modalDesc}>
                Tu contraseña ha sido restablecida con éxito.
              </Text>

              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleFinishAndLogin}
                disabled={leaving}
                activeOpacity={0.85}
              >
                {leaving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.modalButtonText}>Iniciar Sesión</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    paddingBottom: 100,
  },

  // Step Indicator
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    marginBottom: 24,
    marginTop: 4,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: PURPLE,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90,45,130,0.35)' } as any,
      default: { elevation: 4, shadowColor: PURPLE, shadowOpacity: 0.35, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
    }),
  },
  stepDotDone: {
    backgroundColor: '#16A34A',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
  },
  stepDotTextActive: {
    color: 'white',
  },
  stepLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
  },
  stepLabelActive: {
    color: '#444',
    fontWeight: '700',
  },

  // Card
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' } as any,
      default: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
    }),
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F3EFFA',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 13.5,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 19,
  },
  emailHighlight: {
    fontWeight: '800',
    color: PURPLE_LIGHT,
  },

  // Form elements
  codeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
  },
  label: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#666',
    marginBottom: 8,
    marginTop: 4,
  },
  clearCodeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#DC2626',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9FB',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#ECECF1',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 13,
    fontSize: 15,
    color: '#222',
  },
  eyeBtn: {
    padding: 6,
  },

  // ─── OTP 8 Boxes Styles ───
  otpWrapper: {
    position: 'relative',
    marginBottom: 18,
    marginTop: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  otpDivider: {
    marginHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDividerText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#aaa',
  },
  otpBox: {
    width: 34,
    height: 46,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E2E8',
    backgroundColor: '#F9F9FB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: PURPLE_LIGHT,
    backgroundColor: '#FAF8FF',
  },
  otpBoxActive: {
    borderColor: PURPLE,
    backgroundColor: '#F3EFFA',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(90,45,130,0.25)' } as any,
      default: { elevation: 2, shadowColor: PURPLE, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    }),
  },
  otpDigit: {
    fontSize: 19,
    fontWeight: '800',
    color: '#666',
  },
  otpDigitFilled: {
    color: '#1a1a1a',
  },
  hiddenInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.01,
    fontSize: 1,
    color: 'transparent',
  },

  // Action Button
  actionButton: {
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(90,45,130,0.3)' } as any,
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
    fontSize: 15,
  },

  // Code actions
  codeActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '700',
    color: PURPLE_LIGHT,
  },
  linkTextDisabled: {
    color: '#aaa',
  },

  // Strength bar
  strengthWrap: {
    marginBottom: 14,
    marginTop: -8,
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

  // Match status
  matchStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
    marginTop: -8,
  },
  matchStatusText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ─── Modal Ventana Emergente Simple y Limpia ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 10px 25px rgba(0,0,0,0.2)' } as any,
      default: { elevation: 10, shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
    }),
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F8ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: PURPLE,
    width: '100%',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0px 4px 10px rgba(90,45,130,0.3)' } as any,
      ios: { shadowColor: PURPLE, shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 4 },
    }),
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '900',
    fontSize: 15,
  },
});
