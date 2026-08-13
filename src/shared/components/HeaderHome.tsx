import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationsDropdown from "./NotificationsDropdown";
import { useNavigation } from "@react-navigation/native";
import { useProfileController } from "../../features/perfil/controllers/useProfileController";

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
  const { profile } = useProfileController();

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

  const isWeb = Platform.OS === 'web';
  const userName = profile.nombre ? profile.nombre : "Usuario";

  return (
    <View style={[styles.container, { paddingTop: isWeb ? 15 : insets.top + 10 }]}>
      {isWeb ? (
        <View style={styles.webHeaderRow}>
          {/* Buscador más compacto */}
          <View style={[styles.searchBox, styles.webSearchBox]}>
            <TextInput 
              placeholder="¿Qué servicio buscas hoy?" 
              placeholderTextColor="#777"
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} 
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            <MaterialCommunityIcons name="magnify" size={22} color="#5A2D82" />
          </View>

          <View style={{ flex: 1 }} />

          {/* Icono de notificaciones */}
          <TouchableOpacity onPress={handlePressNoti} activeOpacity={0.8} style={styles.notiIconContainer}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#5A2D82" />
            {unreadNotificationsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Menú de Perfil de Usuario */}
          <TouchableOpacity 
            style={styles.userProfileMenu} 
            activeOpacity={0.8}
            onPress={() => navigation.navigate("Profile")}
          >
            {profile.foto_perfil ? (
              <Image source={{ uri: profile.foto_perfil }} style={styles.userAvatar} />
            ) : (
              <View style={styles.userAvatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={20} color="#5A2D82" />
              </View>
            )}
            <View style={styles.userInfoText}>
              <Text style={styles.userGreeting}>Bienvenido,</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
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
              placeholderTextColor="#777"
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} 
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            <MaterialCommunityIcons name="magnify" size={22} color="#5A2D82" />
          </View>
        </>
      )}

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
    paddingHorizontal: Platform.OS === 'web' ? 16 : 10,
    zIndex: 10,
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  webHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 4,
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
  webSearchBox: {
    width: 380,
    marginVertical: 0,
    backgroundColor: "#F2F2F6",
  },
  input: {
    flex: 1,
    padding: 8,
  },
  notiIconContainer: {
    position: 'relative',
    padding: 6,
    backgroundColor: '#F2F2F6',
    borderRadius: 20,
  },
  userProfileMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F2F2F6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5DDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoText: {
    flexDirection: 'column',
  },
  userGreeting: {
    fontSize: 10,
    color: '#888',
    fontWeight: '500',
  },
  userName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#222',
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
