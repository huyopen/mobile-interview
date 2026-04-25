import { memo } from 'react';
import { Image } from 'expo-image';
import { Animated, StyleSheet } from 'react-native';

type MomentImageLayerProps = {
  imageUri: string;
  parallaxX?: Animated.AnimatedInterpolation<number>;
};

export const MomentImageLayer = memo(function MomentImageLayer({
  imageUri,
  parallaxX,
}: MomentImageLayerProps) {
  return (
    <Animated.View
      style={[styles.parallaxContainer, parallaxX != null && { transform: [{ translateX: parallaxX }] }]}
    >
      <Image
        source={imageUri}
        contentFit="cover"
        cachePolicy="memory-disk"
        transition={0}
        style={styles.image}
        priority="high"
        recyclingKey={imageUri}
      />
    </Animated.View>
  );
}, (prev, next) => {
  // Only re-render if imageUri changes, ignore parallaxX changes for better performance
  return prev.imageUri === next.imageUri;
});

const styles = StyleSheet.create({
  parallaxContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '-18%',
    width: '136%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
