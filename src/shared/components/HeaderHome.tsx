import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationsDropdown from "./NotificationsDropdown";
import { useNavigation } from "@react-navigation/native";

interface HeaderHomeProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  unreadNotificationsCount: number;
  notifications: any[];
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;
  deleteAllNotifications: () => void;
}

export default function HeaderHome({ 
  searchQuery, 
  onSearchChange,
  unreadNotificationsCount,
  notifications,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications
}: HeaderHomeProps) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const [openNoti, setOpenNoti] = useState(false);

  const handlePressNoti = () => {
    const nextVal = !openNoti;
    setOpenNoti(nextVal);
    if (nextVal) {
      markAllNotificationsAsRead();
    }
  };

  const handleNotificationPress = (item: any) => {
    setOpenNoti(false);
    const titleLower = item.title.toLowerCase();
    const bodyLower = (item.body || '').toLowerCase();

    if (titleLower.includes("chat") || titleLower.includes("mensaje") || bodyLower.includes("chatear")) {
      navigation.navigate("ChatList");
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.topRow}>
        <Text style={[styles.title, { fontFamily: "SansitaBoldItalic" }]}>
          LE CHAMBEA
        </Text>

        <TouchableOpacity onPress={handlePressNoti} activeOpacity={0.8} style={styles.notiIconContainer}>
          <MaterialCommunityIcons name="bell-outline" size={26} color="#5A2D82" />
          {unreadNotificationsCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View style={[styles.searchBox, { marginTop: 15, marginBottom: 8 }]}>
        <TextInput 
          placeholder="¿Qué servicio buscas hoy?" 
          style={styles.input} 
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        <MaterialCommunityIcons name="magnify" size={22} color="#5A2D82" />
      </View>

      <NotificationsDropdown
        visible={openNoti}
        onClose={() => setOpenNoti(false)}
        notifications={notifications}
        onDelete={deleteNotification}
        onDeleteAll={deleteAllNotifications}
        onPressItem={handleNotificationPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    paddingHorizontal: 10,
    zIndex: 10,
    elevation: 10,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "600",
    color: "#222",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eee",
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    padding: 8,
  },
  notiIconContainer: {
    position: 'relative',
    padding: 2,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#ff3b30',
    borderRadius: 7,
    minWidth: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  badgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
