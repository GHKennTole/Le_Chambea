import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  ActivityIndicator, 
  Image, 
  Keyboard, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MainLayout from '../../../shared/components/MainLayout';
import { useAiController, RecommendedProfessional } from '../controllers/useAiController';
import { useResponsive } from '../../../shared/hooks/useResponsive';
import ReportAiModal from '../../../shared/components/ReportAiModal';

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";
const GRAY_BG = "#F6F6F8";

const ContainerComponent = View;

export default function AiScreen() {
  const { messages, loading, input, setInput, handleSend, reportAiIssue } = useAiController();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { height: windowHeight, isLargeScreen } = useResponsive();

  const [showReportModal, setShowReportModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [webHeight, setWebHeight] = useState<number | null>(null);
  const [aiInputHeight, setAiInputHeight] = useState(42);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 80);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    // Web visualViewport detection to lock container height on mobile browsers
    let handleViewportResize: (() => void) | undefined;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      handleViewportResize = () => {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        setWebHeight(vh);
        const isKb = !isLargeScreen && ((window.innerHeight - vh > 120) || (typeof window.screen !== 'undefined' && window.screen.height - vh > 200 && vh < window.innerHeight * 0.85));
        setKeyboardVisible(isKb);
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      };

      handleViewportResize();

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportResize);
        window.visualViewport.addEventListener('scroll', handleViewportResize);
      }
      window.addEventListener('resize', handleViewportResize);
      window.addEventListener('scroll', handleViewportResize);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (Platform.OS === 'web' && typeof window !== 'undefined' && handleViewportResize) {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportResize);
          window.visualViewport.removeEventListener('scroll', handleViewportResize);
        }
        window.removeEventListener('resize', handleViewportResize);
        window.removeEventListener('scroll', handleViewportResize);
      }
    };
  }, [isLargeScreen]);

  const handleOpenReportModal = () => {
    setShowReportModal(true);
  };

  const getFullConversationForReport = (): string => {
    const chatHistory = messages.filter(m => m.id !== 'welcome');
    if (chatHistory.length === 0) return '';
    return chatHistory
      .map(m => `${m.sender === 'user' ? 'Usuario' : 'Sula AI'}: ${m.text}`)
      .join('\n\n');
  };

  const handleReportSubmit = async (reason: string, description?: string): Promise<boolean> => {
    const fullChat = getFullConversationForReport();
    return await reportAiIssue(reason, description, fullChat);
  };

  const onSendPress = () => {
    if (!input.trim() || loading) return;
    setAiInputHeight(42);
    handleSend();
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === 'web' && e.nativeEvent?.key === 'Enter' && !e.shiftKey) {
      e.preventDefault?.();
      onSendPress();
    }
  };

  const handleFocus = () => {
    if (Platform.OS === 'web') {
      if (!isLargeScreen) {
        setKeyboardVisible(true);
      }
      if (typeof window !== 'undefined') {
        setTimeout(() => {
          window.scrollTo(0, 0);
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 50);
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 200);
      }
    }
  };

  const handleBlur = () => {
    if (Platform.OS === 'web') {
      setTimeout(() => {
        if (!isLargeScreen && typeof window !== 'undefined' && window.visualViewport) {
          const vh = window.visualViewport.height;
          const isKb = window.innerHeight - vh > 120;
          setKeyboardVisible(isKb);
        } else {
          setKeyboardVisible(false);
        }
      }, 150);
    }
  };

  // Auto-scroll al final del chat cuando llega un mensaje nuevo o cambia el estado
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 80);
    return () => clearTimeout(timer);
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
            <Text style={styles.proJob} numberOfLines={1}>
              {pro.profesion}
            </Text>
            <Text style={styles.proName} numberOfLines={1}>
              {pro.nombre}
            </Text>
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
          onPress={() => navigation.navigate('PublicProfile', { 
            id: pro.usuario_id, 
            professionalProfileId: pro.id 
          })}
        >
          <MaterialCommunityIcons name="account-search-outline" size={16} color="white" />
          <Text style={styles.proButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <MainLayout active="AI" hideBottomNav={!isLargeScreen && keyboardVisible}>
      <ContainerComponent 
        style={[
          styles.container,
          !isLargeScreen && { paddingTop: insets.top },
          Platform.OS !== 'web' && {
            paddingBottom: keyboardHeight > 0 ? (keyboardHeight + (Platform.OS === 'android' && insets.bottom > 0 ? insets.bottom : 0)) : 0,
          },
          Platform.OS === 'web' && ({
            position: (!isLargeScreen && keyboardVisible) ? 'fixed' : 'relative',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            height: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : '100dvh') : '100%',
            maxHeight: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : '100dvh') : '100%',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            zIndex: (!isLargeScreen && keyboardVisible) ? 100 : 1,
          } as any)
        ]}
      >
        {/* Cabecera Morada Dinámica de Sula AI - fija arriba */}
        <View style={[styles.header, { paddingTop: 14 }]}>
          <View style={styles.headerAvatarContainer}>
            <Image 
              source={require('../../../assets/images/logo.png')} 
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.onlineBadge} />
          </View>
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>Sula AI</Text>
              <View style={styles.aiPill}>
                <MaterialCommunityIcons name="creation" size={12} color={PURPLE} />
                <Text style={styles.aiPillText}>Asistente</Text>
              </View>
            </View>
            <Text style={styles.headerSubtitle}>Asistente técnico interactivo 24/7</Text>
          </View>
          
          <TouchableOpacity
            style={styles.reportHeaderBtn}
            onPress={handleOpenReportModal}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#FFA8A8" />
          </TouchableOpacity>
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

                  {/* Renderizar Tarjeta o Carrusel de Profesional Recomendado */}
                  {msg.professionals && msg.professionals.length > 0 && (
                    <View style={styles.recommendationSection}>
                      <Text style={styles.recommendationTitle}>
                        {msg.professionals.length > 1
                          ? "Profesionales sugeridos por Sula:"
                          : "Profesional sugerido por Sula:"}
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
        <View style={[styles.inputArea, { paddingBottom: Platform.OS === 'web' ? 10 : (keyboardVisible ? 10 : 8) }]}>
          <TextInput
            style={[
              styles.input,
              Platform.OS === 'web' && ({
                height: aiInputHeight,
                outlineStyle: 'none',
                resize: 'none',
                overflowY: aiInputHeight >= 120 ? 'auto' : 'hidden',
              } as any)
            ]}
            placeholder="Pide ayuda a Sula..."
            placeholderTextColor="#999"
            value={input}
            onChangeText={(val) => {
              setInput(val);
              if (!val.trim()) {
                setAiInputHeight(42);
              }
            }}
            onContentSizeChange={(e) => {
              const h = e.nativeEvent?.contentSize?.height;
              if (h) {
                setAiInputHeight(Math.max(42, Math.min(120, h)));
              }
            }}
            multiline
            maxLength={500}
            autoComplete="off"
            autoCorrect={false}
            spellCheck={false}
            textContentType="none"
            {...(Platform.OS === 'web' ? ({
              'data-autocomplete': 'off',
              'data-form-type': 'other',
              'data-lpignore': 'true',
              'data-1p-ignore': 'true',
              name: 'ai_message_input',
              id: 'ai_message_input',
            } as any) : {})}
            onSubmitEditing={onSendPress}
            blurOnSubmit={false}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !input.trim() && styles.disabledSendButton]}
            onPress={onSendPress}
            disabled={!input.trim() || loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <MaterialCommunityIcons name="send" size={20} color="white" />
            )}
          </TouchableOpacity>
        </View>
      </ContainerComponent>

      {/* Modal: Reportar Mal Funcionamiento de Sula AI 🚨 */}
      <ReportAiModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        onSubmit={handleReportSubmit}
      />
    </MainLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    ...Platform.select({
      web: {
        height: '100%',
        minHeight: 0,
        overflow: 'hidden',
      } as any
    })
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: PURPLE,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    zIndex: 10,
    flexShrink: 0,
    ...Platform.select({
      web: { boxShadow: '0px 4px 12px rgba(90,45,130,0.2)' } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      }
    }),
  },
  headerAvatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'white',
    padding: 3,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#04B45F',
    borderWidth: 2,
    borderColor: PURPLE,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: 'white',
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3ECFA',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  aiPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: PURPLE,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 1,
  },
  contentWrapper: {
    flex: 1,
    ...Platform.select({
      web: { minHeight: 0 } as any
    })
  },
  chatArea: {
    flex: 1,
    backgroundColor: '#F9F9FB',
    ...Platform.select({
      web: { minHeight: 0 } as any
    })
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
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ECECF1',
    backgroundColor: 'white',
    gap: 8,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: '#F3F3F5',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 10 : (Platform.OS === 'android' ? 8 : 10),
    paddingBottom: Platform.OS === 'ios' ? 10 : (Platform.OS === 'android' ? 8 : 10),
    fontSize: 14.5,
    lineHeight: 20,
    minHeight: 42,
    maxHeight: 120,
    color: '#333',
    textAlignVertical: 'center',
    ...Platform.select({
      web: { outlineStyle: 'none' } as any
    })
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 0,
    marginBottom: 0,
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
  proJob: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  proName: {
    fontSize: 13,
    fontWeight: 'normal',
    color: '#666',
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
  },

  reportHeaderBtn: { 
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});