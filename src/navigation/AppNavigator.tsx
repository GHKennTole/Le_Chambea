import React, { useEffect, useRef, useState } from "react";
import {
  NavigationContainer,
  createNavigationContainerRef,
  CommonActions,
  type LinkingOptions,
} from "@react-navigation/native";
import * as Linking from "expo-linking";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Platform, BackHandler, ToastAndroid } from "react-native";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../services/supabase";
import type { RootStackParamList } from "../core/navigation/types";
import {
  recordTabVisit,
  popPreviousTab,
  resetTabHistory,
  isMainTab,
} from "./navigationHistory";

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
import ProfileScreen from "../features/perfil/views/ProfileScreen";
import MyProfileScreen from "../features/perfil/views/MyProfileScreen";
import ProfessionalProfileScreen from "../features/inicio/views/ProfessionalProfileScreen";
import JobHistoryScreen from "../features/perfil/views/JobHistoryScreen";
import ReviewsScreen from "../features/perfil/views/ReviewsScreen";
import WriteReviewScreen from "../features/perfil/views/WriteReviewScreen";
import MyReviewsScreen from "../features/perfil/views/MyReviewsScreen";
import SecurityScreen from "../features/settings/views/SecurityScreen";
import SupportScreen from "../features/settings/views/SupportScreen";
import TermsScreen from "../features/settings/views/TermsScreen";
import PublicProfileScreen from "../features/inicio/views/PublicProfileScreen";
import ChatListScreen from "../features/chat/views/ChatListScreen";
import ChatScreen from "../features/chat/views/ChatScreen";
import HomeAdminScreen from "../features/admin/views/HomeAdminScreen";
import AdminAiAuditScreen from "../features/admin/views/AdminAiAuditScreen";
import AdminUserDirectoryScreen from "../features/admin/views/AdminUserDirectoryScreen";
import AdminUserDetailScreen from "../features/admin/views/AdminUserDetailScreen";
import AdminServiceDetailScreen from "../features/admin/views/AdminServiceDetailScreen";
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
          RegisterUsers: "register/datos",
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
      PublicProfile: "public-profile/:id",
      ChatList: "chats",
      Chat: "chat/:chatId/:otherUserId",
      Security: "security",
      Support: "support",
      Terms: "terms",
      HomeAdmin: "admin",
      AdminAiAudit: "admin/ai-audit",
      AdminUserDirectory: "admin/users",
      AdminUserDetail: "admin/user/:userId?",
      AdminServiceDetail: "admin/service/:id",
    },
  },
};

function OnboardingScreen({ onComplete }: { onComplete: () => void }) {
  return <OnboardingNavigator onComplete={onComplete} />;
}

export default function AppNavigator() {
  const [session, setSession] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>("Welcome");
  const [isAdmin, setIsAdmin] = useState(false);

  const getUserProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("usuarios")
        .select("rol, onboarding_completado")
        .eq("id", userId)
        .maybeSingle();

      const role = profile?.rol?.toLowerCase();
      const admin = role === "admin" || role === "administrador";
      let route: keyof RootStackParamList = "Home";
      if (admin) {
        route = "HomeAdmin";
      } else if (profile?.onboarding_completado === false) {
        route = "Onboarding";
      }
      return { profile, isAdmin: admin, targetRoute: route };
    } catch (e) {
      console.error("Error fetching user role / onboarding status:", e);
      return { profile: null, isAdmin: false, targetRoute: "Home" as keyof RootStackParamList };
    }
  };

  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        const user = currentSession?.user ? currentSession.user : null;

        if (user) {
          const { isAdmin: admin, targetRoute } = await getUserProfile(user.id);
          if (isMounted) {
            setIsAdmin(admin);
            setInitialRoute(targetRoute);
            setSession(user);
            resetTabHistory(targetRoute);
          }
        } else {
          if (isMounted) {
            setIsAdmin(false);
            setInitialRoute("Welcome");
            setSession(null);
            resetTabHistory("Welcome");
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

      // Si el usuario está actualmente en el flujo de Registro, no cambiamos la sesión
      // para permitir ver la pantalla de confirmación (RegisterSuccess) y que inicie sesión limpiamente
      const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
      if (currentRoute?.name && currentRoute.name.startsWith("Register")) {
        return;
      }

      if (event === "SIGNED_IN" && user) {
        const { isAdmin: admin, targetRoute } = await getUserProfile(user.id);
        setIsAdmin(admin);
        setInitialRoute(targetRoute);
        setSession(user);
        resetTabHistory(targetRoute);

        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigationRef.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: targetRoute }],
              })
            );
          }
        }, 50);
      } else if (event === "SIGNED_OUT") {
        setIsAdmin(false);
        setSession(null);
        setInitialRoute("Welcome");
        resetTabHistory("Welcome");

        setTimeout(() => {
          if (navigationRef.isReady()) {
            navigationRef.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: "Welcome" }],
              })
            );
          }
        }, 50);
      } else if (event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        // En refresco de token o actualización de datos, solo actualizar el usuario en memoria
        // NUNCA reiniciar la navegación para no borrar la pantalla donde estaba el usuario
        if (user) {
          setSession(user);
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Manejo del botón de Atrás del sistema en Android
  useEffect(() => {
    if (Platform.OS !== "android") return;

    let lastBackPressTime = 0;

    const onBackPress = () => {
      if (!navigationRef.isReady()) return false;

      // 1. Si la pila nativa puede retroceder (de una subpantalla a la pantalla anterior)
      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
        return true;
      }

      // 2. Si la pila nativa no puede retroceder más, revisar si hay una pestaña o pantalla previa visitada
      const currentRoute = navigationRef.getCurrentRoute();
      const currentRouteName = currentRoute?.name;

      const prevTab = popPreviousTab();
      if (prevTab && prevTab !== currentRouteName) {
        navigationRef.navigate(prevTab as any);
        return true;
      }

      // 3. Si estamos en la pantalla base (Home / HomeAdmin / Welcome) y no hay historial previo:
      // Prevenir salir por accidente o redirigir a Login: requerir doble toque para salir de la app
      const now = Date.now();
      if (now - lastBackPressTime < 2000) {
        BackHandler.exitApp();
        return true;
      }

      lastBackPressTime = now;
      ToastAndroid.show("Presiona atrás una vez más para salir", ToastAndroid.SHORT);
      return true;
    };

    const backSub = BackHandler.addEventListener("hardwareBackPress", onBackPress);
    return () => backSub.remove();
  }, []);

  const handleOnboardingComplete = () => {
    resetTabHistory("Home");
    if (navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: "Home" }],
        })
      );
    }
  };

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      linking={linking}
      onStateChange={() => {
        const currentRoute = navigationRef.isReady() ? navigationRef.getCurrentRoute() : null;
        if (currentRoute?.name && isMainTab(currentRoute.name)) {
          recordTabVisit(currentRoute.name);
        }
      }}
    >
      <GlobalFloatingAlert />
      <Stack.Navigator
        key={session ? `auth-${session.id}-${isAdmin ? "admin" : "user"}` : "guest"}
        id="RootStack"
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        {session ? (
          // Rutas para usuarios autenticados: NUNCA incluye Login ni Welcome en el stack
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="AI" component={AiScreen} />
            <Stack.Screen name="Favorites" component={FavoritesScreen} />
            <Stack.Screen name="Menu" component={MenuScreen} />
            <Stack.Screen name="Onboarding">
              {() => <OnboardingScreen onComplete={handleOnboardingComplete} />}
            </Stack.Screen>
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="MyProfile" component={MyProfileScreen} />
            <Stack.Screen name="ProfessionalProfile" component={ProfessionalProfileScreen} />
            <Stack.Screen name="JobHistory" component={JobHistoryScreen} />
            <Stack.Screen name="Reviews" component={ReviewsScreen} />
            <Stack.Screen name="WriteReview" component={WriteReviewScreen} />
            <Stack.Screen name="MyReviews" component={MyReviewsScreen} />
            <Stack.Screen name="Security" component={SecurityScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
            <Stack.Screen name="PublicProfile" component={PublicProfileScreen} />
            <Stack.Screen name="ChatList" component={ChatListScreen} />
            <Stack.Screen name="Chat" component={ChatScreen} />
            {isAdmin && (
              <>
                <Stack.Screen name="HomeAdmin" component={HomeAdminScreen} options={{ animation: "none" }} />
                <Stack.Screen name="AdminAiAudit" component={AdminAiAuditScreen} options={{ animation: "none" }} />
                <Stack.Screen name="AdminUserDirectory" component={AdminUserDirectoryScreen} options={{ animation: "none" }} />
                <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} options={{ animation: "none" }} />
                <Stack.Screen name="AdminServiceDetail" component={AdminServiceDetailScreen} options={{ animation: "none" }} />
              </>
            )}
          </>
        ) : (
          // Rutas para usuarios no autenticados
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterNavigator} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="Support" component={SupportScreen} />
            <Stack.Screen name="Terms" component={TermsScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
