import { useEffect, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

/**
 * Detects if user prefers reduced motion (accessibility setting).
 * On iOS/Android: uses AccessibilityInfo.isReduceMotionEnabled
 * On web: uses CSS media query prefers-reduced-motion
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web') {
      // Web: check CSS media query
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Native: check AccessibilityInfo
      AccessibilityInfo.isReduceMotionEnabled().then(setPrefersReducedMotion);

      const subscription = AccessibilityInfo.addEventListener(
        'reduceMotionChanged',
        setPrefersReducedMotion
      );

      return () => subscription?.remove();
    }
  }, []);

  return prefersReducedMotion;
}
