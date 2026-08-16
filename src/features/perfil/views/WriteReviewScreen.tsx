import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';
import { useWriteReviewController } from '../controllers/useWriteReviewController';
import { useResponsive } from '../../../shared/hooks/useResponsive';

const PURPLE = '#5A2D82';
const STAR_COLOR = '#FFB800';

export default function WriteReviewScreen({ route }: any) {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { isLargeScreen } = useResponsive();
  const professionalProfileId = route.params?.profileId;
  const jobId = route.params?.jobId;
  const reviewId = route.params?.reviewId;
  const professionalId = route.params?.professionalId;

  const vm = useWriteReviewController(professionalProfileId, jobId, reviewId, professionalId);

  if (vm.fetching) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={PURPLE} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.headerBanner} />
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>{vm.isEditing ? 'Editar Reseña' : 'Dejar Reseña'}</Text>
            <Text style={styles.headerSubtitle}>
              {vm.isEditing ? 'Modifica tu calificación y comentario' : 'Califica el servicio recibido'}
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.label}>Calificación General</Text>
            <View style={styles.starsContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity 
                  key={star} 
                  onPress={() => vm.setRating(star)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons 
                    name={star <= vm.rating ? "star" : "star-outline"} 
                    size={48} 
                    color={STAR_COLOR} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.divider} />

            <Text style={styles.label}>Comentario (Opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Escribe tu experiencia con el profesional..."
              placeholderTextColor="#aaa"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              value={vm.comment}
              onChangeText={vm.setComment}
            />
          </View>

          <TouchableOpacity 
            style={[styles.submitButton, vm.loading && styles.submitButtonDisabled]}
            onPress={() => vm.submitReview(() => navigation.goBack())}
            disabled={vm.loading}
            activeOpacity={0.8}
          >
            {vm.loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.submitButtonText}>{vm.isEditing ? 'Guardar Cambios' : 'Enviar Reseña'}</Text>
            )}
          </TouchableOpacity>

        </ScrollView>
        <FloatingBackButton />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F6F8' },
  container: { flex: 1, backgroundColor: '#F6F6F8' },
  headerBanner: { position: 'absolute', top: 0, left: 0, right: 0, height: 180, backgroundColor: PURPLE, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  scrollContent: { 
    paddingHorizontal: 16, 
    paddingTop: 20,
    width: '100%',
    maxWidth: 800,
    alignSelf: 'center',
  },
  headerSection: { alignItems: 'center', marginBottom: 24, paddingTop: 10 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: 'white', marginBottom: 6 },
  headerSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  card: { backgroundColor: 'white', borderRadius: 20, padding: 20, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#555', marginBottom: 16, textAlign: 'center' },
  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24 },
  divider: { height: 1, backgroundColor: '#EEE', marginBottom: 20 },
  input: { backgroundColor: '#F9F9F9', borderRadius: 12, padding: 16, fontSize: 15, color: '#333', minHeight: 100, borderWidth: 1, borderColor: '#ECECF1' },
  submitButton: { backgroundColor: PURPLE, borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 24, elevation: 4, shadowColor: PURPLE, shadowOpacity: 0.3, shadowOffset: { width: 0, height: 4 }, shadowRadius: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});
