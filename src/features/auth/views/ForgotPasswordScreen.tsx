import React, { useRef, useState, useEffect, useMemo } from 'react';
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
import { useResponsive } from '../../../shared/hooks/useResponsive';

const PURPLE = '#5A2D82';
const PURPLE_LIGHT = '#816ab4';

type Props = NativeStackScreenProps<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const vm = useForgotPasswordController();
  const { isLargeScreen } = useResponsive();

  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);

  // Array de 8 dígitos derivado de vm.code
  const codeDigits = useMemo(() => {
    const arr = Array(8).fill('');
    for (let i = 0; i < vm.code.length && i < 8; i++) {
      arr[i] = vm.code[i];
    }
    return arr;
  }, [vm.code]);

  // Auto-enfocar el primer cuadro vacío al llegar al paso del código
  useEffect(() => {
    if (vm.step === 'code') {
      const timer = setTimeout(() => {
        const firstEmpty = codeDigits.findIndex((d) => !d);
        const targetIndex = firstEmpty !== -1 ? firstEmpty : 0;
        inputRefs.current[targetIndex]?.focus();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [vm.step]);

  const handleDigitChange = (text: string, index: number) => {
    const clean = text.replace(/[^0-9]/g, '');
    const newDigits = [...codeDigits];

    if (!clean) {
      newDigits[index] = '';
      vm.setCode(newDigits.join(''));
      return;
    }

    // Reemplaza directamente el dígito actual con el nuevo número ingresado
    const char = clean.slice(-1);
    newDigits[index] = char;
    vm.setCode(newDigits.join(''));

    // Avanza al siguiente cuadro si no es el último
    if (index < 7) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!codeDigits[index] && index > 0) {
        const newDigits = [...codeDigits];
        newDigits[index - 1] = '';
        vm.setCode(newDigits.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

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
        <MaterialCommunityIcons
          name="email-outline"
          size={20}
          color={PURPLE}
          style={styles.inputIcon}
        />
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
          returnKeyType="search"
          onSubmitEditing={vm.handleSendCode}
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
    const firstGroup = [0, 1, 2, 3];
    const secondGroup = [4, 5, 6, 7];

    const renderBox = (index: number) => {
      const digit = codeDigits[index] || '';
      const isFocused = focusedIndex === index;
      const isFilled = digit.length > 0;

      return (
        <TextInput
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          style={[
            styles.otpBox,
            isFilled && styles.otpBoxFilled,
            isFocused && styles.otpBoxActive,
            isLargeScreen && styles.otpBoxDesktop,
          ]}
          value={digit}
          onChangeText={(val) => handleDigitChange(val, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => setFocusedIndex(index)}
          onBlur={() => setFocusedIndex((prev) => (prev === index ? null : prev))}
          keyboardType="number-pad"
          maxLength={2}
          selectTextOnFocus
          contextMenuHidden
          textAlign="center"
          editable={!vm.loading}
        />
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

        <View style={[styles.codeLabelRow, isLargeScreen && styles.codeLabelRowDesktop]}>
          <Text style={styles.label}>Código de 8 dígitos</Text>
          {vm.code.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                vm.clearCode();
                inputRefs.current[0]?.focus();
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.clearCodeText}>Limpiar</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* 8 OTP Boxes Container with Direct Tap-to-Edit */}
        <View style={styles.otpWrapper}>
          <View style={[styles.otpContainer, isLargeScreen && styles.otpContainerDesktop]}>
            <View style={styles.otpGroup}>
              {firstGroup.map(renderBox)}
            </View>
            <View style={[styles.otpDivider, isLargeScreen && styles.otpDividerDesktop]}>
              <Text style={[styles.otpDividerText, isLargeScreen && styles.otpDividerTextDesktop]}>-</Text>
            </View>
            <View style={styles.otpGroup}>
              {secondGroup.map(renderBox)}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.actionButton,
            (vm.loading || vm.code.trim().length !== 8) && styles.actionButtonDisabled,
            isLargeScreen && styles.actionButtonDesktop,
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
        <View style={[styles.codeActionsRow, isLargeScreen && styles.codeActionsRowDesktop]}>
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
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Login');
      }
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={isLargeScreen ? styles.headerDesktopContainer : undefined}>
          <View style={[styles.headerBanner, isLargeScreen && styles.headerBannerDesktop]}>
            <Text style={styles.headerTitle}>Recuperar cuenta</Text>
            <FloatingBackButton
              onPress={handleBack}
              backgroundColor="#816ab4"
              iconColor="white"
              iconSize={isLargeScreen ? 20 : 24}
              style={isLargeScreen ? styles.backButtonDesktop : { top: 10, right: 16 }}
            />
          </View>
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, isLargeScreen && styles.contentDesktop]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepIndicator()}

          {vm.step === 'email' && renderEmailStep()}
          {vm.step === 'code' && renderCodeStep()}
          {vm.step === 'password' && renderPasswordStep()}
        </ScrollView>

        {/* ─── Ventana Emergente Simple y Limpia (Éxito) ─── */}
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
    position: 'relative',
  },
  headerDesktopContainer: {
    width: '100%',
    maxWidth: 800,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 20,
  },
  headerBannerDesktop: {
    height: 64,
    borderRadius: 22,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderBottomLeftRadius: 22,
    borderBottomRightRadius: 22,
    ...Platform.select({
      web: {
        boxShadow: '0px 6px 20px rgba(90, 45, 130, 0.2)',
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
    top: 11,
    right: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  contentDesktop: {
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
    paddingTop: 16,
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
    paddingHorizontal: 16,
    paddingVertical: 24,
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
    marginBottom: 20,
    marginTop: 6,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  otpGroup: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  otpContainerDesktop: {
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  otpDividerDesktop: {
    paddingHorizontal: 8,
  },
  otpDividerTextDesktop: {
    fontSize: 20,
    fontWeight: '800',
    color: '#888',
  },
  otpBoxDesktop: {
    maxWidth: 46,
    height: 54,
    borderRadius: 12,
    fontSize: 22,
    fontWeight: '800',
  },
  codeLabelRowDesktop: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  actionButtonDesktop: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  codeActionsRowDesktop: {
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  otpDivider: {
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpDividerText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#aaa',
  },
  otpBox: {
    flex: 1,
    maxWidth: 36,
    height: 48,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E2E8',
    backgroundColor: '#F9F9FB',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: '#1a1a1a',
    padding: 0,
    margin: 0,
  },
  otpBoxFilled: {
    borderColor: PURPLE_LIGHT,
    backgroundColor: '#FAF8FF',
  },
  otpBoxActive: {
    borderColor: PURPLE,
    backgroundColor: '#F3EFFA',
    borderWidth: 2,
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(90,45,130,0.25)' } as any,
      default: { elevation: 2, shadowColor: PURPLE, shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } },
    }),
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
