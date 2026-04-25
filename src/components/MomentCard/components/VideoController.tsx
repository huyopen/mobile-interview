import { memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScalableButton } from './ScalableButton';

type VideoControllerProps = {
  isPaused: boolean;
  isMuted: boolean;
  progress: Animated.Value;
  controlsVisible: boolean;
  onPauseToggle: () => void;
  onMuteToggle: () => void;
};

export const VideoController = memo(function VideoController({
  isPaused,
  isMuted,
  progress,
  controlsVisible,
  onPauseToggle,
  onMuteToggle,
}: VideoControllerProps) {
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.videoControls} pointerEvents="box-none">
      {/* Progress bar — always visible, top */}
      <View style={styles.progressTrack} pointerEvents="none">
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      {/* Pause/Play button — center, only visible when controls shown */}
      {controlsVisible && (
        <View style={styles.centerControls} pointerEvents="box-none">
          {isPaused ? (
            <ScalableButton
              onPress={onPauseToggle}
              scaleInValue={0.85}
              scaleOutValue={1}
              springSpeed={35}
              springBounciness={6}
              accessibilityLabel="Tiếp tục"
            >
              <View style={styles.videoControlCircle}>
                <View style={styles.playTriangle} />
              </View>
            </ScalableButton>
          ) : (
            <ScalableButton
              onPress={onPauseToggle}
              scaleInValue={0.85}
              scaleOutValue={1}
              springSpeed={35}
              springBounciness={6}
              accessibilityLabel="Tạm dừng"
            >
              <View style={styles.videoControlCircle}>
                <View style={styles.pauseBars}>
                  <View style={styles.pauseBar} />
                  <View style={styles.pauseBar} />
                </View>
              </View>
            </ScalableButton>
          )}
        </View>
      )}

      {/* Mute toggle — top left, only visible when controls shown */}
      {controlsVisible && (
        <View style={styles.muteRow}>
          <ScalableButton
            onPress={onMuteToggle}
            scaleInValue={0.82}
            scaleOutValue={1}
            springSpeed={40}
            springBounciness={4}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            <View style={styles.videoControlCircleSm}>
              <Ionicons 
                name={isMuted ? "volume-mute" : "volume-high"} 
                size={18} 
                color="#ffffff" 
              />
            </View>
          </ScalableButton>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  videoControls: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
  },
  progressTrack: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
  },
  centerControls: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoControlCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 3.5,
    height: 16,
    borderRadius: 2,
    backgroundColor: '#ffffff',
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
  muteRow: {
    position: 'absolute',
    top: 44,
    left: 14,
  },
  videoControlCircleSm: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
