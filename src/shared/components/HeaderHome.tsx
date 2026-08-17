import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Platform, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationsDropdown from "./NotificationsDropdown";
import { useNavigation } from "@react-navigation/native";
import { useProfileController } from "../../features/perfil/controllers/useProfileController";
import { useResponsive } from "../hooks/useResponsive";

const PURPLE = "#5A2D82";

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
  const { isLargeScreen } = useResponsive();

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

  const isDesktop = isLargeScreen;
  const userName = profile.nombre ? profile.nombre : "Usuario";

  return (
    <View style={[styles.container, { paddingTop: isDesktop ? 16 : insets.top + 12 }]}>
      {isDesktop ? (
        <View style={styles.webHeaderRow}>
          {/* Buscador de escritorio en blanco contrastante */}
          <View style={[styles.searchBox, styles.webSearchBox]}>
            <TextInput 
              placeholder="¿Qué servicio buscas hoy?" 
              placeholderTextColor="#888"
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} 
              value={searchQuery}
              onChangeText={onSearchChange}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              keyboardType="default"
              inputMode="search"
              {...(Platform.OS === 'web' ? ({
                'data-autocomplete': 'off',
                'data-form-type': 'other',
                'data-lpignore': 'true',
                'data-1p-ignore': 'true',
                name: 'service_search_query_desktop',
                id: 'service_search_query_desktop',
              } as any) : {})}
            />
            <MaterialCommunityIcons name="magnify" size={22} color={PURPLE} />
          </View>

          <View style={{ flex: 1 }} />

          {/* Icono de notificaciones */}
          <TouchableOpacity onPress={handlePressNoti} activeOpacity={0.8} style={styles.notiIconContainer}>
            <MaterialCommunityIcons name="bell-outline" size={22} color="white" />
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
                <MaterialCommunityIcons name="account" size={20} color="white" />
              </View>
            )}
            <View style={styles.userInfoText}>
              <Text style={styles.userGreeting}>Bienvenido,</Text>
              <Text style={styles.userName} numberOfLines={1}>{userName}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.topRow}>
            {/* Logo y Marca Oficial con estilo Welcome */}
            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Image 
                  source={require('../../assets/images/logo.png')} 
                  style={styles.brandLogo} 
                  resizeMode="contain" 
                />
              </View>
              <Text style={styles.appTitle}>
                LE CHAMBEA
              </Text>
            </View>

            <TouchableOpacity onPress={handlePressNoti} activeOpacity={0.8} style={styles.notiIconContainer}>
              <MaterialCommunityIcons name="bell-outline" size={24} color="white" />
              {unreadNotificationsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadNotificationsCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Buscador integrado dentro del banner morado */}
          <View style={styles.searchBox}>
            <TextInput 
              placeholder="¿Qué servicio buscas hoy?" 
              placeholderTextColor="#888"
              style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]} 
              value={searchQuery}
              onChangeText={onSearchChange}
              autoComplete="off"
              autoCorrect={false}
              spellCheck={false}
              textContentType="none"
              keyboardType="default"
              inputMode="search"
              {...(Platform.OS === 'web' ? ({
                'data-autocomplete': 'off',
                'data-form-type': 'other',
                'data-lpignore': 'true',
                'data-1p-ignore': 'true',
                name: 'service_search_query_mobile',
                id: 'service_search_query_mobile',
              } as any) : {})}
            />
            <MaterialCommunityIcons name="magnify" size={22} color={PURPLE} />
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
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: Platform.OS === 'web' ? 20 : 16,
    paddingBottom: 16,
    zIndex: 10,
    ...Platform.select({
      web: { boxShadow: '0px 4px 14px rgba(90,45,130,0.22)' } as any,
      default: {
        elevation: 5,
        shadowColor: PURPLE,
        shadowOpacity: 0.22,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      }
    }),
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logoCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      web: { boxShadow: '0px 2px 5px rgba(0,0,0,0.15)' } as any,
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      }
    }),
  },
  brandLogo: {
    width: 48,
    height: 48,
  },
  appTitle: {
    fontSize: 27,
    fontFamily: "SansitaBoldItalic",
    color: "#FFFFFF",
    letterSpacing: 1.2,
    transform: [{ skewX: "-5deg" }],
    ...Platform.select({
      web: { textShadow: '0px 3px 6px rgba(0,0,0,0.3)' } as any,
      default: {
        textShadowColor: "rgba(0, 0, 0, 0.3)",
        textShadowOffset: { width: 0, height: 3 },
        textShadowRadius: 6,
      }
    }),
  },
  webHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 44,
    marginTop: 14,
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(0,0,0,0.08)' } as any,
      default: {
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      }
    })
  },
  webSearchBox: {
    width: 380,
    marginTop: 0,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14.5,
    color: "#222",
  },
  notiIconContainer: {
    position: 'relative',
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  userProfileMenu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 5,
    paddingHorizontal: 12,
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
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfoText: {
    maxWidth: 120,
  },
  userGreeting: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
  },
  userName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: 'white',
  },
});
