import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';

const PURPLE = '#5A2D82';
const PURPLE_ACCENT = '#5A2D82';
const PURPLE_LIGHT = '#F3ECFA';

export default function SupportScreen() {
  const insets = useSafeAreaInsets();

  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(err => console.error("Error al abrir URL:", err));
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Morado Dinámico que solo agarra el título */}
        <View style={[styles.purpleHeaderWrapper, { paddingTop: insets.top + 16 }]}>
          <View style={styles.headerSection}>
            <MaterialCommunityIcons name="headset" size={28} color="white" />
            <Text style={styles.headerTitle}>Soporte y Atención</Text>
          </View>
        </View>

        <View style={styles.bodyContent}>
          {/* Banner de Bienvenida Original */}
          <View style={styles.heroCard}>
            <View style={styles.heroIconCircle}>
              <MaterialCommunityIcons name="lifebuoy" size={32} color={PURPLE} />
            </View>
            <Text style={styles.heroTitle}>¿En qué podemos ayudarte?</Text>
            <Text style={styles.heroSubtitle}>
              Estamos aquí para resolver tus dudas, atender sugerencias o ayudarte con cualquier problema en Le Chambea.
            </Text>
          </View>

          {/* Sección: Canales Directos */}
          <Text style={styles.sectionTitle}>Contacto Directo</Text>
          
          <View style={styles.cardsContainer}>
            {/* Correo Electrónico */}
            <TouchableOpacity 
              style={styles.contactCard} 
              activeOpacity={0.8}
              onPress={() => handleOpenURL('mailto:soporte.lechambea@gmail.com')}
            >
              <View style={[styles.iconWrap, { backgroundColor: PURPLE_LIGHT }]}>
                <MaterialCommunityIcons name="email-outline" size={26} color={PURPLE} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Correo de Soporte</Text>
                <Text style={styles.cardDetail}>soporte.lechambea@gmail.com</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>

            {/* WhatsApp */}
            <TouchableOpacity 
              style={styles.contactCard} 
              activeOpacity={0.8}
              onPress={() => handleOpenURL('https://wa.link/a4ykuy')}
            >
              <View style={[styles.iconWrap, { backgroundColor: '#E8F9EE' }]}>
                <MaterialCommunityIcons name="whatsapp" size={26} color="#25D366" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>WhatsApp Oficial</Text>
                <Text style={styles.cardDetail}>Atención rápida y personalizada</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Sección: Redes Sociales */}
          <Text style={styles.sectionTitle}>Redes Sociales</Text>
          
          <View style={styles.cardsContainer}>
            {/* Facebook */}
            <View style={[styles.contactCard, styles.cardDisabled]}>
              <View style={[styles.iconWrap, { backgroundColor: '#F0F0F5' }]}>
                <MaterialCommunityIcons name="facebook" size={26} color="#999" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: '#777' }]}>Facebook</Text>
                <Text style={styles.cardDetail}>Próximamente disponible</Text>
              </View>
              <View style={styles.outOfServiceBadge}>
                <Text style={styles.outOfServiceBadgeText}>Fuera de servicio</Text>
              </View>
            </View>

            {/* Instagram */}
            <View style={[styles.contactCard, styles.cardDisabled]}>
              <View style={[styles.iconWrap, { backgroundColor: '#F0F0F5' }]}>
                <MaterialCommunityIcons name="instagram" size={26} color="#999" />
              </View>
              <View style={styles.cardInfo}>
                <Text style={[styles.cardTitle, { color: '#777' }]}>Instagram</Text>
                <Text style={styles.cardDetail}>Próximamente disponible</Text>
              </View>
              <View style={styles.outOfServiceBadge}>
                <Text style={styles.outOfServiceBadgeText}>Fuera de servicio</Text>
              </View>
            </View>
          </View>

          {/* Horario de Atención */}
          <View style={styles.scheduleCard}>
            <MaterialCommunityIcons name="clock-outline" size={22} color={PURPLE} />
            <View style={styles.scheduleInfo}>
              <Text style={styles.scheduleTitle}>Horario de Atención de la Administración</Text>
              <Text style={styles.scheduleText}>Lunes a Viernes: 8:00 AM - 6:00 PM</Text>
            </View>
          </View>

          <View style={{ height: insets.bottom + 40 }} />
        </View>
      </ScrollView>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F6F8',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  purpleHeaderWrapper: {
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingHorizontal: 20,
    paddingBottom: 16,
    width: '100%',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.2)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  bodyContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 800 : '100%',
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(0,0,0,0.04)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      }
    })
  },
  heroIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: PURPLE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#222',
    marginBottom: 6,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 320,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#6B6B76',
    marginBottom: 10,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardsContainer: {
    gap: 10,
    marginBottom: 24,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 2px 6px rgba(0,0,0,0.03)' } as any,
      default: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
      }
    })
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  cardDetail: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  cardDisabled: {
    backgroundColor: '#FAFAFC',
  },
  outOfServiceBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  outOfServiceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PURPLE_LIGHT,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#DDD4EE',
  },
  scheduleInfo: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: PURPLE,
  },
  scheduleText: {
    fontSize: 12,
    color: '#555',
    marginTop: 2,
  },
});
