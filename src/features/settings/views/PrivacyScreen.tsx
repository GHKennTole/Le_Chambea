import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { usePrivacyController } from '../controllers/usePrivacyController';
import { useResponsive } from '../../../shared/hooks/useResponsive';

const PURPLE = '#5A2D82';
const PURPLE_ACCENT = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const vm = usePrivacyController();
  const { isLargeScreen } = useResponsive();

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.headerBanner}>
        <Text style={styles.headerTitle}>Privacidad</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.description}>
          Configura cómo interactúan los clientes con tus servicios y qué información se muestra en tu perfil público.
        </Text>

        <View style={styles.settingCard}>
          {/* Aparecer en búsquedas */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="eye-outline" size={24} color={PURPLE} style={styles.icon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Aparecer en búsquedas</Text>
              <Text style={styles.settingDesc}>
                Permite que tu perfil profesional sea visible en el catálogo público y resultados de búsqueda.
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#d3d3d3', true: '#d0b3f0' }}
              thumbColor={vm.perfilPublico ? PURPLE : '#f4f3f4'}
              onValueChange={vm.togglePerfilPublico}
              value={vm.perfilPublico}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          {/* Recibir chats directos */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="chat-outline" size={24} color={PURPLE} style={styles.icon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Recibir mensajes directos</Text>
              <Text style={styles.settingDesc}>
                Permite que los clientes interesados en tus servicios puedan iniciarte un chat.
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#d3d3d3', true: '#d0b3f0' }}
              thumbColor={vm.permitirChat ? PURPLE : '#f4f3f4'}
              onValueChange={vm.togglePermitirChat}
              value={vm.permitirChat}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          {/* Mostrar contador de trabajos */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="briefcase-check-outline" size={24} color={PURPLE} style={styles.icon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mostrar trabajos completados</Text>
              <Text style={styles.settingDesc}>
                Muestra el contador total de contrataciones finalizadas exitosamente en tu perfil.
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#d3d3d3', true: '#d0b3f0' }}
              thumbColor={vm.mostrarTrabajos ? PURPLE : '#f4f3f4'}
              onValueChange={vm.toggleMostrarTrabajos}
              value={vm.mostrarTrabajos}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          {/* Mostrar reseñas */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="star-outline" size={24} color={PURPLE} style={styles.icon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mostrar opiniones y reseñas</Text>
              <Text style={styles.settingDesc}>
                Permite que otros usuarios vean tus estrellas y los comentarios otorgados por tus clientes.
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#d3d3d3', true: '#d0b3f0' }}
              thumbColor={vm.mostrarResenas ? PURPLE : '#f4f3f4'}
              onValueChange={vm.toggleMostrarResenas}
              value={vm.mostrarResenas}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          {/* Permitir guardar en favoritos */}
          <View style={styles.settingRow}>
            <MaterialCommunityIcons name="heart-outline" size={24} color={PURPLE} style={styles.icon} />
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Permitir guardar en favoritos</Text>
              <Text style={styles.settingDesc}>
                Permite que los clientes puedan añadir tu perfil a su lista de profesionales favoritos.
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#d3d3d3', true: '#d0b3f0' }}
              thumbColor={vm.permitirFavoritos ? PURPLE : '#f4f3f4'}
              onValueChange={vm.togglePermitirFavoritos}
              value={vm.permitirFavoritos}
              disabled={vm.saving}
            />
          </View>
        </View>
      </ScrollView>

      <FloatingBackButton hideOnMobile />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F8',
  },
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  headerBanner: {
    height: 70,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: 20,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  description: {
    fontSize: 13.5,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.06)' } as any,
      default: { elevation: 3, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 },
    }),
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
  },
  icon: {
    marginRight: 12,
  },
  settingInfo: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#222',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12.5,
    color: '#777',
    lineHeight: 17,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F0F4',
  },
});
