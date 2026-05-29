import type { NavigatorScreenParams } from '@react-navigation/native';

export type RegisterStackParamList = {
  RegisterWelcome: undefined;
  RegisterName: undefined;
  RegisterBirth: undefined;
  RegisterGender: undefined;
  RegisterAuth: undefined;
  RegisterSuccess: undefined;
};

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: NavigatorScreenParams<RegisterStackParamList> | undefined;
  Onboarding: undefined;
  Home: undefined;
  AI: undefined;
  Favorites: undefined;
  Menu: undefined;
  ForgotPassword: undefined;
  Profile: undefined;
  MyProfile: undefined;
  ProfessionalProfile: undefined;
  Reviews: { userId?: string };
  WriteReview: { professionalId: string; profileId?: string; jobId: string };
  Search: undefined;
  PublicProfile: { id: string; professionalProfileId?: string; fromChat?: boolean };
  ChatList: undefined;
  Chat: { chatId: string, otherUserId: string };
  Security: undefined;
  Privacy: undefined;
  Support: undefined;
  Terms: undefined;
  HomeAdmin: undefined;
};
