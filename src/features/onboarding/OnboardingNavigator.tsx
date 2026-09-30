import React from 'react';
import { View } from 'react-native';
import OnboardingScreen from './views/OnboardingScreen';
import { useOnboardingController } from './controllers/useOnboardingController';

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: '¡Bienvenid@ a Le Chambea!',
    description: 'Descubre servicios disponibles en tu zona. ¡Para todo lo que necesites y todo en un solo lugar!',
    imageSource: require('../../assets/images/onboarding11.png'),
    showSkip: true,
  },
  {
    title: 'Encuentra Trabajo',
    description: 'Publica tus habilidades y encuentra trabajos que se ajusten a tu perfil. Miles de oportunidades te esperan.',
    imageSource: require('../../assets/images/onboarding22.png'),
    showSkip: false,
  },
  {
    title: 'Contrata Talentos',
    description: '¿Necesitas ayuda con un proyecto? Encuentra profesionales calificados para cualquier tarea.',
    imageSource: require('../../assets/images/onboarding33.png'),
    showSkip: false,
  },
  {
    title: 'Comienza Ahora',
    description: 'Crea tu perfil, explora oportunidades y comienza a conectar con la comunidad de Le Chambea.',
    imageSource: require('../../assets/images/onboarding44.png'),
    showSkip: false,
  },
];

export default function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  const { currentStep, handleNext, handleSkip } = useOnboardingController(
    ONBOARDING_STEPS.length,
    onComplete
  );

  const step = ONBOARDING_STEPS[currentStep] || ONBOARDING_STEPS[0];

  return (
    <View style={{ flex: 1 }}>
      <OnboardingScreen
        title={step.title}
        description={step.description}
        imageSource={step.imageSource}
        currentStep={currentStep}
        totalSteps={ONBOARDING_STEPS.length}
        onNext={handleNext}
        onSkip={step.showSkip ? handleSkip : undefined}
        showSkip={step.showSkip}
      />
    </View>
  );
}