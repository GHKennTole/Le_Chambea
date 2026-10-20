import React, { useRef, useEffect, useState } from "react";
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
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAdminAiAuditController, AuditMessage } from "../controllers/useAdminAiAuditController";
import { RecommendedProfessional } from "../../ai/controllers/useAiController";
import { useResponsive } from "../../../shared/hooks/useResponsive";

const PURPLE = "#5A2D82";
const LIGHT_PURPLE = "#F3ECFA";

export default function AdminAiAuditScreen() {
  const { messages, loading, input, setInput, handleSend } = useAdminAiAuditController();
  const navigation = useNavigation<any>();
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { isLargeScreen } = useResponsive();

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [webHeight, setWebHeight] = useState<number | null>(null);
  const [aiInputHeight, setAiInputHeight] = useState(42);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setKeyboardVisible(true);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }, 80);
      }
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        setKeyboardVisible(false);
      }
    );

    // Web visualViewport detection to lock container height on mobile browsers
    let handleViewportResize: (() => void) | undefined;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      handleViewportResize = () => {
        const vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
        setWebHeight(vh);
        const isKb =
          !isLargeScreen &&
          ((window.innerHeight - vh > 120) ||
            (typeof window.screen !== "undefined" &&
              window.screen.height - vh > 200 &&
              vh < window.innerHeight * 0.85));
        setKeyboardVisible(isKb);
        if (window.scrollY !== 0 || window.scrollX !== 0) {
          window.scrollTo(0, 0);
        }
      };

      handleViewportResize();

      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", handleViewportResize);
        window.visualViewport.addEventListener("scroll", handleViewportResize);
      }
      window.addEventListener("resize", handleViewportResize);
      window.addEventListener("scroll", handleViewportResize);
    }

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      if (Platform.OS === "web" && typeof window !== "undefined" && handleViewportResize) {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener("resize", handleViewportResize);
          window.visualViewport.removeEventListener("scroll", handleViewportResize);
        }
        window.removeEventListener("resize", handleViewportResize);
        window.removeEventListener("scroll", handleViewportResize);
      }
    };
  }, [isLargeScreen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: false });
    }, 80);
    return () => clearTimeout(timer);
  }, [messages, loading]);

  const onSendPress = () => {
    if (!input.trim() || loading) return;
    setAiInputHeight(42);
    handleSend();
  };

  const handleKeyPress = (e: any) => {
    if (Platform.OS === "web" && e.nativeEvent?.key === "Enter" && !e.shiftKey) {
      e.preventDefault?.();
      onSendPress();
    }
  };

  // Render markdown-like text
  const renderMessageText = (text: string, isAdmin: boolean) => {
    if (!text) return null;
    const cleanText = text.replace(/^\s*[\*\-]\s+/gm, "• ");
    const parts = cleanText.split("**");

    return (
      <Text style={[styles.messageText, isAdmin ? styles.adminText : styles.botText]}>
        {parts.map((part, index) => {
          const isBold = index % 2 === 1;
          return (
            <Text key={index} style={isBold ? { fontWeight: "bold" } : undefined}>
              {part}
            </Text>
          );
        })}
      </Text>
    );
  };

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

        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={15} color="#FFB020" />
          <Text style={styles.ratingText}>
            {pro.calificacion > 0 ? `${pro.calificacion} (${pro.totalResenas} reseñas)` : "Nuevo (Sin reseñas)"}
          </Text>
        </View>

        <Text style={styles.proDesc} numberOfLines={2}>
          {pro.descripcion || "Sin descripción detallada."}
        </Text>

        <TouchableOpacity 
          style={styles.proButton}
          onPress={() => navigation.navigate("PublicProfile", { 
            id: pro.usuario_id || pro.id,
            professionalProfileId: pro.id 
          })}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="account-search-outline" size={16} color="white" />
          <Text style={styles.proButtonText}>Ver Perfil</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View 
      style={[
        styles.container,
        !isLargeScreen && { paddingTop: insets.top },
        Platform.OS !== "web" && {
          paddingBottom: keyboardHeight > 0 ? (keyboardHeight + (Platform.OS === "android" && insets.bottom > 0 ? insets.bottom : 0)) : 0,
        },
        Platform.OS === "web" && ({
          position: (!isLargeScreen && keyboardVisible) ? "fixed" : "relative",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          height: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : "100dvh") : "100%",
          maxHeight: (!isLargeScreen && keyboardVisible) ? (webHeight ? `${webHeight}px` : "100dvh") : "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          zIndex: (!isLargeScreen && keyboardVisible) ? 100 : 1,
        } as any)
      ]}
    >
      <View style={[styles.mainWrapper, isLargeScreen && styles.mainWrapperDesktop]}>
        {/* Cabecera Morada Dinámica de Sula AI - Modo Auditoría */}
        <View style={[styles.header, { paddingTop: 14 }]}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("HomeAdmin");
              }
            }}
            style={styles.backBtn}
            activeOpacity={0.7}
            accessibilityLabel="Volver al panel"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="white" />
          </TouchableOpacity>

          <View style={styles.headerAvatarContainer}>
          <Image 
            source={require("../../../assets/images/logo.png")} 
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View style={styles.onlineBadge} />
        </View>

        <View style={styles.headerTextContainer}>
          <View style={styles.headerTitleRow}>
            <Text style={styles.headerTitle}>Sula AI</Text>
            <View style={styles.aiPill}>
              <MaterialCommunityIcons name="shield-bug" size={12} color={PURPLE} />
              <Text style={styles.aiPillText}>Modo Auditoría</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Entorno de pruebas</Text>
        </View>
      </View>

      {/* Mensajes del Chat */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={[styles.chatContent, { maxWidth: isLargeScreen ? 950 : "100%" }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m) => {
          const isAdmin = m.sender === "admin";

          return (
            <View key={m.id} style={[styles.msgWrapper, isAdmin ? styles.msgWrapperAdmin : styles.msgWrapperBot]}>
              {!isAdmin && (
                <Image 
                  source={require("../../../assets/images/logo.png")} 
                  style={styles.botAvatarImage} 
                  resizeMode="contain"
                />
              )}

              <View style={[styles.bubbleContainer, { maxWidth: isLargeScreen ? "80%" : "85%" }]}>
                <View style={[styles.bubble, isAdmin ? styles.bubbleAdmin : styles.bubbleBot]}>
                  {renderMessageText(m.text, isAdmin)}
                </View>

                {/* Perfiles recomendados si los hay */}
                {m.professionals && m.professionals.length > 0 && (
                  <View style={styles.prosContainer}>
                    <Text style={styles.prosTitle}>
                      {m.professionals.length > 1
                        ? "Perfiles Encontrados en Supabase (" + m.professionals.length + "):"
                        : "Perfil Encontrado en Supabase:"}
                    </Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.proCarousel}
                    >
                      {m.professionals.map(renderProfessionalCard)}
                    </ScrollView>
                  </View>
                )}

                {/* Drawer de Metadatos de Auditoría */}
                {m.auditMeta && (
                  <View style={styles.auditMetaBox}>
                    <View style={styles.metaHeader}>
                      <MaterialCommunityIcons name="code-json" size={14} color="#8E44AD" />
                      <Text style={styles.metaHeaderTitle}>Diagnóstico de Inferencia</Text>
                    </View>
                    <View style={styles.metaGrid}>
                      {m.auditMeta.searchQuery && (
                        <Text style={styles.metaItemText}>
                          🔍 Query DB: <Text style={styles.metaBold}>"{m.auditMeta.searchQuery}"</Text> ({m.auditMeta.resultsCount} perfiles)
                        </Text>
                      )}
                      <Text style={styles.metaItemText}>
                        ⚡ Latencia: <Text style={styles.metaBold}>{(m.auditMeta.latencyMs / 1000).toFixed(2)}s</Text>
                      </Text>
                      {m.auditMeta.tokensEstimated && (
                        <Text style={styles.metaItemText}>
                          📊 Tokens est.: <Text style={styles.metaBold}>{m.auditMeta.tokensEstimated}</Text>
                        </Text>
                      )}
                    </View>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {loading && (
          <View style={[styles.msgWrapper, styles.msgWrapperBot]}>
            <Image 
              source={require("../../../assets/images/logo.png")} 
              style={styles.botAvatarImage} 
              resizeMode="contain"
            />
            <View style={[styles.bubble, styles.bubbleBot, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={PURPLE} />
              <Text style={styles.loadingText}>Procesando diagnóstico con Gemini...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar Inferior con espacio para botones de navegación del sistema */}
      <View style={[
        styles.inputArea,
        { 
          paddingBottom: Platform.OS === "web" 
            ? (keyboardVisible ? 10 : Math.max(insets.bottom, 12)) 
            : (keyboardVisible ? 10 : (insets.bottom > 0 ? insets.bottom : 12)) 
        }
      ]}>
        <TextInput
          style={[
            styles.input,
            Platform.OS === "web" && ({
              height: aiInputHeight,
              outlineStyle: "none",
              resize: "none",
              overflowY: aiInputHeight >= 120 ? "auto" : "hidden",
            } as any)
          ]}
          placeholder="Escribe un prompt de prueba o consulta..."
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
          onSubmitEditing={onSendPress}
          blurOnSubmit={false}
          onKeyPress={handleKeyPress}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={onSendPress}
          disabled={!input.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <MaterialCommunityIcons name="send" size={20} color="white" />
          )}
        </TouchableOpacity>
      </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F6F7FA",
    ...Platform.select({
      web: {
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
      } as any,
    }),
  },
  mainWrapper: {
    flex: 1,
    width: "100%",
  },
  mainWrapperDesktop: {
    maxWidth: 1100,
    width: "100%",
    alignSelf: "center",
    marginTop: 20,
    marginBottom: 20,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#EAEAEA",
    ...Platform.select({
      web: {
        boxShadow: "0px 6px 24px rgba(0, 0, 0, 0.08)",
      } as any,
    }),
  },
  backBtn: {
    padding: 6,
    marginRight: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: PURPLE,
    zIndex: 10,
    flexShrink: 0,
    ...Platform.select({
      web: { boxShadow: "0px 4px 12px rgba(90,45,130,0.2)" } as any,
      default: {
        elevation: 4,
        shadowColor: PURPLE,
        shadowOpacity: 0.2,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 8,
      },
    }),
  },
  headerAvatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  headerLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    padding: 3,
  },
  onlineBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#04B45F",
    borderWidth: 2,
    borderColor: PURPLE,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: "flex-start",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "white",
  },
  aiPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: LIGHT_PURPLE,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 4,
  },
  aiPillText: {
    fontSize: 10.5,
    fontWeight: "800",
    color: PURPLE,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "rgba(255,255,255,0.9)",
    marginTop: 1,
  },
  chatScroll: {
    flex: 1,
    backgroundColor: "#F9F9FB",
  },
  chatContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 24,
    width: "100%",
    alignSelf: "center",
  },
  msgWrapper: {
    flexDirection: "row",
    marginBottom: 16,
    width: "100%",
  },
  msgWrapperAdmin: {
    justifyContent: "flex-end",
  },
  msgWrapperBot: {
    justifyContent: "flex-start",
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
    maxWidth: "85%",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  bubbleAdmin: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 2,
  },
  bubbleBot: {
    backgroundColor: "white",
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: "#ECECF1",
    ...Platform.select({
      web: { boxShadow: "0px 1px 2px rgba(0,0,0,0.05)" } as any,
      default: {
        elevation: 1,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
      },
    }),
  },
  messageText: {
    fontSize: 14.5,
    lineHeight: 21,
  },
  adminText: {
    color: "white",
  },
  botText: {
    color: "#333333",
  },
  prosContainer: {
    marginTop: 10,
    width: "100%",
  },
  prosTitle: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#666666",
    marginBottom: 8,
    paddingLeft: 4,
  },
  proCarousel: {
    gap: 12,
    paddingBottom: 4,
  },
  proCard: {
    width: 240,
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#ECECF1",
    padding: 12,
    ...Platform.select({
      web: { boxShadow: "0px 2px 4px rgba(0,0,0,0.05)" } as any,
      default: {
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
    }),
  },
  proHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  proAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: "#F3F3F5",
  },
  proMeta: {
    flex: 1,
  },
  proJob: {
    fontSize: 13.5,
    fontWeight: "bold",
    color: "#111111",
    marginBottom: 2,
  },
  proName: {
    fontSize: 12,
    fontWeight: "normal",
    color: "#666666",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 11.5,
    color: "#666666",
    fontWeight: "600",
  },
  proDesc: {
    fontSize: 11.5,
    color: "#666666",
    lineHeight: 15,
    marginBottom: 10,
  },
  proButton: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    paddingVertical: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  proButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  auditMetaBox: {
    backgroundColor: "#F5EFFB",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#8E44AD",
    gap: 4,
  },
  metaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaHeaderTitle: {
    fontSize: 10.5,
    fontWeight: "bold",
    color: "#8E44AD",
    letterSpacing: 0.5,
  },
  metaGrid: {
    gap: 3,
    marginTop: 2,
  },
  metaItemText: {
    fontSize: 11,
    color: "#444444",
  },
  metaBold: {
    fontWeight: "bold",
    color: "#111111",
  },
  loadingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: {
    color: "#666666",
    fontSize: 13.5,
    fontStyle: "italic",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#ECECF1",
    backgroundColor: "white",
    gap: 10,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    backgroundColor: "#F3F3F5",
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    fontSize: 14.5,
    color: "#333",
    minHeight: 42,
    maxHeight: 120,
    ...Platform.select({
      web: { outlineStyle: "none" } as any,
    }),
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#C5B3D8",
  },
});
