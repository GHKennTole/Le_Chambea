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

export type AdminConfirmType =
  | "suspend"
  | "reactivate"
  | "delete"
  | "danger"
  | "warning"
  | "info";

export interface AdminConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  type?: AdminConfirmType;
  title: string;
  description: string;
  targetName?: string;
  targetSubtitle?: string;
  warningNote?: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
}

export default function AdminConfirmModal({
  visible,
  onClose,
  onConfirm,
  type = "warning",
  title,
  description,
  targetName,
  targetSubtitle,
  warningNote,
  confirmText,
  cancelText = "Cancelar",
  loading: externalLoading = false,
}: AdminConfirmModalProps) {
  const [internalLoading, setInternalLoading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  const isLoading = externalLoading || internalLoading;

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
    if (isLoading) return;
    try {
      setInternalLoading(true);
      await onConfirm();
    } catch (e) {
      console.error("Error executing admin action:", e);
    } finally {
      setInternalLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    onClose();
  };

  if (!visible) return null;

  // Configuration according to modal type
  const config = (() => {
    switch (type) {
      case "delete":
      case "danger":
        return {
          icon: "trash-can-outline" as const,
          iconColor: "#DC2626",
          ringOuterBg: "#FEF2F2",
          ringOuterBorder: "#FEE2E2",
          btnColor: "#DC2626",
          btnHoverColor: "#B91C1C",
          badgeBg: "#FEF2F2",
          badgeBorder: "#FECACA",
          badgeText: "#991B1B",
          warningBoxBg: "#FEF2F2",
          warningBoxBorder: "#FCA5A5",
          warningBoxText: "#991B1B",
          defaultConfirmText: "Eliminar",
        };
      case "suspend":
        return {
          icon: "pause-circle-outline" as const,
          iconColor: "#D97706",
          ringOuterBg: "#FFFBEB",
          ringOuterBorder: "#FEF3C7",
          btnColor: "#D97706",
          btnHoverColor: "#B45309",
          badgeBg: "#FFFBEB",
          badgeBorder: "#FDE68A",
          badgeText: "#92400E",
          warningBoxBg: "#FFFBEB",
          warningBoxBorder: "#FDE68A",
          warningBoxText: "#92400E",
          defaultConfirmText: "Suspender Cuenta",
        };
      case "reactivate":
        return {
          icon: "check-circle-outline" as const,
          iconColor: "#16A34A",
          ringOuterBg: "#F0FDF4",
          ringOuterBorder: "#DCFCE7",
          btnColor: "#16A34A",
          btnHoverColor: "#15803D",
          badgeBg: "#F0FDF4",
          badgeBorder: "#BBF7D0",
          badgeText: "#166534",
          warningBoxBg: "#F0FDF4",
          warningBoxBorder: "#BBF7D0",
          warningBoxText: "#166534",
          defaultConfirmText: "Reactivar Cuenta",
        };
      case "info":
        return {
          icon: "information-outline" as const,
          iconColor: "#5A2D82",
          ringOuterBg: "#F3ECFA",
          ringOuterBorder: "#E9D5FF",
          btnColor: "#5A2D82",
          btnHoverColor: "#4A246B",
          badgeBg: "#F3ECFA",
          badgeBorder: "#E9D5FF",
          badgeText: "#5A2D82",
          warningBoxBg: "#F3ECFA",
          warningBoxBorder: "#E9D5FF",
          warningBoxText: "#5A2D82",
          defaultConfirmText: "Aceptar",
        };
      case "warning":
      default:
        return {
          icon: "alert-circle-outline" as const,
          iconColor: "#D97706",
          ringOuterBg: "#FFFBEB",
          ringOuterBorder: "#FEF3C7",
          btnColor: "#D97706",
          btnHoverColor: "#B45309",
          badgeBg: "#FFFBEB",
          badgeBorder: "#FDE68A",
          badgeText: "#92400E",
          warningBoxBg: "#FFFBEB",
          warningBoxBorder: "#FDE68A",
          warningBoxText: "#92400E",
          defaultConfirmText: "Continuar",
        };
    }
  })();

  const effectiveConfirmText = confirmText || config.defaultConfirmText;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop táctil para cerrar si no está cargando */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          disabled={isLoading}
        >
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </Pressable>

        {/* Tarjeta de alerta */}
        <Animated.View
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Botón cerrar "X" en la esquina superior derecha */}
          <TouchableOpacity
            style={styles.closeIconButton}
            onPress={handleClose}
            disabled={isLoading}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar ventana de alerta"
          >
            <MaterialCommunityIcons name="close" size={18} color="#0F172A" />
          </TouchableOpacity>

          {/* Anillo de icono temático */}
          <View
            style={[
              styles.iconRingOuter,
              {
                backgroundColor: config.ringOuterBg,
                borderColor: config.ringOuterBorder,
              },
            ]}
          >
            <MaterialCommunityIcons
              name={config.icon}
              size={32}
              color={config.iconColor}
            />
          </View>

          {/* Título */}
          <Text style={styles.title}>{title}</Text>

          {/* Chip de usuario o recurso objetivo si se proporciona */}
          {targetName && (
            <View
              style={[
                styles.targetBadge,
                {
                  backgroundColor: config.badgeBg,
                  borderColor: config.badgeBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="account"
                size={14}
                color={config.badgeText}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[styles.targetNameText, { color: config.badgeText }]}
                numberOfLines={1}
              >
                {targetName}
              </Text>
              {targetSubtitle && (
                <Text
                  style={[
                    styles.targetSubtitleText,
                    { color: config.badgeText },
                  ]}
                >
                  • {targetSubtitle}
                </Text>
              )}
            </View>
          )}

          {/* Descripción */}
          <Text style={styles.description}>{description}</Text>

          {/* Recuadro de advertencia adicional si aplica */}
          {warningNote && (
            <View
              style={[
                styles.warningBox,
                {
                  backgroundColor: config.warningBoxBg,
                  borderColor: config.warningBoxBorder,
                },
              ]}
            >
              <MaterialCommunityIcons
                name="alert-outline"
                size={16}
                color={config.warningBoxText}
                style={{ marginRight: 8, marginTop: 1 }}
              />
              <Text
                style={[
                  styles.warningBoxText,
                  { color: config.warningBoxText },
                ]}
              >
                {warningNote}
              </Text>
            </View>
          )}

          {/* Botones de acción (Cancelar y Confirmar) */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={handleClose}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <Text style={styles.btnCancelText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnConfirm,
                { backgroundColor: config.btnColor },
                isLoading && styles.btnConfirmDisabled,
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <MaterialCommunityIcons
                    name={
                      type === "delete" || type === "danger"
                        ? "trash-can"
                        : type === "suspend"
                        ? "pause"
                        : type === "reactivate"
                        ? "check-circle"
                        : "check"
                    }
                    size={16}
                    color="#FFFFFF"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.btnConfirmText}>
                    {effectiveConfirmText}
                  </Text>
                </>
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
    paddingHorizontal: 16,
    ...Platform.select({
      web: {
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 999999,
        display: "flex",
      } as any,
    }),
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    zIndex: 1,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingTop: 26,
    paddingBottom: 22,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(241, 245, 249, 0.9)",
    zIndex: 10,
    ...Platform.select({
      web: {
        boxShadow:
          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
      } as any,
      default: {
        elevation: 16,
        shadowColor: "#0F172A",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
      },
    }),
  },
  closeIconButton: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      } as any,
    }),
  },
  iconRingOuter: {
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    marginBottom: 14,
  },
  title: {
    fontSize: 19,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  targetBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    maxWidth: "92%",
  },
  targetNameText: {
    fontSize: 13,
    fontWeight: "700",
  },
  targetSubtitleText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
    opacity: 0.85,
  },
  description: {
    fontSize: 13.5,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    width: "100%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 18,
  },
  warningBoxText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    width: "100%",
    gap: 10,
    marginTop: 4,
  },
  btnCancel: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
      } as any,
    }),
  },
  btnCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
  },
  btnConfirm: {
    flex: 1.3,
    height: 46,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    ...Platform.select({
      web: {
        cursor: "pointer",
        userSelect: "none",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
      } as any,
      default: {
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  btnConfirmDisabled: {
    opacity: 0.7,
  },
  btnConfirmText: {
    fontSize: 13.5,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: -0.2,
  },
});
