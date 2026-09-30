import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Pressable,
  Platform,
  ScrollView,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CircularDeleteButton from "./CircularDeleteButton";
import { useResponsive } from "../hooks/useResponsive";
import { cleanNotificationBody } from "../hooks/useAppBadges";

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
  fecha_creacion?: string;
};

export default function NotificationsDropdown({
  visible,
  onClose,
  notifications,
  onDelete,
  onDeleteAll,
  onPressItem,
}: {
  visible: boolean;
  onClose: () => void;
  notifications?: NotificationItem[];
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  onPressItem?: (item: NotificationItem) => void;
}) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const { isLargeScreen } = useResponsive();

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: Platform.OS !== "web",
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const opacity = anim;

  const list = useMemo(() => notifications ?? [], [notifications]);

  // Posicionamiento dinámico y cálculo de altura máxima para evitar desbordes
  const panelTop = insets.top + (isLargeScreen ? 60 : 64);
  const maxPanelHeight = Math.min(
    windowHeight - panelTop - (insets.bottom || 16) - 16,
    isLargeScreen ? 560 : 520
  );
  const maxScrollHeight = Math.max(120, maxPanelHeight - (onDeleteAll && list.length > 0 ? 115 : 65));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop para cerrar tocando fuera del panel */}
        <Pressable
          style={styles.backdrop}
          onPress={onClose}
          accessibilityLabel="Cerrar notificaciones"
        />

        <Animated.View
          style={[
            styles.panel,
            isLargeScreen && styles.panelLarge,
            {
              top: panelTop,
              maxHeight: maxPanelHeight,
              opacity,
              transform: [{ translateY }],
            },
          ]}
          onStartShouldSetResponder={() => true}
          {...(Platform.OS === 'web' ? { onClick: (e: any) => e.stopPropagation() } : {})}
        >
          {/* Cabecera con título, contador de notificaciones y botón cerrar */}
          <View style={styles.headerRow}>
            <View style={styles.titleWrapper}>
              <Text style={styles.panelTitle}>Notificaciones</Text>
              {list.length > 0 && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{list.length}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Contenido: vacío o lista con scroll */}
          {list.length === 0 ? (
            <View style={styles.emptyBox}>
              <Image
                source={require("../../assets/images/sin_notificaciones.png")}
                style={styles.emptyImg}
                resizeMode="contain"
              />
              <Text style={styles.emptyText}>Aún no hay notificaciones</Text>
            </View>
          ) : (
            <>
              <ScrollView
                style={[styles.scrollArea, { maxHeight: maxScrollHeight }]}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                bounces={true}
              >
                {list.map((n) => (
                  <View key={n.id} style={styles.item}>
                    <TouchableOpacity
                      style={styles.itemContent}
                      activeOpacity={0.6}
                      onPress={() => onPressItem && onPressItem(n)}
                    >
                      <Text style={styles.itemTitle}>{n.title}</Text>
                      {!!cleanNotificationBody(n.body) && (
                        <Text style={styles.itemBody}>{cleanNotificationBody(n.body)}</Text>
                      )}
                    </TouchableOpacity>
                    {onDelete && (
                      <CircularDeleteButton onPress={() => onDelete(n.id)} style={styles.deleteBtn} />
                    )}
                  </View>
                ))}
              </ScrollView>

              {onDeleteAll && (
                <TouchableOpacity onPress={onDeleteAll} style={styles.deleteAllBtn} activeOpacity={0.8}>
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={16}
                    color="#C53030"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.deleteAllText}>Limpiar bandeja</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    position: "relative",
    width: "100%",
    height: "100%",
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    zIndex: 1,
  },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eee",
    zIndex: 9999,
    flexDirection: "column",
    ...Platform.select({
      web: { boxShadow: "0px 8px 24px rgba(0,0,0,0.15)" } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
      },
    }),
  },
  panelLarge: {
    left: "auto" as any,
    right: 32,
    width: 380,
    maxWidth: 420,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    flexShrink: 0,
  },
  titleWrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: { fontSize: 16, fontWeight: "900", color: "#222" },
  badgePill: {
    backgroundColor: "#5A2D82",
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  badgePillText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  closeText: { fontSize: 13, fontWeight: "800", color: "#5A2D82" },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 12,
  },
  emptyImg: { width: 180, height: 120 },
  emptyText: { marginTop: 8, fontWeight: "800", color: "#666" },

  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    gap: 10,
    paddingVertical: 2,
  },

  item: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f7f7f7",
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemContent: {
    flex: 1,
    marginRight: 8,
  },
  deleteBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
  },
  itemTitle: { fontWeight: "900", color: "#222" },
  itemBody: { marginTop: 2, color: "#666", fontWeight: "600" },
  deleteAllBtn: {
    flexDirection: "row",
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    flexShrink: 0,
  },
  deleteAllText: {
    color: "#C53030",
    fontWeight: "bold",
    fontSize: 14,
  },
});
