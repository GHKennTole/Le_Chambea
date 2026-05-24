import React from 'react';
import { ImageSourcePropType } from 'react-native';
import OnboardingScreen from './OnboardingScreen';

interface Screen1Props {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip?: () => void;
}

export default function Screen1({ currentStep, totalSteps, onNext, onSkip }: Screen1Props) {
  // Usa tu logo/mascota - ajusta la ruta
  const imageSource: ImageSourcePropType = require('../../../assets/images/onboarding11.png');

  return (
    <OnboardingScreen
      title="¡Bienvenid@ a Le Chambea!"
      description="Descubre servicios disponibles en tu zona. ¡Para todo lo que necesites y todo en un solo lugar!"
      imageSource={imageSource}
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onSkip={onSkip}
      showSkip={true}
    />
  );
}