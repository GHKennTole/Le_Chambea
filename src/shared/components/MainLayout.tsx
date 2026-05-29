import React from 'react';
import { View, useWindowDimensions, Platform, TouchableOpacity, Text, Image, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from './BottomNav';
import type { RootStackParamList } from '../../core/navigation/types';

import { useAppBadges } from '../hooks/useAppBadges';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MainLayoutProps {
  children: React.ReactNode;
  active: keyof RootStackParamList;
  hideBottomNav?: boolean;
}

const PURPLE = "#5A2D82";

interface SidebarItemProps {
  name: keyof RootStackParamList;
  icon: any;
  label: string;
  active: keyof RootStackParamList;
  unreadChatsCount: number;
  nav: Nav;
}

const SidebarItem = React.memo(({ name, icon, label, active, unreadChatsCount, nav }: SidebarItemProps) => {
  const isActive = active === name;
  const showChatBadge = name === 'ChatList' && unreadChatsCount > 0;

  return (
    <TouchableOpacity 
      style={[
        { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 16, position: 'relative' },
        isActive && { backgroundColor: '#F3ECFA' }
      ]} 
      onPress={() => nav.navigate(name as any)}
    >
      <MaterialCommunityIcons name={icon} size={24} color={isActive ? PURPLE : '#666'} />
      <Text style={{ fontSize: 16, color: isActive ? PURPLE : '#666', fontWeight: isActive ? 'bold' : '600', flex: 1 }}>{label}</Text>
      {showChatBadge && (
        <View style={{ backgroundColor: '#ff3b30', borderRadius: 9, minWidth: 18, height: 18, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 }}>
          <Text style={{ color: 'white', fontSize: 9, fontWeight: 'bold' }}>{unreadChatsCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
});

export default function MainLayout({ children, active, hideBottomNav = false }: MainLayoutProps) {
  const { width } = useWindowDimensions();
  const nav = useNavigation<Nav>();
  const [keyboardVisible, setKeyboardVisible] = React.useState(false);
  const { unreadChatsCount } = useAppBadges();

  React.useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardVisible(false);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const isDesktop = Platform.OS === 'web' && width >= 1024;

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flex: 1, paddingBottom: (hideBottomNav || keyboardVisible) ? 0 : 120 }}>
          {children}
        </View>
        {!hideBottomNav && !keyboardVisible && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
            <BottomNav active={active} />
          </View>
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <View style={{
        width: 260,
        backgroundColor: 'white',
        borderRightWidth: 1,
        borderRightColor: '#ECECF1',
        paddingVertical: 24,
        paddingHorizontal: 16,
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8, gap: 12 }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 40, height: 40 }} resizeMode="contain" />
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: PURPLE }}>Le Chambea</Text>
        </View>
        
        <View style={{ gap: 8 }}>
          <SidebarItem name="Home" icon="home" label="Inicio" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="Search" icon="magnify" label="Búsqueda" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="ChatList" icon="chat" label="Mensajes" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="Favorites" icon="star" label="Favoritos" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="Menu" icon="menu" label="Menú" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity 
          style={{ backgroundColor: PURPLE, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, gap: 8 }} 
          onPress={() => nav.navigate('AI' as any)}
        >
          <MaterialCommunityIcons name="robot-outline" size={20} color="white" />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Asistente AI</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: '#F6F6F8' }}>
        {children}
      </View>
    </View>
  );
}
