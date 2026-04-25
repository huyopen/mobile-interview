import { memo, useCallback, useMemo } from 'react';
import { Animated, Platform, Pressable, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { MemorableMoment } from '@src/types/moment';
import { MomentCard } from '@components/MomentCard/MomentCard';
import { SkeletonCard } from '@components/SkeletonCard';
import { useFocusVisible } from '@hooks/useFocusVisible';
import { useReducedMotion } from '@hooks/useReducedMotion';

export type MomentCardWrapperProps = {
  item: MemorableMoment;
  index: number;
  isActive: boolean;
  isPreview: boolean;
  isSkeleton?: boolean;
  cardWidth: number;
  snapInterval: number;
  itemSpacing: number;
  isLargeScreen: boolean;
  scrollX: Animated.Value;
  onCardPress?: (index: number) => void;
};

export const MomentCardWrapper = memo(({
  item,
  index,
  isActive,
  isPreview,
  isSkeleton = false,
  cardWidth,
  snapInterval,
  itemSpacing,
  isLargeScreen,
  scrollX,
  onCardPress,
}: MomentCardWrapperProps) => {
  const prefersReducedMotion = useReducedMotion();
  
  const inputRange = useMemo(() => [
    (index - 2) * snapInterval,
    (index - 1) * snapInterval,
    index * snapInterval,
    (index + 1) * snapInterval,
    (index + 2) * snapInterval,
  ], [index, snapInterval]);

  const scale = useMemo(() => {
    // Disable scale completely when reduced motion is enabled
    if (prefersReducedMotion) {
      return scrollX.interpolate({
        inputRange,
        outputRange: [1, 1, 1, 1, 1], // No scale
        extrapolate: 'clamp',
      });
    }
    
    if (!isLargeScreen) {
      return scrollX.interpolate({
        inputRange,
        outputRange: [0.65, 0.82, 1.0, 0.82, 0.65],
        extrapolate: 'clamp',
      });
    }
    // Large screen
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.75, 0.85, 1.1, 0.85, 0.75],
      extrapolate: 'clamp',
    });
  }, [scrollX, inputRange, isLargeScreen, prefersReducedMotion]);

  const opacity = useMemo(() => {
    // Disable opacity fade completely when reduced motion is enabled
    if (prefersReducedMotion) {
      return scrollX.interpolate({
        inputRange,
        outputRange: [1, 1, 1, 1, 1], // No fade
        extrapolate: 'clamp',
      });
    }
    
    if (!isLargeScreen) {
      return scrollX.interpolate({
        inputRange,
        outputRange: [0.35, 0.55, 1, 0.55, 0.35],
        extrapolate: 'clamp',
      });
    }
    // Large screen
    return scrollX.interpolate({
      inputRange,
      outputRange: [0.4, 0.6, 1, 0.6, 0.4],
      extrapolate: 'clamp',
    });
  }, [scrollX, inputRange, isLargeScreen, prefersReducedMotion]);

  const parallaxX = useMemo(() => {
    // Disable parallax completely when reduced motion is enabled
    const normalRange = [-cardWidth * 0.5, -cardWidth * 0.25, 0, cardWidth * 0.25, cardWidth * 0.5];
    const reducedRange = [0, 0, 0, 0, 0]; // No parallax movement
    
    return scrollX.interpolate({
      inputRange,
      outputRange: prefersReducedMotion ? reducedRange : normalRange,
      extrapolate: 'clamp',
    });
  }, [scrollX, inputRange, cardWidth, prefersReducedMotion]);

  // Compensate for scale to keep gaps even
  const scaleCompensation = useMemo(() => {
    if (!isLargeScreen) return 0;
    
    // Disable scale compensation when reduced motion is enabled (since scale is minimal)
    if (prefersReducedMotion) return 0;
    
    // Base offset optimized for iPad 13" (cardWidth ~300px)
    // Scale proportionally for different screen sizes
    const baseOffset = 46;
    const screenRatio = cardWidth / 300;
    const scaledOffset = baseOffset * screenRatio;
    
    return scrollX.interpolate({
      inputRange,
      outputRange: [
        -cardWidth * (1 - 0.75) + scaledOffset / 2,   // index -2: pull left
        -cardWidth * (1 - 0.85) + scaledOffset,       // index -1: pull left
        0,                                            // index 0: no compensation
        cardWidth * (1 - 0.85) - scaledOffset,        // index +1: pull right
        cardWidth * (1 - 0.75) - scaledOffset / 2,    // index +2: pull right
      ],
      extrapolate: 'clamp',
    });
  }, [scrollX, inputRange, cardWidth, isLargeScreen, prefersReducedMotion]);

  const showActiveStyle = isActive || isPreview || isHovered;
  const shouldBlur = isLargeScreen && !isActive && !isPreview && !isHovered;

  // Handle card press with proper event handling
  const handleCardPress = useCallback((e: any) => {
    e.stopPropagation();
    if (onCardPress) {
      onCardPress(index);
    }
  }, [onCardPress, index]);

  const { isFocused, focusHandlers } = useFocusVisible();

  return (
    <Animated.View
      style={[
        styles.slide,
        {
          marginRight: itemSpacing,
          zIndex: isActive ? 2 : 1, // Only active card gets elevated zIndex, not preview
          transform: [
            { translateX: scaleCompensation },
            { scale }
          ],
          opacity,
        },
      ]}
    >
      {isSkeleton ? (
        <SkeletonCard width={cardWidth} isActive={showActiveStyle} />
      ) : (
        <>
          <MomentCard
            item={item}
            width={cardWidth}
            isActive={isActive}
            isPreview={isPreview}
            parallaxX={parallaxX}
          />
          {shouldBlur && (
            <BlurView
              intensity={15}
              tint="dark"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
          {!isActive && onCardPress && (
            <Pressable
              onPress={handleCardPress}
              style={[
                StyleSheet.absoluteFill,
                { zIndex: 10, backgroundColor: 'transparent' },
                isFocused && styles.focusRing,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isPreview ? "Xem khoảnh khắc này" : "Chọn khoảnh khắc này"}
              hitSlop={0}
              {...focusHandlers}
            />
          )}
        </>
      )}
    </Animated.View>
  );
}, (prev, next) =>
  prev.isActive === next.isActive &&
  prev.isPreview === next.isPreview &&
  prev.isSkeleton === next.isSkeleton &&
  prev.item === next.item &&
  prev.cardWidth === next.cardWidth &&
  prev.snapInterval === next.snapInterval &&
  prev.itemSpacing === next.itemSpacing &&
  prev.isLargeScreen === next.isLargeScreen
);

const styles = StyleSheet.create({
  slide: {
    justifyContent: 'center',
  },
  focusRing: Platform.OS === 'web' ? {
    // @ts-ignore - web only
    outline: '2px solid rgba(255,255,255,0.8)',
    outlineOffset: 4,
    borderRadius: 16,
  } : {},
});
