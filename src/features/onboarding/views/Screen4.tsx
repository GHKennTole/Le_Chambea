import React from 'react';
import { ImageSourcePropType } from 'react-native';
import OnboardingScreen from './OnboardingScreen';

interface Screen4Props {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
}

export default function Screen4({ currentStep, totalSteps, onNext }: Screen4Props) {
  const imageSource: ImageSourcePropType = require('../../../assets/images/onboarding44.png');

  return (
    <OnboardingScreen
      title="Comienza Ahora"
      description="Crea tu perfil, explora oportunidades y comienza a conectar con la comunidad de Le Chambea."
      imageSource={imageSource}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
    />
  );
}