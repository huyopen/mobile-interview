import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

type SkeletonCardProps = {
  width: number;
  isActive?: boolean;
};

export function SkeletonCard({ width, isActive = false }: SkeletonCardProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    // Outer wrapper holds border + shadow so overflow:hidden on inner doesn't clip them
    <View style={[styles.wrapper, { width }, isActive ? styles.activeWrapper : styles.inactiveWrapper]}>
      <View style={styles.card}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.shimmer, { opacity }]} />
        <View style={styles.captionArea}>
          <View style={styles.lineLong} />
          <View style={styles.lineShort} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    aspectRatio: 9 / 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  activeWrapper: {
    borderWidth: 2.5,
    borderColor: 'rgba(255,255,255,0.96)',
    shadowColor: '#ffffff',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
  inactiveWrapper: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  card: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: '#111111',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  shimmer: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
  },
  captionArea: {
    padding: 16,
    gap: 8,
  },
  lineLong: {
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: '70%',
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    width: '45%',
  },
});
