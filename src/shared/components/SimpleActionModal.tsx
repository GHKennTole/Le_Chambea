import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export interface SimpleActionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  subtitle?: string;
  badgeText?: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: "danger" | "primary" | "success";
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
  confirmIcon?: keyof typeof MaterialCommunityIcons.glyphMap;
  loading?: boolean;
}

const PURPLE = "#5A2D82";

export default function SimpleActionModal({
  visible,
  onClose,
  onConfirm,
  title,
  subtitle,
  badgeText,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  confirmType = "primary",
  iconName,
  confirmIcon,
  loading = false,
}: SimpleActionModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const isBusy = loading || internalLoading;

  useEffect(() => {
    if (visible) {
      setInternalLoading(false);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: Platform.OS !== "web",
      }).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  const handleConfirm = async () => {
    if (isBusy) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (e) {
      console.error("Error en SimpleActionModal confirm:", e);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  if (!visible) return null;

  // Determinar colores según tipo
  const isDanger = confirmType === "danger";
  const isSuccess = confirmType === "success";

  let ringBg = "#F5F3FF";
  let ringBorder = "#EDE9FE";
  let iconColor = PURPLE;
  let confirmBg = PURPLE;
  let defaultIcon: keyof typeof MaterialCommunityIcons.glyphMap = "information-outline";

  if (isDanger) {
    ringBg = "#FEF2F2";
    ringBorder = "#FEE2E2";
    iconColor = "#DC2626";
    confirmBg = "#DC2626";
    defaultIcon = "alert-circle-outline";
  } else if (isSuccess) {
    ringBg = "#F0FDF4";
    ringBorder = "#DCFCE7";
    iconColor = "#16A34A";
    confirmBg = "#16A34A";
    defaultIcon = "check-circle-outline";
  }

  const finalIcon = iconName || defaultIcon;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop táctil para cerrar */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          disabled={isBusy}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>

        {/* Tarjeta modal emergente */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Botón X superior derecho */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={handleClose}
            disabled={isBusy}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialCommunityIcons name="close" size={18} color="#475569" />
          </TouchableOpacity>

          {/* Anillo de icono */}
          <View
            style={[
              styles.iconRingOuter,
              { backgroundColor: ringBg, borderColor: ringBorder },
            ]}
          >
            <View style={styles.iconRingInner}>
              <MaterialCommunityIcons
                name={finalIcon}
                size={28}
                color={iconColor}
              />
            </View>
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Subtítulo simple */}
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

          {/* Badge o dato destacado opcional */}
          {badgeText ? (
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          ) : null}

          {/* Botones de acción */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={handleClose}
              disabled={isBusy}
              activeOpacity={0.75}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnConfirm,
                { backgroundColor: confirmBg },
                isBusy && styles.btnConfirmDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isBusy}
              activeOpacity={0.85}
            >
              {isBusy ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnConfirmContent}>
                  {confirmIcon ? (
                    <MaterialCommunityIcons
                      name={confirmIcon}
                      size={16}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                  ) : null}
                  <Text style={styles.btnConfirmText}>{confirmText}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
  },
  card: {
    width: "100%",
    maxWidth: 350,
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingTop: 26,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.8)",
    ...Platform.select({
      web: {
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      } as any,
      default: {
        elevation: 12,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.18,
        shadowRadius: 20,
      },
    }),
  },
  closeIconButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  iconRingOuter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    marginBottom: 12,
  },
  iconRingInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
    marginBottom: 20,
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  btnCancel: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  btnConfirm: {
    flex: 1.15,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      } as any,
      default: {
        elevation: 3,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
    }),
  },
  btnConfirmDisabled: {
    opacity: 0.7,
  },
  btnConfirmText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  btnConfirmContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeContainer: {
    backgroundColor: "#F3ECFA",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E9D5FF",
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5A2D82",
  },
});
