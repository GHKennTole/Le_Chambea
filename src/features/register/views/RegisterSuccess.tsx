import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Animated, Image } from "react-native";
import { Button } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../../services/supabase";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RegisterStackParamList, RootStackParamList } from "../../../core/navigation/types";

type RegisterNav = NativeStackNavigationProp<RegisterStackParamList, "RegisterSuccess">;

type ConfettiPiece = {
  leftPct: number;
  size: number;
  delay: number;
  rotate: number;
};

export default function RegisterSuccess() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RegisterNav>();
  const [leaving, setLeaving] = useState(false);

  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;
  const birdY = useRef(new Animated.Value(10)).current;
  const confettiT = useRef(new Animated.Value(0)).current;

  const confetti: ConfettiPiece[] = useMemo(() => {
    const pieces: ConfettiPiece[] = [];
    const count = 18;
    for (let i = 0; i < count; i++) {
      pieces.push({
        leftPct: i * (100 / count),
        size: 8 + Math.floor(Math.random() * 8),
        delay: Math.floor(Math.random() * 600),
        rotate: -30 + Math.random() * 60,
      });
    }
    return pieces;
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 90, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(birdY, { toValue: -10, duration: 600, useNativeDriver: true }),
        Animated.timing(birdY, { toValue: 10, duration: 600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(confettiT, { toValue: 1, duration: 2400, useNativeDriver: true })
    ).start();
  }, [fade, scale, birdY, confettiT]);

  const goWelcome = async () => {
    if (leaving) return;
    setLeaving(true);

    try {
      await supabase.auth.signOut();
    } catch {}

    const rootNav = navigation.getParent<NativeStackNavigationProp<RootStackParamList>>();

    rootNav?.reset({
      index: 0,
      routes: [{ name: "Welcome" }],
    });
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[styles.overlay, { opacity: fade }]} />

      <Animated.View style={[styles.card, { opacity: fade, transform: [{ scale }] }]}>
        <View style={styles.confettiBox} pointerEvents="none">
          {confetti.map((p, i) => {
            const t = Animated.modulo(Animated.add(confettiT, p.delay / 2400), 1);
            const y = t.interpolate({
              inputRange: [0, 1],
              outputRange: [-30, 200],
            });
            const r = t.interpolate({
              inputRange: [0, 1],
              outputRange: [`${p.rotate}deg`, `${-p.rotate}deg`],
            });
            return (
              <Animated.View
                key={i}
                style={[
                  styles.confetti,
                  {
                    left: `${p.leftPct}%`,
                    width: p.size,
                    height: p.size * 0.6,
                    transform: [{ translateY: y }, { rotate: r }],
                  },
                  i % 4 === 0 && styles.c1,
                  i % 4 === 1 && styles.c2,
                  i % 4 === 2 && styles.c3,
                  i % 4 === 3 && styles.c4,
                ]}
              />
            );
          })}
        </View>

        <Animated.View style={[styles.imageWrap, { transform: [{ translateY: birdY }] }]}>
          <Image
            source={require("../../../assets/images/congrats.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </Animated.View>

        <Text style={styles.title}>¡Cuenta creada con éxito!</Text>

        <Text style={styles.subtitle}>
          Bienvenido a <Text style={styles.brand}>LE CHAMBEA</Text>
          {"\n"}Inicia sesión y comienza cuando quieras 💜
        </Text>

        <Button
          mode="contained"
          onPress={goWelcome}
          buttonColor="#816ab4"
          textColor="white"
          style={styles.btn}
          contentStyle={styles.btnContent}
          loading={leaving}
          disabled={leaving}
        >
          Continuar
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  card: {
    width: "94%",
    maxWidth: 460,
    backgroundColor: "#fff",
    borderRadius: 26,
    paddingVertical: 34,
    paddingHorizontal: 22,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#c3e6cb",
    overflow: "hidden",
  },
  confettiBox: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  confetti: {
    position: "absolute",
    top: 10,
    borderRadius: 4,
  },
  c1: { backgroundColor: "#FFD166" },
  c2: { backgroundColor: "#EF476F" },
  c3: { backgroundColor: "#06D6A0" },
  c4: { backgroundColor: "#118AB2" },
  imageWrap: {
    width: "100%",
    height: 220,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  image: {
    width: "95%",
    height: "100%",
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: "#1f7a33",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2f2f2f",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 18,
  },
  brand: {
    fontWeight: "900",
    color: "#5b5c9c",
  },
  btn: {
    width: "100%",
    borderRadius: 300,
    marginTop: 6,
  },
  btnContent: {
    paddingVertical: 10,
  },
});
