import React from 'react';
import { View } from 'react-native';
import Screen1 from './views/Screen1';
import Screen2 from './views/Screen2';
import Screen3 from './views/Screen3';
import Screen4 from './views/Screen4';
import { useOnboardingController } from './controllers/useOnboardingController';

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

const TOTAL_STEPS = 4;

export default function OnboardingNavigator({ onComplete }: OnboardingNavigatorProps) {
  const { currentStep, handleNext, handleSkip } = useOnboardingController(TOTAL_STEPS, onComplete);

  const renderScreen = () => {
    switch (currentStep) {
      case 0:
        return (
          <Screen1
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
            onSkip={handleSkip}
          />
        );
      case 1:
        return (
          <Screen2
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <Screen3
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
          />
        );
      case 3:
        return (
          <Screen4
            currentStep={currentStep}
            totalSteps={TOTAL_STEPS}
            onNext={handleNext}
          />
        );
      default:
        return null;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}