import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

type Options = {
  totalCount: number;
  snapInterval: number;
  initialIndex: number;
};

export function useMemoryMomentCircularScroll({ totalCount, snapInterval, initialIndex }: Options) {
  const listRef = useRef<any>(null);
  const activeIndexRef = useRef(initialIndex);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const scrollXRef = useRef(new Animated.Value(0));
  const scrollX = scrollXRef.current;

  // Reset when initialIndex changes (skeleton → real data transition)
  useEffect(() => {
    activeIndexRef.current = initialIndex;
    setActiveIndex(initialIndex);
    scrollX.setValue(initialIndex * snapInterval);
    listRef.current?.scrollToOffset({ offset: initialIndex * snapInterval, animated: false });
  }, [initialIndex, scrollX, snapInterval]);

  const updateActiveIndex = useCallback((nextIndex: number) => {
    if (nextIndex !== activeIndexRef.current) {
      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }
  }, []);

  const syncActiveIndex = useCallback((nextIndex: number) => {
    const clamped = Math.max(0, Math.min(totalCount - 1, nextIndex));
    updateActiveIndex(clamped);
  }, [totalCount, updateActiveIndex]);

  const settleToNearest = useCallback((offsetX: number) => {
    const nextIndex = Math.round(offsetX / snapInterval);
    const clamped = Math.max(0, Math.min(totalCount - 1, nextIndex));
    updateActiveIndex(clamped);
  }, [snapInterval, totalCount, updateActiveIndex]);

  const scrollToIndex = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(totalCount - 1, index));
    listRef.current?.scrollToOffset({ 
      offset: clamped * snapInterval, 
      animated: true 
    });
    updateActiveIndex(clamped);
  }, [snapInterval, totalCount, updateActiveIndex]);

  return {
    listRef,
    scrollX,
    activeIndex,
    syncActiveIndex,
    settleToNearest,
    scrollToIndex,
  };
}
