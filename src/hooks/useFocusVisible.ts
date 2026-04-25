import { useState, useCallback, useRef } from 'react';
import { Platform } from 'react-native';

/**
 * Detects keyboard-based focus (focus-visible equivalent for web).
 * On mobile, always returns isFocused: false since keyboard navigation
 * is not applicable.
 */
export function useFocusVisible() {
  const [isFocused, setIsFocused] = useState(false);
  const isMouseInteraction = useRef(false);

  const onMouseDown = useCallback(() => {
    // Mark as mouse interaction so focus won't show ring
    isMouseInteraction.current = true;
  }, []);

  const onFocus = useCallback(() => {
    if (Platform.OS !== 'web') return;
    // Only show focus ring if triggered by keyboard (not mouse)
    if (!isMouseInteraction.current) {
      setIsFocused(true);
    }
    isMouseInteraction.current = false;
  }, []);

  const onBlur = useCallback(() => {
    setIsFocused(false);
    isMouseInteraction.current = false;
  }, []);

  return {
    isFocused: Platform.OS === 'web' ? isFocused : false,
    focusHandlers: Platform.OS === 'web'
      ? { onFocus, onBlur, onMouseDown }
      : {},
  };
}
