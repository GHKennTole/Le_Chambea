import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CircularDeleteButton from "./CircularDeleteButton";
import { useResponsive } from "../hooks/useResponsive";

type NotificationItem = {
  id: string;
  title: string;
  body?: string;
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
  const { isLargeScreen } = useResponsive();

  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: 180,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [visible, anim]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });

  const opacity = anim;

  const list = useMemo(() => notifications ?? [], [notifications]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Backdrop para cerrar tocando fuera */}
      <Pressable style={styles.backdrop} onPress={onClose} />

      <Animated.View
        style={[
          styles.panel,
          isLargeScreen && styles.panelLarge,
          {
            top: insets.top + (isLargeScreen ? 60 : 10),
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.panelTitle}>Notificaciones</Text>

          <TouchableOpacity onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.closeText}>Cerrar</Text>
          </TouchableOpacity>
        </View>

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
          <View style={{ gap: 10 }}>
            {list.map((n) => (
              <View key={n.id} style={styles.item}>
                <TouchableOpacity 
                  style={styles.itemContent}
                  activeOpacity={0.6}
                  onPress={() => onPressItem && onPressItem(n)}
                >
                  <Text style={styles.itemTitle}>{n.title}</Text>
                  {!!n.body && <Text style={styles.itemBody}>{n.body}</Text>}
                </TouchableOpacity>
                {onDelete && (
                  <CircularDeleteButton onPress={() => onDelete(n.id)} style={styles.deleteBtn} />
                )}
              </View>
            ))}

            {onDeleteAll && (
              <TouchableOpacity onPress={onDeleteAll} style={styles.deleteAllBtn} activeOpacity={0.8}>
                <MaterialCommunityIcons name="trash-can-outline" size={16} color="#C53030" style={{ marginRight: 6 }} />
                <Text style={styles.deleteAllText}>Limpiar bandeja</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#eee",
    zIndex: 9999,
    ...Platform.select({
      web: { boxShadow: '0px 6px 10px rgba(0,0,0,0.12)' } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 10,
        elevation: 8,
      }
    }),
  },
  panelLarge: {
    left: 'auto' as any,
    right: 32,
    width: 380,
    maxWidth: 420,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  panelTitle: { fontSize: 16, fontWeight: "900", color: "#222" },
  closeText: { fontSize: 13, fontWeight: "800", color: "#5A2D82" },

  emptyBox: {
    alignItems: "center",
    paddingVertical: 8,
  },
  emptyImg: { width: 180, height: 120 },
  emptyText: { marginTop: 8, fontWeight: "800", color: "#666" },

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
  },
  deleteAllText: {
    color: "#C53030",
    fontWeight: "bold",
    fontSize: 14,
  },
});
