import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

import { COLORS } from '../../../core/theme/colors';

interface OnboardingScreenProps {
  title: string;
  description: string;
  imageSource: any;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}

export default function OnboardingScreen({
  title,
  description,
  imageSource,
  currentStep,
  totalSteps,
  onNext,
  onSkip,
  showSkip = false,
}: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 18),
        },
      ]}
    >
      {/* Header con botón de saltar (opcional) */}
      {showSkip && onSkip && (
        <View style={[styles.header, { marginTop: 10 }]}>
          <TouchableOpacity
            onPress={onSkip}
            style={styles.skipButton}
            activeOpacity={0.8}
          >
            <Text style={styles.skipText}>Saltar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 🔥 Body con espacio bien distribuido */}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>

        <View style={styles.imageBox}>
          <Image source={imageSource} style={styles.image} resizeMode="contain" />
        </View>

        <Text style={styles.descripcion}>{description}</Text>
      </View>

      {/* Bottom fijo */}
      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={onNext}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>
            {currentStep === totalSteps - 1 ? 'Comenzar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>

        <View style={styles.dotsContainer}>
          {Array.from({ length: totalSteps }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },

  header: {
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
  },

  /* ✅ AQUÍ ESTÁ LA MAGIA */
  body: {
    flex: 1,
    paddingHorizontal: 24,
    alignItems: 'center',

    // distribuye mejor el espacio vertical
    justifyContent: 'space-evenly',

    paddingTop: 10,
  },

  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 0,
  },

  imageBox: {
    width: '100%',
    maxWidth: 360,
    height: Math.min(width * 0.72, 300),
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },

  descripcion: {
    fontSize: 20,
    color: '#555',
    textAlign: 'center',
    lineHeight: 28,
    marginTop: 0,
  },

  bottom: {
    paddingHorizontal: 24,
    paddingTop: 8,
  },

  nextButton: {
    backgroundColor: COLORS.purpleLight,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.purpleLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 6,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 6,
  },
  activeDot: {
    backgroundColor: COLORS.purpleLight,
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  inactiveDot: {
    backgroundColor: COLORS.purpleMuted,
  },
});
