import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { VideoController } from './VideoController';
import { CONTROLS_FADE_DURATION, CONTROLS_AUTO_HIDE_DELAY } from '../constants';
import { throttle } from '@utils/performance';

type MomentVideoLayerProps = {
  videoSource: string;
  isPlaying: boolean;
  isMuted: boolean;
  isPaused: boolean;
  videoOpacity: Animated.Value;
  progress: Animated.Value;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
  onTap: () => void;
};

export const MomentVideoLayer = memo(function MomentVideoLayer({
  videoSource,
  isPlaying,
  isMuted,
  isPaused,
  videoOpacity,
  progress,
  onPauseToggle,
  onMuteToggle,
  onTap,
}: MomentVideoLayerProps) {
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = isMuted;
    p.timeUpdateEventInterval = 0.5;
  });

  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
      player.currentTime = 0;
      progress.setValue(0);
    }
  }, [isPlaying, player, progress]);

  useEffect(() => {
    player.muted = isMuted;
  }, [isMuted, player]);

  // Track progress via timeUpdate - throttled to reduce updates
  useEffect(() => {
    if (!isPlaying) return;
    
    const sub = player.addListener('timeUpdate', (e) => {
      if (player.duration > 0) {
        progress.setValue(e.currentTime / player.duration);
      }
    });
    return () => sub.remove();
  }, [player, progress, isPlaying]);

  // Pause/resume video based on isPaused state
  useEffect(() => {
    if (isPaused) {
      player.pause();
    } else if (isPlaying) {
      player.play();
    }
  }, [isPaused, isPlaying, player]);

  // Animate controls visibility
  useEffect(() => {
    Animated.timing(controlsOpacity, {
      toValue: controlsVisible ? 1 : 0,
      duration: CONTROLS_FADE_DURATION,
      useNativeDriver: true,
    }).start();
  }, [controlsVisible, controlsOpacity]);

  // Auto-hide controls after 2 seconds when playing
  useEffect(() => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }

    if (isPlaying && !isPaused && controlsVisible) {
      hideTimerRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, CONTROLS_AUTO_HIDE_DELAY);
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, [isPlaying, isPaused, controlsVisible]);

  // Show controls when paused
  useEffect(() => {
    if (isPaused) {
      setControlsVisible(true);
    }
  }, [isPaused]);

  const handleVideoTap = useMemo(
    () =>
      throttle(() => {
        if (!controlsVisible) {
          setControlsVisible(true);
          onTap();
        } else {
          onPauseToggle();
        }
      }, 200),
    [controlsVisible, onTap, onPauseToggle]
  );

  return (
    <Animated.View 
      style={[StyleSheet.absoluteFill, { opacity: videoOpacity }]}
      pointerEvents="box-none"
    >
      <VideoView
        player={player}
        style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}
        contentFit="cover"
        nativeControls={false}
      />
      
      {isPlaying ? (
        <>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={handleVideoTap}
            accessibilityRole="button"
            accessibilityLabel="Hiện/ẩn điều khiển video"
          />
          <Animated.View 
            style={[
              StyleSheet.absoluteFill, 
              { opacity: controlsOpacity }
            ]} 
            pointerEvents={controlsVisible ? 'box-none' : 'none'}
          >
            <VideoController
              isPaused={isPaused}
              isMuted={isMuted}
              progress={progress}
              controlsVisible={controlsVisible}
              onPauseToggle={onPauseToggle}
              onMuteToggle={onMuteToggle}
            />
          </Animated.View>
        </>
      ) : null}
    </Animated.View>
  );
});
