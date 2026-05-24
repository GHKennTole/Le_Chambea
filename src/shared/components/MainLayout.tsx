import React from 'react';
import { View, useWindowDimensions, Platform, TouchableOpacity, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNav from './BottomNav';
import type { RootStackParamList } from '../../core/navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MainLayoutProps {
  children: React.ReactNode;
  active: keyof RootStackParamList;
  hideBottomNav?: boolean;
}

const PURPLE = "#5A2D82";

export default function MainLayout({ children, active, hideBottomNav = false }: MainLayoutProps) {
  const { width } = useWindowDimensions();
  const nav = useNavigation<Nav>();

  const isDesktop = Platform.OS === 'web' && width >= 1024;

  const SidebarItem = ({ name, icon, label }: { name: keyof RootStackParamList, icon: any, label: string }) => {
    const isActive = active === name;
    return (
      <TouchableOpacity 
        style={[
          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, gap: 16 },
          isActive && { backgroundColor: '#F3ECFA' }
        ]} 
        onPress={() => nav.navigate(name as any)}
      >
        <MaterialCommunityIcons name={icon} size={24} color={isActive ? PURPLE : '#666'} />
        <Text style={{ fontSize: 16, color: isActive ? PURPLE : '#666', fontWeight: isActive ? 'bold' : '600' }}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (!isDesktop) {
    return (
      <View style={{ flex: 1 }}>
        {children}
        {!hideBottomNav && (
          <BottomNav active={active} />
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
          <SidebarItem name="Home" icon="home" label="Inicio" />
          <SidebarItem name="Search" icon="magnify" label="Búsqueda" />
          <SidebarItem name="ChatList" icon="chat" label="Mensajes" />
          <SidebarItem name="Favorites" icon="star" label="Favoritos" />
          <SidebarItem name="Menu" icon="menu" label="Menú" />
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
