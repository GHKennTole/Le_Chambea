import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FloatingBackButton from '../../../shared/components/FloatingBackButton';

const PURPLE = '#5A2D82';


export default function SupportScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Soporte</Text>
      </View>

      <WebView
        source={{ uri: "https://www.chatbase.co/chatbot-iframe/-QlL83YfQjPr1Q6HAeGbu" }}
        style={styles.webview}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={PURPLE} />
            <Text style={styles.loadingText}>Conectando con soporte...</Text>
          </View>
        )}
      />

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
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F6F6F8',
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 14,
  }
});
