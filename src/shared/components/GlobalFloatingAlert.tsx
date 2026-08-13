import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type AlertType = 'danger' | 'warning' | 'success';

export interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  type: AlertType;
  buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[];
}

type AlertListener = (state: AlertState) => void;
const listeners: Set<AlertListener> = new Set();

export function triggerGlobalAlert(state: AlertState) {
  listeners.forEach((listener) => listener(state));
}

export default function GlobalFloatingAlert() {
  const insets = useSafeAreaInsets();
  const [alert, setAlert] = useState<AlertState>({
    visible: false,
    title: '',
    message: '',
    type: 'danger',
  });

  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (state: AlertState) => {
      setAlert(state);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: Platform.OS !== 'web',
      }).start();

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        hideAlert();
      }, 5000);
    };

    listeners.add(handler);
    return () => {
      listeners.delete(handler);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const hideAlert = (onDone?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(anim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: Platform.OS !== 'web',
    }).start(({ finished }) => {
      if (finished) {
        setAlert((prev) => ({ ...prev, visible: false }));
        onDone?.();
      }
    });
  };

  if (!alert.visible) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const isSuccess = alert.type === 'success';
  const isWarning = alert.type === 'warning';
  const isDanger = alert.type === 'danger';

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.overlay,
        {
          top: Math.max(insets.top, 12) + 8,
          opacity: anim,
          transform: [{ translateY }],
        },
      ]}
    >
      <View
        style={[
          styles.card,
          isSuccess && styles.cardSuccess,
          isWarning && styles.cardWarning,
          isDanger && styles.cardDanger,
        ]}
      >
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>{alert.title}</Text>
          <TouchableOpacity
            onPress={() => hideAlert()}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        {!!alert.message && <Text style={styles.messageText}>{alert.message}</Text>}

        {alert.buttons && alert.buttons.length > 0 && (
          <View style={styles.btnRow}>
            {alert.buttons.map((btn, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  styles.btn,
                  btn.style === 'cancel' ? styles.btnCancel : styles.btnPrimary,
                ]}
                onPress={() => {
                  hideAlert(() => btn.onPress?.());
                }}
              >
                <Text
                  style={[
                    styles.btnText,
                    btn.style === 'cancel' ? styles.btnCancelText : styles.btnPrimaryText,
                  ]}
                >
                  {btn.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 999999,
    elevation: 999999,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#333',
    flex: 1,
  },
  messageText: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    color: '#444',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#555',
  },
  cardDanger: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c6cb',
  },
  cardWarning: {
    backgroundColor: '#fff3cd',
    borderColor: '#ffeeba',
  },
  cardSuccess: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  btn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  btnPrimary: {
    backgroundColor: '#816ab4',
  },
  btnCancel: {
    backgroundColor: '#e0e0e0',
  },
  btnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  btnPrimaryText: {
    color: '#ffffff',
  },
  btnCancelText: {
    color: '#333333',
  },
});
