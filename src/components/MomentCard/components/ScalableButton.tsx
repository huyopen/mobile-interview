import { memo, useRef } from 'react';
import { Animated, Platform, Pressable, PressableProps, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { useFocusVisible } from '@hooks/useFocusVisible';

type ScalableButtonProps = {
  onPress?: () => void;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  scaleInValue?: number;
  scaleOutValue?: number;
  springSpeed?: number;
  springBounciness?: number;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: PressableProps['accessibilityRole'];
  hitSlop?: PressableProps['hitSlop'];
};

export const ScalableButton = memo(function ScalableButton({
  onPress,
  children,
  style,
  scaleInValue = 0.88,
  scaleOutValue = 1,
  springSpeed = 30,
  springBounciness = 0,
  disabled = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  hitSlop,
}: ScalableButtonProps) {
  const scaleAnim = useRef(new Animated.Value(scaleOutValue)).current;
  const { isFocused, focusHandlers } = useFocusVisible();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleInValue,
      useNativeDriver: true,
      speed: springSpeed,
      bounciness: springBounciness,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: scaleOutValue,
      useNativeDriver: true,
      speed: springSpeed * 0.6,
      bounciness: springBounciness + 8,
    }).start();
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      hitSlop={hitSlop}
      {...focusHandlers}
      style={({ pressed }) => [
        style,
        disabled && { opacity: 0.5 },
      ]}
    >
      <Animated.View style={[
        { transform: [{ scale: scaleAnim }] },
        isFocused && styles.focusRing,
      ]}>
        {children}
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  focusRing: Platform.OS === 'web' ? {
    // @ts-ignore - web only
    outline: '2px solid rgba(255,255,255,0.8)',
    outlineOffset: 3,
    borderRadius: 999,
  } : {},
});
