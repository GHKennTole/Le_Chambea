import type { NavigatorScreenParams } from '@react-navigation/native';

export type RegisterStackParamList = {
  RegisterWelcome: undefined;
  RegisterUsers: undefined;
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
  JobHistory: undefined;
  Reviews: { userId?: string };
  WriteReview: { professionalId?: string; profileId?: string; jobId?: string; reviewId?: string };
  MyReviews: undefined;
  PublicProfile: { id: string; professionalProfileId?: string; fromChat?: boolean; professionalId?: string };
  ChatList: undefined;
  Chat: { chatId: string, otherUserId: string };
  Security: undefined;
  Support: undefined;
  Terms: undefined;
  HomeAdmin: undefined;
  AdminAiAudit: undefined;
  AdminUserDirectory?: { users?: any[] };
  AdminUserDetail?: { userId?: string; user?: any };
  AdminServiceDetail: { id: string; professionalProfileId?: string };
};
