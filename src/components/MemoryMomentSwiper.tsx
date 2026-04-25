import { useCallback, useEffect, useMemo } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  View,
} from 'react-native';
import { MemorableMoment } from '@src/types/moment';
import { MomentCardWrapper } from './MomentCardWrapper';
import { useMemoryMomentCircularScroll } from '@hooks/useMemoryMomentCircularScroll';
import { rafThrottle } from '@utils/performance';

export type SwiperProps = {
  data: MemorableMoment[];
  totalCount: number;
  sourceCount: number;
  initialIndex: number;
  isSkeleton?: boolean;
  cardWidth: number;
  sideInset: number;
  snapInterval: number;
  itemSpacing: number;
  isLargeScreen: boolean;
  previewIndex: number | null;
  setPreviewIndex: (index: number | null) => void;
};

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<number>);

export const MemoryMomentSwiper = ({
  data,
  totalCount,
  sourceCount,
  initialIndex,
  isSkeleton = false,
  cardWidth,
  sideInset,
  snapInterval,
  itemSpacing,
  isLargeScreen,
  previewIndex,
  setPreviewIndex,
}: SwiperProps) => {
  
  const virtualData = useMemo(
    () => Array.from({ length: totalCount }, (_, index) => index),
    [totalCount]
  );

  const {
    listRef,
    scrollX,
    activeIndex,
    syncActiveIndex,
    settleToNearest,
    scrollToIndex,
  } = useMemoryMomentCircularScroll({
    totalCount,
    snapInterval,
    initialIndex,
  });

  // Throttled scroll handler using RAF for better performance
  const scheduleActiveSync = useMemo(
    () =>
      rafThrottle((offsetX: number) => {
        const nextIndex = Math.round(offsetX / snapInterval);
        syncActiveIndex(nextIndex);
      }),
    [snapInterval, syncActiveIndex]
  );

  // Clear preview when active index changes (user scrolled)
  useEffect(() => {
    setPreviewIndex(null);
  }, [activeIndex, setPreviewIndex]);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: snapInterval,
      offset: snapInterval * index,
      index,
    }),
    [snapInterval]
  );

  const handleCardPress = useCallback((index: number) => {
    if (previewIndex === index) {
      // Second click on same preview - scroll to card and play
      scrollToIndex(index);
      setPreviewIndex(null);
    } else {
      // First click - show preview
      setPreviewIndex(index);
    }
  }, [previewIndex, scrollToIndex, setPreviewIndex]);

  const renderItem = useCallback(({ item: virtualIndex }: { item: number }) => {
    const sourceIndex = sourceCount === 0 ? 0 : virtualIndex % sourceCount;
    const moment = data[sourceIndex];

    if (moment == null) {
      return <View style={{ width: cardWidth + itemSpacing }} />;
    }

    return (
      <MomentCardWrapper
        item={moment}
        index={virtualIndex}
        isActive={virtualIndex === activeIndex}
        isPreview={virtualIndex === previewIndex}
        isSkeleton={isSkeleton}
        cardWidth={cardWidth}
        snapInterval={snapInterval}
        itemSpacing={itemSpacing}
        isLargeScreen={isLargeScreen}
        scrollX={scrollX}
        onCardPress={handleCardPress}
      />
    );
  }, [activeIndex, previewIndex, cardWidth, data, isLargeScreen, isSkeleton, itemSpacing, scrollX, handleCardPress, snapInterval, sourceCount]);

  return (
      <View pointerEvents="box-none" style={{ overflow: 'visible' }}>
        <AnimatedFlatList
          ref={listRef}
          data={virtualData}
          keyExtractor={(item) => `virtual-${item}`}
          initialScrollIndex={initialIndex}
          initialNumToRender={3}
          horizontal
          scrollEnabled={!isSkeleton}
          bounces={false}
          decelerationRate={Platform.OS === 'ios' ? 0.992 : 'fast'}
          maxToRenderPerBatch={2}
          removeClippedSubviews={false}
          snapToInterval={snapInterval}
          snapToAlignment="start"
          disableIntervalMomentum
          showsHorizontalScrollIndicator={false}
          overScrollMode="never"
          updateCellsBatchingPeriod={50}
          windowSize={3}
          getItemLayout={getItemLayout}
          style={{ overflow: 'visible' }}
          contentContainerStyle={{
            paddingLeft: sideInset,
            paddingRight: sideInset - itemSpacing,
            alignItems: 'center',
            overflow: 'visible',
          }}
          ItemSeparatorComponent={() => <View style={{ width: 0 }} />}
          onMomentumScrollEnd={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
            settleToNearest(e.nativeEvent.contentOffset.x)
          }
          onScrollEndDrag={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
            if (Platform.OS === 'web') settleToNearest(e.nativeEvent.contentOffset.x);
          }}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: true,
              listener: (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                scheduleActiveSync(event.nativeEvent.contentOffset.x);
              },
            }
          )}
          scrollEventThrottle={32}
          renderItem={renderItem}
        />
      </View>
  );
}
