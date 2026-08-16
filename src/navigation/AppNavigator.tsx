import React, { useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
  CommonActions,
  type LinkingOptions,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import type { RootStackParamList } from "../core/navigation/types";

import SplashScreen from "../features/splash/views/SplashScreen";
import WelcomeScreen from "../features/auth/views/WelcomeScreen";
import LoginScreen from "../features/auth/views/LoginScreen";
import HomeScreen from "../features/inicio/views/HomeScreen";
import OnboardingNavigator from "../features/onboarding/OnboardingNavigator";
import AiScreen from "../features/ai/views/AiScreen";
import FavoritesScreen from "../features/favoritos/views/FavoritesScreen";
import MenuScreen from "../features/settings/views/MenuScreen";
import RegisterNavigator from "../features/register/RegisterNavigator";
import ForgotPasswordScreen from "../features/auth/views/ForgotPasswordScreen";
import ProfileScreen from '../features/perfil/views/ProfileScreen';
import MyProfileScreen from '../features/perfil/views/MyProfileScreen';
import ProfessionalProfileScreen from '../features/inicio/views/ProfessionalProfileScreen';
import JobHistoryScreen from '../features/perfil/views/JobHistoryScreen';
import ReviewsScreen from '../features/perfil/views/ReviewsScreen';
import WriteReviewScreen from '../features/perfil/views/WriteReviewScreen';
import MyReviewsScreen from '../features/perfil/views/MyReviewsScreen';
import SecurityScreen from '../features/settings/views/SecurityScreen';
import PrivacyScreen from '../features/settings/views/PrivacyScreen';
import SupportScreen from '../features/settings/views/SupportScreen';
import TermsScreen from '../features/settings/views/TermsScreen';
import SearchScreen from "../features/inicio/views/SearchScreen";
import PublicProfileScreen from "../features/inicio/views/PublicProfileScreen";
import ChatListScreen from "../features/chat/views/ChatListScreen";
import ChatScreen from "../features/chat/views/ChatScreen";
import HomeAdminScreen from "../features/admin/views/HomeAdminScreen";
import AdminAiAuditScreen from "../features/admin/views/AdminAiAuditScreen";
import GlobalFloatingAlert from "../shared/components/GlobalFloatingAlert";

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [Linking.createURL("/"), "/"],
  config: {
    screens: {
      Welcome: "welcome",
      Login: "login",
      Register: {
        screens: {
          RegisterWelcome: "register",
          RegisterName: "register/name",
          RegisterBirth: "register/birth",
          RegisterGender: "register/gender",
          RegisterAuth: "register/auth",
          RegisterSuccess: "register/success",
        },
      },
      Onboarding: "onboarding",
      Home: "home",
      AI: "ai",
      Favorites: "favorites",
      Menu: "menu",
      ForgotPassword: "forgot-password",
      Profile: "profile",
      MyProfile: "my-profile",
      ProfessionalProfile: "professional-profile",
      JobHistory: "job-history",
      Reviews: "reviews/:userId?",
      WriteReview: "write-review",
      MyReviews: "my-reviews",
      Search: "search",
      PublicProfile: "public-profile/:id",
      ChatList: "chats",
      Chat: "chat/:chatId/:otherUserId",
      Security: "security",
      Privacy: "privacy",
      Support: "support",
      Terms: "terms",
      HomeAdmin: "admin",
      AdminAiAudit: "admin/ai-audit",
    },
  },
};

function resetTo(routeName: keyof RootStackParamList) {
  if (navigationRef.isReady()) {
    navigationRef.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName }],
      })
    );
  }
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return <OnboardingNavigator onComplete={onComplete} />;
}

export default function AppNavigator() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Welcome");
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const pendingResetRef = useRef<(keyof RootStackParamList) | null>(null);

  const getTargetRouteForUser = async (userId: string): Promise<keyof RootStackParamList> => {
    try {
      const { data: profile } = await supabase
        .from("usuarios")
        .select("rol")
        .eq("id", userId)
        .maybeSingle();

      const role = profile?.rol?.toLowerCase();
      if (role === "admin" || role === "administrador") {
        return "HomeAdmin";
      }
    } catch (e) {
      console.error("Error fetching user role:", e);
    }
    return "Home";
  };

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const user = currentSession?.user ? currentSession.user : null;
        if (isMounted) setSession(user);

        if (user) {
          const targetRoute = await getTargetRouteForUser(user.id);
          if (isMounted) {
            setInitialRoute(targetRoute);
            pendingResetRef.current = targetRoute;
          }
        }
      } catch (e) {
        console.error("Error in initSession:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    initSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      const user = currentSession?.user ? currentSession.user : null;
      setSession(user);

      if (user && (event === "SIGNED_IN" || event === "INITIAL_SESSION" || event === "USER_UPDATED" || event === "TOKEN_REFRESHED")) {
        const targetRoute = await getTargetRouteForUser(user.id);
        pendingResetRef.current = targetRoute;
        if (navigationRef.isReady()) {
          pendingResetRef.current = null;
          resetTo(targetRoute);
        }
      } else if (event === "SIGNED_OUT") {
        pendingResetRef.current = "Welcome";
        if (navigationRef.isReady()) {
          pendingResetRef.current = null;
          resetTo("Welcome");
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onReady={() => {
        const pending = pendingResetRef.current;
        if (pending) {
          pendingResetRef.current = null;
          resetTo(pending);
        }
      }}
    >
      <GlobalFloatingAlert />
      <Stack.Navigator id="RootStack" initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterNavigator} />
        <Stack.Screen name="Onboarding">
          {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
        </Stack.Screen>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="AI" component={AiScreen} />
        <Stack.Screen name="Favorites" component={FavoritesScreen} />
        <Stack.Screen name="Menu" component={MenuScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="MyProfile" component={MyProfileScreen} />
        <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
        <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
        <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="HomeAdmin" component={HomeAdminScreen} />
        <Stack.Screen name="AdminAiAudit" component={AdminAiAuditScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
