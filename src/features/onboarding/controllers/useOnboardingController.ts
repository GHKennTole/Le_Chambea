import { useState } from 'react';
import { supabase } from '../../../services/supabase';

export function useOnboardingController(totalSteps: number, onComplete: () => void) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = async () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('usuarios').upsert({
            id: user.id,
            onboarding_completado: true,
          });
        }
        onComplete();
      } catch (error) {
        console.error('Error guardando en Supabase:', error);
        onComplete();
      }
    }
  };

  const handleSkip = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('usuarios').upsert({
          id: user.id,
          onboarding_completado: true,
        });
      }
      onComplete();
    } catch (error) {
      console.error('Error:', error);
      onComplete();
    }
  };

  return {
    currentStep,
    handleNext,
    handleSkip,
  };
}
