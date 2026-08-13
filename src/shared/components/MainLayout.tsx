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

  const [isButtonHovered, setIsButtonHovered] = React.useState(false);
  const [isMenuHovered, setIsMenuHovered] = React.useState(false);

  if (!isDesktop) {
    return (
      <View style={{ flex: 1, backgroundColor: 'white' }}>
        <View style={{ flex: 1 }}>
          {children}
        </View>
        {!hideBottomNav && !keyboardVisible && (
          <BottomNav active={active} />
        )}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F6F6F8', paddingHorizontal: 32, paddingVertical: 20, gap: 12 }}>
      <View style={{
        width: 260,
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ECECF1',
        paddingVertical: 24,
        paddingHorizontal: 16,
        ...Platform.select({
          web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' } as any,
          default: { elevation: 2 }
        })
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 40, paddingHorizontal: 8, gap: 12 }}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 44, height: 44 }} resizeMode="contain" />
          <Text style={{ fontSize: 24, fontFamily: 'SansitaBoldItalic', color: '#222' }}>LE CHAMBEA</Text>
        </View>
        
        <View style={{ gap: 8 }}>
          <SidebarItem name="Home" icon="home" label="Inicio" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="ChatList" icon="chat" label="Mensajes" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="AI" icon="bird" label="Asistente AI" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
          <SidebarItem name="Favorites" icon="star" label="Favoritos" active={active} unreadChatsCount={unreadChatsCount} nav={nav} />
        </View>

        <View style={{ flex: 1 }} />

        {/* Botón Menú destacado al pie del menú lateral */}
        <TouchableOpacity 
          style={[
            { 
              backgroundColor: isMenuHovered ? "#462067" : PURPLE, 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'center', 
              paddingVertical: 14, 
              borderRadius: 12, 
              gap: 8,
              width: '100%',
            },
            Platform.OS === 'web' && ({ cursor: 'pointer', transition: 'all 0.2s ease' } as any)
          ]} 
          activeOpacity={0.85}
          onPress={() => nav.navigate('Menu' as any)}
          {...({
            onMouseEnter: () => setIsMenuHovered(true),
            onMouseLeave: () => setIsMenuHovered(false),
          } as any)}
        >
          <MaterialCommunityIcons name="menu" size={22} color="white" />
          <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Menú</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, backgroundColor: 'white', borderRadius: 20, borderWidth: 1, borderColor: '#ECECF1', overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' } as any, default: { elevation: 2 } }) }}>
        {children}
      </View>

      {active === 'Home' && (
        <View style={{
          width: 280,
          backgroundColor: 'white',
          borderRadius: 20,
          borderWidth: 1,
          borderColor: '#ECECF1',
          paddingVertical: 24,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'space-between',
          ...Platform.select({
            web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.05)' } as any,
            default: { elevation: 2 }
          })
        }}>
          {/* Título de la sección fijo arriba del cuadro */}
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: PURPLE, marginBottom: 12, textAlign: 'center' }}>
            ✨ Prueba Sula AI ✨
          </Text>

          <View style={{ width: '100%', flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 12 }}>
            {/* Pregunta destacada como título principal del contenido */}
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1A1A1A', textAlign: 'center', marginBottom: 28, lineHeight: 25 }}>
              ¿Tienes dificultades para encontrar lo que buscas?
            </Text>

            {/* Imagen del Banner IA clickeable */}
            <TouchableOpacity 
              activeOpacity={0.85} 
              onPress={() => nav.navigate('AI' as any)}
              style={{ width: '100%', alignItems: 'center', marginBottom: 20 }}
            >
              <Image 
                source={require('../../assets/images/banner ia.png')} 
                style={{ width: '100%', height: 260, borderRadius: 14 }} 
                resizeMode="contain" 
              />
            </TouchableOpacity>

            {/* Texto motivacional */}
            <Text style={{ fontSize: 13, color: '#555', textAlign: 'center', lineHeight: 20, paddingHorizontal: 4 }}>
              Utiliza nuestro asistente virtual para encontrar de forma más fácil y rápida a la persona ideal que ofrezca el servicio que necesitas.
            </Text>
          </View>

          {/* Botón Asistente AI al final del panel con estado Hover */}
          <TouchableOpacity 
            style={[
              { 
                backgroundColor: isButtonHovered ? "#462067" : PURPLE, 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
                paddingVertical: 14, 
                borderRadius: 12, 
                gap: 8,
                width: '100%',
                marginTop: 16,
              },
              Platform.OS === 'web' && ({ cursor: 'pointer', transition: 'all 0.2s ease' } as any)
            ]} 
            activeOpacity={0.85}
            onPress={() => nav.navigate('AI' as any)}
            {...({
              onMouseEnter: () => setIsButtonHovered(true),
              onMouseLeave: () => setIsButtonHovered(false),
            } as any)}
          >
            <MaterialCommunityIcons name="bird" size={22} color="white" />
            <Text style={{ color: 'white', fontSize: 16, fontWeight: 'bold' }}>Asistente AI</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
