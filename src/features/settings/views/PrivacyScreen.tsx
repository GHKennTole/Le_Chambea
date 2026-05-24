import React from 'react';
import { View, Text, StyleSheet, Switch, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { usePrivacyController } from '../controllers/usePrivacyController';

const PURPLE = '#5A2D82';

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const vm = usePrivacyController();

  if (vm.loading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Privacidad</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Controla qué información personal es visible para otros usuarios dentro de la plataforma.
        </Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mostrar mi número de teléfono</Text>
              <Text style={styles.settingDesc}>Permite que otros vean tu número de contacto.</Text>
            </View>
            <Switch
              trackColor={{ false: "#d3d3d3", true: "#d0b3f0" }}
              thumbColor={vm.mostrarTelefono ? PURPLE : "#f4f3f4"}
              onValueChange={vm.toggleMostrarTelefono}
              value={vm.mostrarTelefono}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Mostrar mi correo electrónico</Text>
              <Text style={styles.settingDesc}>Permite que otros vean tu correo de contacto.</Text>
            </View>
            <Switch
              trackColor={{ false: "#d3d3d3", true: "#d0b3f0" }}
              thumbColor={vm.mostrarCorreo ? PURPLE : "#f4f3f4"}
              onValueChange={vm.toggleMostrarCorreo}
              value={vm.mostrarCorreo}
              disabled={vm.saving}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Perfil Público</Text>
              <Text style={styles.settingDesc}>Aparecer en los resultados de búsqueda de servicios.</Text>
            </View>
            <Switch
              trackColor={{ false: "#d3d3d3", true: "#d0b3f0" }}
              thumbColor={vm.perfilPublico ? PURPLE : "#f4f3f4"}
              onValueChange={vm.togglePerfilPublico}
              value={vm.perfilPublico}
              disabled={vm.saving}
            />
          </View>
        </View>
      </View>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F8' },
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  header: { height: 60, backgroundColor: PURPLE, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  description: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  settingCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: { flex: 1, paddingRight: 16 },
  settingTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  settingDesc: { fontSize: 13, color: '#888' },
  divider: { height: 1, backgroundColor: '#F0F0F0', marginVertical: 4 },
});
