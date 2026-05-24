import React from 'react';
import { ImageSourcePropType } from 'react-native';
import OnboardingScreen from './OnboardingScreen';

interface Screen3Props {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
}

export default function Screen3({ currentStep, totalSteps, onNext }: Screen3Props) {
  const imageSource: ImageSourcePropType = require('../../../assets/images/onboarding33.png');

  return (
    <OnboardingScreen
      title="Contrata Talentos"
      description="¿Necesitas ayuda con un proyecto? Encuentra profesionales calificados para cualquier tarea."
      imageSource={imageSource}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
    />
  );
}