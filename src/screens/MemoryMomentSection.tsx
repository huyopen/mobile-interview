import { useMemo, useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Animated, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchMoments } from '@services/api/moments';
import { MemoryMomentSwiper } from '@components/MemoryMomentSwiper';
import { useReducedMotion } from '@hooks/useReducedMotion';
import {
  SKELETON_COUNT,
  SKELETON_SOURCE,
} from './MemoryMomentSection.data';
import {
  getVirtualizedLoop
} from '@utils/index'


export function MemoryMomentsScreen() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const { data, isError, isPending } = useQuery({
    queryKey: ['moments'],
    queryFn: () => fetchMoments(1, 30),
  });

  const moments = data?.moments ?? [];
  const totalDocs = data?.totalDocs ?? 0;

  const { totalCount, initialIndex } = useMemo(() => {
    if (isPending) {
      return { totalCount: SKELETON_COUNT, initialIndex: 1 };
    }
    return getVirtualizedLoop(moments.length);
  }, [isPending, moments.length]);


  const isLargeScreen = width >= 768;
  
  // Calculate card dimensions and spacing
  // On mobile with reduced motion: add spacing between cards for better clarity
  const itemSpacing = isLargeScreen ? 32 : (prefersReducedMotion ? 24 : 0);
  
  // For large screen: show 3 cards (1 center + 1 left + 1 right) with larger size
  const cardWidth = isLargeScreen
    ? (width - (4 * itemSpacing)) / 5 + 80  // 5 cards with 4 gaps
    : width * 0.72;                          // mobile: 1 center card
  
  // Snap interval includes card width + spacing
  const snapInterval = cardWidth + itemSpacing;
  
  const sideInset = isLargeScreen
    ? (width - cardWidth) / 2  // Center the active card (middle of 5)
    : Math.max((width - cardWidth) / 2, 16);

  const handleBackgroundPress = () => {
    if (previewIndex !== null) {
      setPreviewIndex(null);
    }
  };

  useEffect(() => {
    if (!isPending && moments.length > 0) {
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPending, moments.length, fadeAnim]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingBottom: insets.bottom,
        }}
        showsVerticalScrollIndicator={false}
      >        
        <Pressable
          style={styles.section}
          onPress={handleBackgroundPress}
        >
          <View style={styles.leftGlow} pointerEvents="none" />
          <View style={styles.rightGlow} pointerEvents="none" />
          <View style={styles.centerGlow} pointerEvents="none" />

          <View style={styles.header} pointerEvents="none">
            <Text style={styles.heading}>
              {isPending ? '' : totalDocs > 0 ? totalDocs : '0'} khoảnh khắc đáng nhớ
            </Text>
            <Text style={styles.description}>Hàng ngàn khoảnh khắc đáng nhớ về hành trình học tập thú vị luôn được ZIM ghi lại mỗi ngày tại 21 trung tâm Anh Ngữ ZIM trên toàn quốc.</Text>
          </View>

          {isError ? (
            <Text style={styles.errorText}>Không thể tải dữ liệu. Vui lòng thử lại.</Text>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              <MemoryMomentSwiper
                data={isPending ? SKELETON_SOURCE : moments}
                totalCount={totalCount}
                sourceCount={isPending ? SKELETON_COUNT : moments?.length}
                initialIndex={initialIndex}
                isSkeleton={isPending}
                cardWidth={cardWidth}
                sideInset={sideInset}
                snapInterval={snapInterval}
                itemSpacing={itemSpacing}
                isLargeScreen={isLargeScreen}
                previewIndex={previewIndex}
                setPreviewIndex={setPreviewIndex}
              />
            </Animated.View>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#222222',
    overflow: 'visible',
  },
  scrollView: {
    flex: 1,
    overflow: 'visible',
  },
  scrollContent: {
    paddingVertical: 0,
    overflow: 'visible',
  },
  section: {
    position: 'relative',
    overflow: 'visible',
    backgroundColor: '#222222',
    paddingTop: 96,
    paddingBottom: 96,
    gap: 40,
  },
  header: {
    marginBottom: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 16,
  },
  heading: {
    color: '#ffffff',
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    maxWidth: 600,
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    opacity: 0.9,
  },
  errorText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    textAlign: 'center',
    marginVertical: 48,
    paddingHorizontal: 24,
  },
  leftGlow: {
    position: 'absolute',
    right: -120,
    bottom: -120,
    width: 360,
    height: 360,
    borderRadius: 999,
    opacity: 0.22,
    backgroundColor: '#ff3b5c',
    shadowColor: '#ff3b5c',
    shadowOpacity: 0.48,
    shadowRadius: 140,
    shadowOffset: { width: 0, height: 0 },
    elevation: 16,
  },
  rightGlow: {
    position: 'absolute',
    left: -120,
    top: -80,
    width: 300,
    height: 300,
    borderRadius: 999,
    opacity: 0.18,
    backgroundColor: '#2f6bff',
    shadowColor: '#2f6bff',
    shadowOpacity: 0.4,
    shadowRadius: 130,
    shadowOffset: { width: 0, height: 0 },
    elevation: 14,
  },
  centerGlow: {
    position: 'absolute',
    left: '32%',
    top: 120,
    width: 180,
    height: 180,
    borderRadius: 999,
    opacity: 0.08,
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOpacity: 0.14,
    shadowRadius: 90,
    shadowOffset: { width: 0, height: 0 },
  },
});
