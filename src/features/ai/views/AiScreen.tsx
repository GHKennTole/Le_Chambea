import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainLayout from '../../../shared/components/MainLayout';
import { useAiController, RecommendedProfessional } from '../controllers/useAiController';

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";
const GRAY_BG = "#F6F6F8";

export default function AiScreen() {
  const { messages, loading, input, setInput, handleSend } = useAiController();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  // Auto-scroll al final del chat cuando llega un mensaje nuevo
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, loading]);

  // Render message text with simple markdown parsing for bold (**) and list elements
  const renderMessageText = (text: string, isUser: boolean) => {
    if (!text) return null;
    
    // Replace raw asterisks/dashes at the start of a list item with a clean bullet point
    const cleanText = text.replace(/^\s*[\*\-]\s+/gm, '• ');
    const parts = cleanText.split('**');
    
    return (
      <Text style={[styles.messageText, isUser ? styles.userText : styles.botText]}>
        {parts.map((part, index) => {
          const isBold = index % 2 === 1;
          return (
            <Text 
              key={index} 
              style={isBold ? { fontWeight: 'bold' } : undefined}
            >
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

  // Renderiza una tarjeta individual de profesional recomendado
  const renderProfessionalCard = (pro: RecommendedProfessional) => {
    return (
      <View key={pro.id} style={styles.proCard}>
        <View style={styles.proHeader}>
          <Image source={{ uri: pro.foto }} style={styles.proAvatar} />
          <View style={styles.proMeta}>
            <Text style={styles.proName} numberOfLines={1}>
              {pro.nombre}
            </Text>
            <View style={styles.badgeContainer}>
              <Text style={styles.badgeText}>{pro.profesion}</Text>
            </View>
          </View>
        </View>

        {/* Calificación por estrellas */}
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={16} color="#FFB020" />
          <Text style={styles.ratingText}>
            {pro.calificacion > 0 ? `${pro.calificacion} (${pro.totalResenas} reseñas)` : 'Nuevo (Sin reseñas)'}
          </Text>
        </View>

        <Text style={styles.proDesc} numberOfLines={2}>
          {pro.descripcion || 'Sin descripción detallada.'}
        </Text>

        <TouchableOpacity 
          style={styles.proButton}
          onPress={() => navigation.navigate('PublicProfile', { professionalId: pro.usuario_id })}
        >
          <MaterialCommunityIcons name="account-search-outline" size={16} color="white" />
          <Text style={styles.proButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <MainLayout active="AI">
      <KeyboardAvoidingView 
        style={styles.container}
        behavior="height"
        keyboardVerticalOffset={0}
      >
        {/* Cabecera de Chamby - siempre fija arriba */}
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerAvatarContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.onlineBadge} />
          </View>
          <View>
            <Text style={styles.headerTitle}>Sula AI</Text>
            <Text style={styles.headerSubtitle}>Asistente técnico interactivo</Text>
          </View>
        </View>

        {/* Zona de Mensajes del Chat */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <View 
                key={msg.id} 
                style={[
                  styles.messageRow, 
                  isUser ? styles.userRow : styles.botRow
                ]}
              >
                {/* Avatar para respuestas de Sula */}
                {!isUser && (
                  <Image 
                    source={require('../../../assets/images/logo.png')} 
                    style={styles.botAvatarImage} 
                    resizeMode="contain"
                  />
                )}

                <View style={styles.bubbleContainer}>
                  <View 
                    style={[
                      styles.bubble, 
                      isUser ? styles.userBubble : styles.botBubble
                    ]}
                  >
                    {renderMessageText(msg.text, isUser)}
                  </View>

                  {/* Renderizar Carrusel Horizontal de Profesionales Recomendados */}
                  {msg.professionals && msg.professionals.length > 0 && (
                    <View style={styles.recommendationSection}>
                      <Text style={styles.recommendationTitle}>
                        Profesionales sugeridos por Sula:
                      </Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.proCarousel}
                      >
                        {msg.professionals.map(renderProfessionalCard)}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            );
          })}

          {/* Indicador de escritura animado */}
          {loading && (
            <View style={[styles.messageRow, styles.botRow]}>
              <Image 
                source={require('../../../assets/images/logo.png')} 
                style={styles.botAvatarImage} 
                resizeMode="contain"
              />
              <View style={[styles.bubble, styles.botBubble, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={PURPLE} />
                <Text style={styles.loadingText}>Sula está analizando tu caso...</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input bar inferior */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Pregúntale a Sula sobre tu problema..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.disabledSendButton]}
            onPress={handleSend}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECF1',
    backgroundColor: 'white',
    ...Platform.select({
      web: { boxShadow: '0px 2px 3px rgba(0,0,0,0.05)' } as any,
      default: {
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }
    }),
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: LIGHT_PURPLE,
    padding: 2,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#04B45F',
    borderWidth: 1.5,
    borderColor: 'white',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#888888',
  },
  contentWrapper: {
    flex: 1,
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
  },
  chatContent: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 24,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 20,
    width: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  botRow: {
    justifyContent: 'flex-start',
  },
  botAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  botAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginTop: 4,
    backgroundColor: LIGHT_PURPLE,
    padding: 3,
  },
  bubbleContainer: {
    maxWidth: '85%',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userBubble: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 2,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: '#ECECF1',
    ...Platform.select({
      web: { boxShadow: '0px 1px 2px rgba(0,0,0,0.05)' } as any,
      default: {
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      }
    }),
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#333333',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: '#ECECF1',
    backgroundColor: 'white',
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#333',
    maxHeight: 100,
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledSendButton: {
    backgroundColor: '#C5B3D8',
  },
  recommendationSection: {
    marginTop: 10,
    width: '100%',
  },
  recommendationTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#666666',
    marginBottom: 8,
    paddingLeft: 4,
  },
  proCarousel: {
    gap: 12,
    paddingBottom: 5,
  },
  proCard: {
    width: 250,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ECECF1',
    padding: 14,
    ...Platform.select({
      web: { boxShadow: '0px 2px 4px rgba(0,0,0,0.05)' } as any,
      default: {
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      }
    }),
  },
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  proAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#EEE',
  },
  proMeta: {
    flex: 1,
  },
  proName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
    backgroundColor: LIGHT_PURPLE,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 10,
    color: PURPLE,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '600',
  },
  proDesc: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
    marginBottom: 12,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 8,
    gap: 6,
  },
  proButtonText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  }
});