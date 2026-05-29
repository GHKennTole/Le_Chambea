import React, { useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
  CommonActions,
} from "@react-navigation/native";
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
import ReviewsScreen from '../features/perfil/views/ReviewsScreen';
import WriteReviewScreen from '../features/perfil/views/WriteReviewScreen';
import SecurityScreen from '../features/settings/views/SecurityScreen';
import PrivacyScreen from '../features/settings/views/PrivacyScreen';
import SupportScreen from '../features/settings/views/SupportScreen';
import TermsScreen from '../features/settings/views/TermsScreen';
import SearchScreen from "../features/inicio/views/SearchScreen";
import PublicProfileScreen from "../features/inicio/views/PublicProfileScreen";
import ChatListScreen from "../features/chat/views/ChatListScreen";
import ChatScreen from "../features/chat/views/ChatScreen";
import HomeAdminScreen from "../features/admin/views/HomeAdminScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

function resetTo(routeName: keyof RootStackParamList) {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [{ name: routeName }],
    })
  );
}

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return <OnboardingNavigator onComplete={onComplete} />;
}

export default function AppNavigator() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [showOnboarding, setShowOnboarding] = useState<boolean | null>(null);

  const lastResetRef = useRef<string>("");
  const pendingResetRef = useRef<keyof RootStackParamList | null>(null);

  const queueReset = (routeName: keyof RootStackParamList, uid?: string) => {
    const key = `${uid ?? "no-user"}:${String(routeName)}`;
    if (lastResetRef.current === key) return;
    lastResetRef.current = key;

    if (navigationRef.isReady()) {
      resetTo(routeName);
      return;
    }

    pendingResetRef.current = routeName;
  };

  const checkUserStatus = async (currentUser: User) => {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('onboarding_completado, rol')
        .eq('id', currentUser.id)
        .single();

      if (error || !data) {
        return { mustOnboard: true, rol: 'usuario' };
      }
      return {
        mustOnboard: data.onboarding_completado !== true,
        rol: data.rol ?? 'usuario'
      };
    } catch (error) {
      console.error("❌ Error consultando Supabase:", error);
      return { mustOnboard: false, rol: 'usuario' };
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setInitializing(false), 2000);

    supabase.auth.getSession().then(({ data: { session } }) => {
      handleAuthChange(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleAuthChange(session?.user ?? null);
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleAuthChange = async (currentUser: User | null) => {
    setUser(currentUser);

    if (!currentUser) {
      setShowOnboarding(null);
      queueReset("Welcome");
      return;
    }

    const routeName = navigationRef.isReady()
      ? navigationRef.getCurrentRoute()?.name
      : undefined;

    if (routeName && String(routeName).startsWith("Register")) {
      setShowOnboarding(false);
      return;
    }

    setShowOnboarding(null);
    const { mustOnboard, rol } = await checkUserStatus(currentUser);

    if (rol === 'admin') {
      setShowOnboarding(false);
      queueReset("HomeAdmin", currentUser.id);
    } else {
      setShowOnboarding(mustOnboard);
      queueReset(mustOnboard ? "Onboarding" : "Home", currentUser.id);
    }
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    resetTo("Home");
  };

  if (initializing || (user && showOnboarding === null)) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        const pending = pendingResetRef.current;
        if (pending) {
          pendingResetRef.current = null;
          resetTo(pending);
        }
      }}
    >
      <Stack.Navigator id="RootStack" screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="Reviews" component={ReviewsScreen} />
        <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
        <Stack.Screen name="Security" component={SecurityScreen} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
        <Stack.Screen name="Terms" component={TermsScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
        <Stack.Screen name="HomeAdmin" component={HomeAdminScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
