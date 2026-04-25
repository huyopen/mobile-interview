import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { MemorableMoment } from '../../types/moment';
import { MomentImageLayer } from './components/MomentImageLayer';
import { MomentVideoLayer } from './components/MomentVideoLayer';
import { ScalableButton } from './components/ScalableButton';
import {
  TILT_MAX,
  TILT_PERSPECTIVE,
  REVEAL_DURATION_IN,
  REVEAL_DURATION_OUT,
  VIDEO_FADE_DURATION,
  AUTOPLAY_DEBOUNCE_DELAY,
} from './constants';
import { throttle } from '@utils/performance';
import { useFocusVisible } from '@hooks/useFocusVisible';
import { useReducedMotion } from '@hooks/useReducedMotion';

type MomentCardProps = {
  item: MemorableMoment;
  width: number;
  isActive: boolean;
  isPreview?: boolean;
  parallaxX?: Animated.AnimatedInterpolation<number>;
};

export const MomentCard = memo(function MomentCard({ item, width, isActive, isPreview = false, parallaxX }: MomentCardProps) {
  const hasVideo = !!item.videoSource && typeof item.videoSource === 'string';
  const prefersReducedMotion = useReducedMotion();
  
  // Helper to adjust animation duration based on reduced motion preference
  const getAnimDuration = useCallback((normalDuration: number) => {
    return prefersReducedMotion ? Math.min(normalDuration * 0.3, 100) : normalDuration;
  }, [prefersReducedMotion]);

  // ── Video state ───────────────────────────────────────────────────────────
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoOpacity = useRef(new Animated.Value(0)).current;
  const videoProgress = useRef(new Animated.Value(0)).current;

  // Pause + reset to thumbnail when card becomes inactive
  useEffect(() => {
    if (!isActive && isPlaying) {
      setIsPlaying(false);
      setIsPaused(false);
      setIsMuted(false);
      Animated.timing(videoOpacity, {
        toValue: 0,
        duration: getAnimDuration(200),
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, isPlaying, videoOpacity, getAnimDuration]);

  // Autoplay when card becomes active
  const handlePlayPress = useCallback(() => {
    if (!hasVideo) return;
    setIsPlaying(true);
    setIsPaused(false);
    Animated.timing(videoOpacity, {
      toValue: 1,
      duration: getAnimDuration(VIDEO_FADE_DURATION),
      useNativeDriver: true,
    }).start();
  }, [hasVideo, videoOpacity, getAnimDuration]);

  // Autoplay when card becomes active and user stops scrolling
  useEffect(() => {
    if (isActive && hasVideo && !isPlaying && !isPreview) {
      // Debounce: wait for user to stop scrolling before autoplay
      const timer = setTimeout(() => {
        handlePlayPress();
      }, AUTOPLAY_DEBOUNCE_DELAY);
      return () => clearTimeout(timer);
    }
  }, [isActive, hasVideo, isPlaying, isPreview, handlePlayPress]);

  const handlePauseToggle = useCallback(() => setIsPaused((v) => !v), []);
  const handleMuteToggle = useCallback(() => setIsMuted((v) => !v), []);

  // ── Card height (for 20% cap) ─────────────────────────────────────────────
  const [cardHeight, setCardHeight] = useState(0);
  const collapsedMax = cardHeight > 0 ? cardHeight * 0.2 : 999;

  // ── Caption expand state ──────────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false);
  const [fullHeight, setFullHeight] = useState(0);
  const [isTruncated, setIsTruncated] = useState(false);
  const expandAnim = useRef(new Animated.Value(0)).current; // 0 = collapsed, 1 = expanded

  // Reset when card becomes inactive
  useEffect(() => {
    if (!isActive) {
      setExpanded(false);
      Animated.timing(expandAnim, {
        toValue: 0,
        duration: getAnimDuration(200),
        useNativeDriver: true,
      }).start();
    }
  }, [isActive, expandAnim, getAnimDuration]);

  const collapseExpanded = useCallback(() => {
    Animated.timing(expandAnim, {
      toValue: 0,
      duration: getAnimDuration(150),
      useNativeDriver: true,
    }).start(() => setExpanded(false));
  }, [expandAnim, getAnimDuration]);

  // Reset measurements when collapsedMax is ready
  useEffect(() => {
    if (cardHeight > 0 && fullHeight > 0) {
      setIsTruncated(fullHeight > collapsedMax);
    }
  }, [cardHeight, fullHeight, collapsedMax]);

  const handleToggle = useMemo(
    () =>
      throttle(() => {
        const toValue = expanded ? 0 : 1;
        if (!expanded) setExpanded(true);
        Animated.timing(expandAnim, {
          toValue,
          duration: getAnimDuration(expanded ? 150 : 260),
          useNativeDriver: true,
        }).start(() => {
          if (toValue === 0) setExpanded(false);
        });
      }, 300),
    [expanded, expandAnim, getAnimDuration]
  );

  // Collapsed height = min(20% card, full content)
  const clampedHeight = fullHeight > 0 ? Math.min(collapsedMax, fullHeight) : undefined;
  const contentHeight = expanded ? fullHeight : clampedHeight;

  // ── Focus visible (keyboard nav) ─────────────────────────────────────────
  const { isFocused: isToggleFocused, focusHandlers: toggleFocusHandlers } = useFocusVisible();
  const revealAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const duration = isActive 
      ? getAnimDuration(REVEAL_DURATION_IN)
      : getAnimDuration(REVEAL_DURATION_OUT);
      
    const animation = Animated.timing(revealAnim, {
      toValue: isActive ? 1 : 0,
      duration,
      delay: 0,
      useNativeDriver: true,
      easing: isActive ? (t) => 1 - Math.pow(1 - t, 3) : (t) => t * t,
    });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isActive, revealAnim, getAnimDuration]);

  // ── 3D tilt (web only, native driver) ────────────────────────────────────
  const tiltX = useRef(new Animated.Value(0)).current;
  const tiltY = useRef(new Animated.Value(0)).current;

  const handleMouseMoveThrottled = useMemo(
    () =>
      throttle((e: any) => {
        if (Platform.OS !== 'web' || !isActive || prefersReducedMotion) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const dx = (e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2);
        const dy = (e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2);
        Animated.spring(tiltY, { toValue: dx * TILT_MAX, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
        Animated.spring(tiltX, { toValue: -dy * TILT_MAX, useNativeDriver: true, speed: 28, bounciness: 0 }).start();
      }, 16),
    [isActive, tiltX, tiltY, prefersReducedMotion]
  );

  const handleMouseLeave = useCallback(() => {
    Animated.spring(tiltY, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
    Animated.spring(tiltX, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 4 }).start();
  }, [tiltX, tiltY]);

  // ── Derived animated styles ───────────────────────────────────────────────
  const revealTranslateY = revealAnim.interpolate({ inputRange: [0, 1], outputRange: [18, 0] });
  const captionOpacity   = revealAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0, 1] });
  const playOpacity      = revealAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0, 0, 1] });

  const tiltStyle = Platform.OS === 'web'
    ? {
        transform: [
          { perspective: TILT_PERSPECTIVE },
          { rotateX: tiltX.interpolate({ inputRange: [-TILT_MAX, TILT_MAX], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] }) },
          { rotateY: tiltY.interpolate({ inputRange: [-TILT_MAX, TILT_MAX], outputRange: [`-${TILT_MAX}deg`, `${TILT_MAX}deg`] }) },
        ],
      }
    : {};

  const webHandlers = Platform.OS === 'web'
    ? { onMouseMove: handleMouseMoveThrottled, onMouseLeave: handleMouseLeave }
    : {};
  const imageUri = encodeURI(item.thumbnailUrl);
  
  // Show active visual style for both active and preview states
  const showActiveStyle = isActive || isPreview;

  return (
    <Animated.View
      style={[styles.wrapper, { width }, showActiveStyle ? styles.activeWrapper : styles.inactiveWrapper, tiltStyle]}
      onLayout={(e: LayoutChangeEvent) => setCardHeight(e.nativeEvent.layout.height)}
      {...webHandlers}
    >
      <View style={styles.mediaFrame}>
        {/* Parallax image / thumbnail */}
        <MomentImageLayer
          imageUri={imageUri}
          parallaxX={isPlaying ? undefined : parallaxX}
        />

        {/* Base overlay — pointerEvents none so it never blocks touches */}
        <View
          pointerEvents="none"
          style={[styles.overlay, showActiveStyle ? styles.overlayActive : styles.overlayInactive]}
        />

        {/* Video layer — only mounted when actually playing */}
        {hasVideo && isPlaying ? (
          <MomentVideoLayer
            videoSource={item.videoSource as string}
            isPlaying={isPlaying}
            isMuted={isMuted}
            isPaused={isPaused}
            videoOpacity={videoOpacity}
            progress={videoProgress}
            onPauseToggle={handlePauseToggle}
            onMuteToggle={handleMuteToggle}
            onTap={() => {}}
          />
        ) : null}

        {showActiveStyle && expanded ? (
          <Animated.View style={[styles.expandedOverlay, {
            opacity: expandAnim,
            transform: [{ translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
          }]}>
            <BlurView intensity={12} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.expandedOverlayScrim} />
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={collapseExpanded}
              accessibilityRole="button"
              accessibilityLabel="Thu gọn nội dung"
            />
            <View style={styles.expandedPanel}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                bounces={false}
                style={styles.expandedScrollArea}
                contentContainerStyle={styles.expandedScrollContent}
              >
                <Text style={styles.location}>{item.location}</Text>
                <Text style={styles.expandedCaption}>{item.caption}</Text>
              </ScrollView>

              <Pressable
                onPress={collapseExpanded}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Thu gọn"
              >
                <Text style={styles.toggleLabel}>Thu gọn ↓</Text>
              </Pressable>
            </View>
          </Animated.View>
        ) : null}

        {/* Play button - visible when not playing */}
        {showActiveStyle && !isPlaying && hasVideo ? (
          <Animated.View 
            pointerEvents="box-none"
            style={[styles.playHitArea, { opacity: playOpacity }]}
          >
            <ScalableButton
              onPress={handlePlayPress}
              scaleInValue={0.88}
              scaleOutValue={1}
              springSpeed={30}
              springBounciness={8}
              accessibilityLabel="Xem khoảnh khắc"
            >
              <View style={styles.playButton}>
                <View style={styles.playTriangle} />
              </View>
            </ScalableButton>
          </Animated.View>
        ) : null}

        {/* Caption panel — reveal via native driver (opacity + translateY) */}
        <Animated.View
          pointerEvents={showActiveStyle ? "box-none" : "none"}
          style={[
            styles.captionPanel,
            showActiveStyle ? styles.captionPanelActive : styles.captionPanelInactive,
            showActiveStyle && { opacity: captionOpacity, transform: [{ translateY: revealTranslateY }] },
            expanded && styles.captionPanelHidden,
          ]}
        >
          {/* Hidden measurer — renders full content off-screen to get true height */}
          {showActiveStyle && fullHeight === 0 && cardHeight > 0 ? (
            <View
              style={styles.measurer}
              onLayout={(e) => setFullHeight(e.nativeEvent.layout.height)}
            >
              <Text style={styles.location}>{item.location}</Text>
              <Text style={styles.caption}>{item.caption.replace(/\n+/g, ' ')}</Text>
            </View>
          ) : null}

          {/* Content box — collapsed: fixed height; expanded: maxHeight + scroll */}
          <View
            pointerEvents="none"
            style={[
              styles.contentBox,
              contentHeight != null && { height: contentHeight },
            ]}
          >
            <>
              <Text style={styles.location}>{item.location}</Text>
              <Text
                style={styles.caption}
                numberOfLines={showActiveStyle && isTruncated ? 2 : undefined}
              >
                {showActiveStyle && isTruncated
                  ? item.caption.replace(/\n+/g, ' ')
                  : item.caption}
              </Text>
            </>
          </View>

          {/* More / Less toggle */}
          {showActiveStyle && isTruncated ? (
            <Pressable
              onPress={handleToggle}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={expanded ? 'Thu gọn' : 'Xem thêm'}
              {...toggleFocusHandlers}
              style={[isToggleFocused && styles.toggleFocusRing]}
            >
              <Text style={styles.toggleLabel}>{expanded ? 'Thu gọn ↓' : 'Xem thêm'}</Text>
            </Pressable>
          ) : null}
        </Animated.View>
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for better performance
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.width === nextProps.width &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.isPreview === nextProps.isPreview &&
    prevProps.parallaxX === nextProps.parallaxX
  );
});

const styles = StyleSheet.create({
  wrapper: {
    aspectRatio: 9 / 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#171717',
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
    opacity: 0.82,
  },
  mediaFrame: {
    position: 'relative',
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#111111',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  overlayActive: {
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  overlayInactive: {
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  playHitArea: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playTriangle: {
    marginLeft: 4,
    width: 0,
    height: 0,
    borderTopWidth: 10,
    borderBottomWidth: 10,
    borderLeftWidth: 16,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#ffffff',
  },
  captionPanel: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    zIndex: 10,
  },
  captionPanelActive: {
    // transparent — no background
  },
  captionPanelInactive: {
    opacity: 0,
  },
  captionPanelHidden: {
    opacity: 0,
  },
  contentBox: {
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  scrollArea: {
    flexGrow: 0,
  },
  expandedOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 12,
    justifyContent: 'flex-end',
  },
  expandedOverlayScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 8, 18, 0.15)',
  },
  expandedPanel: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    maxHeight: '62%',
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: 8,
  },
  expandedScrollArea: {
    maxHeight: '100%',
  },
  expandedScrollContent: {
    paddingBottom: 8,
  },
  measurer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: -9999,
    opacity: 0,
  },
  location: {
    color: '#ffffff',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
    marginBottom: 6,
  },
  caption: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 12,
    lineHeight: 18,
  },
  expandedCaption: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    lineHeight: 21,
    textShadowColor: 'rgba(0,0,0,0.28)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  toggleLabel: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  toggleFocusRing: Platform.OS === 'web' ? {
    // @ts-ignore - web only
    outline: '2px solid rgba(255,255,255,0.8)',
    outlineOffset: 3,
    borderRadius: 4,
  } : {},
});
