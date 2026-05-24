import React from 'react';
import { ImageSourcePropType } from 'react-native';
import OnboardingScreen from './OnboardingScreen';

interface Screen2Props {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
}

export default function Screen2({ currentStep, totalSteps, onNext }: Screen2Props) {
  // Puedes usar diferentes imágenes para cada pantalla
  const imageSource: ImageSourcePropType = require('../../../assets/images/onboarding22.png');

  return (
    <OnboardingScreen
      title="Encuentra Trabajo"
      description="Publica tus habilidades y encuentra trabajos que se ajusten a tu perfil. Miles de oportunidades te esperan."
      imageSource={imageSource}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
    />
  );
}