import React, { useState, useEffect } from "react";
import { View, TouchableOpacity, StyleSheet, Image, Text, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { RootStackParamList } from "../../core/navigation/types";
import { useAppBadges } from "../hooks/useAppBadges";
import { useResponsive } from "../hooks/useResponsive";

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function BottomNav({ active }: { active: keyof RootStackParamList }) {
  const nav = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const { unreadChatsCount } = useAppBadges();
  const { isLargeScreen } = useResponsive();

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleFocusIn = (e: any) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || (target as any).isContentEditable)) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement;
        if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA' && !(activeEl as any).isContentEditable)) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    const handleViewport = () => {
      if (window.visualViewport) {
        const isKb = window.innerHeight - window.visualViewport.height > 100 || (typeof window.outerHeight !== 'undefined' && window.outerHeight - window.visualViewport.height > 150 && window.visualViewport.height < window.innerHeight * 0.85);
        if (isKb) {
          setIsKeyboardOpen(true);
        } else {
          const activeEl = document.activeElement as HTMLElement;
          if (!activeEl || (activeEl.tagName !== 'INPUT' && activeEl.tagName !== 'TEXTAREA' && !(activeEl as any).isContentEditable)) {
            setIsKeyboardOpen(false);
          }
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewport);
    }
    window.addEventListener('resize', handleViewport);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewport);
      }
      window.removeEventListener('resize', handleViewport);
    };
  }, []);

  if (Platform.OS === 'web' && isKeyboardOpen) {
    return null;
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: insets.bottom > 0 ? insets.bottom : 8 }]}>
      <View style={styles.container}>
        {/* Inicio */}
        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.7} 
          onPress={() => nav.navigate("Home")}
        >
          <MaterialCommunityIcons 
            name="home" 
            size={24} 
            color={active === "Home" ? "#5A2D82" : "#666666"} 
          />
          <Text style={[styles.navText, active === "Home" && styles.navTextActive]}>
            Inicio
          </Text>
        </TouchableOpacity>

        {/* Mensajes */}
        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.7} 
          onPress={() => nav.navigate("ChatList")}
        >
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name="chat" 
              size={24} 
              color={active === "ChatList" ? "#5A2D82" : "#666666"} 
            />
            {unreadChatsCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadChatsCount}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.navText, active === "ChatList" && styles.navTextActive]}>
            Mensajes
          </Text>
        </TouchableOpacity>

        {/* Asistente AI */}
        <TouchableOpacity 
          style={styles.centerNavItem} 
          activeOpacity={0.85} 
          onPress={() => nav.navigate("AI")}
        >
          <View style={styles.centerBtn}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.navText, active === "AI" && styles.navTextActive, styles.centerNavText]}>
            Asistente AI
          </Text>
        </TouchableOpacity>

        {/* Favoritos */}
        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.7} 
          onPress={() => nav.navigate("Favorites")}
        >
          <MaterialCommunityIcons 
            name="star" 
            size={24} 
            color={active === "Favorites" ? "#5A2D82" : "#666666"} 
          />
          <Text style={[styles.navText, active === "Favorites" && styles.navTextActive]}>
            Favoritos
          </Text>
        </TouchableOpacity>

        {/* Menú */}
        <TouchableOpacity 
          style={styles.navItem} 
          activeOpacity={0.7} 
          onPress={() => nav.navigate("Menu")}
        >
          <MaterialCommunityIcons 
            name="menu" 
            size={24} 
            color={active === "Menu" ? "#5A2D82" : "#666666"} 
          />
          <Text style={[styles.navText, active === "Menu" && styles.navTextActive]}>
            Menú
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderColor: "#EAEAEF",
    ...Platform.select({
      web: { boxShadow: '0px -2px 10px rgba(0,0,0,0.06)' } as any,
      default: {
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      }
    }),
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    paddingTop: 6,
    paddingBottom: 4,
    backgroundColor: "white",
    alignSelf: 'center',
    width: '100%',
    maxWidth: 800,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerNavItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerBtn: {
    backgroundColor: "#F3ECFA",
    padding: 6,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
    ...Platform.select({
      web: { boxShadow: '0px 2px 8px rgba(90, 45, 130, 0.2)' } as any,
      default: { elevation: 4 }
    })
  },
  logo: { width: 36, height: 36 },
  centerNavText: {
    marginTop: 1,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 10,
    marginTop: 3,
    fontWeight: "600",
    color: "#666666",
    textAlign: "center",
  },
  navTextActive: {
    color: "#5A2D82",
    fontWeight: "bold",
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#ff3b30',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
