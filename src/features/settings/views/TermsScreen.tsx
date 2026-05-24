import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';

const PURPLE = '#5A2D82';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Términos y Políticas</Text>
      </View>

      <ScrollView 
        style={styles.scroll} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lastUpdated}>Última actualización: 13 de Mayo de 2026</Text>

        <Text style={styles.paragraph}>
          Bienvenido a <Text style={styles.bold}>Le Chambea</Text>. Al acceder y utilizar nuestra plataforma móvil, usted ("Usuario", "Cliente" o "Profesional") acepta someterse a los siguientes Términos de Servicio y Políticas de Privacidad. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar la aplicación.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Condiciones de Servicio</Text>
          <Text style={styles.paragraph}>
            Le Chambea actúa exclusivamente como un intermediario tecnológico que facilita la conexión entre clientes que requieren servicios y profesionales independientes capacitados para brindarlos. No somos empleadores de los profesionales registrados.
          </Text>
          <Text style={styles.bullet}>• Todo acuerdo comercial o de servicio se establece directamente entre el cliente y el profesional.</Text>
          <Text style={styles.bullet}>• El usuario se compromete a proporcionar información veraz al momento de registrarse y solicitar servicios.</Text>
          <Text style={styles.bullet}>• Nos reservamos el derecho de suspender o eliminar cuentas que incurran en comportamiento fraudulento o acoso.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Política de Privacidad y Datos</Text>
          <Text style={styles.paragraph}>
            Su privacidad es de suma importancia. Le Chambea recopila datos personales como nombre, correo electrónico y ubicación geográfica únicamente para facilitar la conexión de los servicios y mejorar la experiencia de usuario.
          </Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Cifrado:</Text> Las contraseñas y comunicaciones internas están cifradas mediante protocolos de seguridad estándar de la industria.</Text>
          <Text style={styles.bullet}>• <Text style={styles.bold}>Terceros:</Text> No vendemos, alquilamos ni compartimos sus datos personales con terceros para fines de marketing sin su consentimiento expreso.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Responsabilidad y Garantías</Text>
          <Text style={styles.paragraph}>
            Le Chambea no asume responsabilidad directa por la calidad, seguridad o legalidad de los servicios prestados por los profesionales independientes. Sin embargo, mantenemos un sistema de calificaciones y revisiones estricto. Cualquier profesional que mantenga calificaciones por debajo de nuestros estándares de calidad podrá ser removido permanentemente de la plataforma.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Propiedad Intelectual</Text>
          <Text style={styles.paragraph}>
            Todo el contenido, diseño, logotipos, código fuente y material gráfico de la aplicación son propiedad exclusiva de Le Chambea. Queda estrictamente prohibida su reproducción o distribución sin autorización legal previa.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Si tiene alguna pregunta sobre estos Términos, comuníquese con nuestro departamento legal a través del módulo de Soporte de la aplicación.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      <FloatingBackButton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F6F6F8' 
  },
  header: { 
    height: 60, 
    backgroundColor: PURPLE, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  headerTitle: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    backgroundColor: 'white',
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  lastUpdated: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: PURPLE,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  paragraph: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
    textAlign: 'justify',
  },
  bullet: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginLeft: 8,
    marginBottom: 4,
  },
  bold: {
    fontWeight: 'bold',
    color: '#222',
  },
  footerText: {
    marginTop: 32,
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingHorizontal: 10,
  }
});
