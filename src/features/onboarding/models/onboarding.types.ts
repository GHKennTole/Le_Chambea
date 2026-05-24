export interface OnboardingScreenProps {
  title: string;
  descripcion: string;
  imageSource: any;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
}
