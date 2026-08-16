import { useState, useEffect, useRef } from 'react';
import { Platform, Keyboard, KeyboardEvent, Animated } from 'react-native';

export interface KeyboardAdjustmentState {
  keyboardHeight: number;
  keyboardVisible: boolean;
  keyboardOffset: number;
  animatedPaddingBottom: Animated.Value;
  viewportHeight: number | null;
}

/**
 * Universal hook to handle keyboard lifting and keep headers fixed across:
 * - Android (Expo Go / Standalone)
 * - iOS (Native)
 * - Web (Mobile browsers & Desktop)
 */
export function useKeyboardAdjustment(): KeyboardAdjustmentState {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const animatedPaddingBottom = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;

      // Lock document root on web to avoid browser panning the whole webpage
      try {
        const styleId = '__lechambea_viewport_lock__';
        if (!document.getElementById(styleId)) {
          const style = document.createElement('style');
          style.id = styleId;
          style.innerHTML = `
            html, body, #root {
              height: 100% !important;
              width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              position: fixed !important;
              top: 0 !important;
              left: 0 !important;
              right: 0 !important;
              bottom: 0 !important;
            }
          `;
          document.head.appendChild(style);
        }
      } catch (e) {
        // Safe catch
      }

      let baselineHeight = window.innerHeight;

      const handleViewportChange = () => {
        if (window.visualViewport) {
          const vv = window.visualViewport;
          if (window.innerHeight > baselineHeight) {
            baselineHeight = window.innerHeight;
          }
          const currentHeight = vv.height;
          const diff = Math.max(0, baselineHeight - currentHeight);
          const isVirtualKeyboardOpen = diff > 60;

          if (window.scrollY !== 0 || window.scrollX !== 0) {
            window.scrollTo(0, 0);
          }

          setViewportHeight(currentHeight);

          if (isVirtualKeyboardOpen) {
            // Include a small 8px buffer so the input sits nicely a little bit above the keyboard
            const targetOffset = diff + 6;
            setKeyboardHeight(targetOffset);
            setKeyboardVisible(true);
            setKeyboardOffset(targetOffset);
            Animated.timing(animatedPaddingBottom, {
              toValue: targetOffset,
              duration: 150,
              useNativeDriver: false,
            }).start();
          } else {
            setKeyboardHeight(0);
            setKeyboardVisible(false);
            setKeyboardOffset(0);
            Animated.timing(animatedPaddingBottom, {
              toValue: 0,
              duration: 150,
              useNativeDriver: false,
            }).start();
          }
        }
      };

      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', handleViewportChange);
        window.visualViewport.addEventListener('scroll', handleViewportChange);
      }
      window.addEventListener('resize', handleViewportChange);

      handleViewportChange();

      return () => {
        if (window.visualViewport) {
          window.visualViewport.removeEventListener('resize', handleViewportChange);
          window.visualViewport.removeEventListener('scroll', handleViewportChange);
        }
        window.removeEventListener('resize', handleViewportChange);
      };
    } else {
      // Native iOS and Android
      const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

      const onShow = (e: KeyboardEvent) => {
        const rawHeight = e.endCoordinates?.height || 0;
        // Add a 6px breathing room so input stays clearly above the keyboard
        const targetHeight = rawHeight > 0 ? rawHeight + 6 : 0;
        const duration = Platform.OS === 'ios' ? (e.duration || 250) : 120;

        setKeyboardHeight(targetHeight);
        setKeyboardVisible(true);
        setKeyboardOffset(targetHeight);

        Animated.timing(animatedPaddingBottom, {
          toValue: targetHeight,
          duration: duration,
          useNativeDriver: false,
        }).start();
      };

      const onHide = (e?: KeyboardEvent) => {
        const duration = Platform.OS === 'ios' ? (e?.duration || 250) : 120;
        setKeyboardHeight(0);
        setKeyboardVisible(false);
        setKeyboardOffset(0);

        Animated.timing(animatedPaddingBottom, {
          toValue: 0,
          duration: duration,
          useNativeDriver: false,
        }).start();
      };

      const showSub = Keyboard.addListener(showEvent, onShow);
      const hideSub = Keyboard.addListener(hideEvent, onHide);

      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
  }, []);

  return { keyboardHeight, keyboardVisible, keyboardOffset, animatedPaddingBottom, viewportHeight };
}

export default useKeyboardAdjustment;
