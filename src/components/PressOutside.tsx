import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

type PressOutsideProps = {
  onPressOutside: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  excludeRefs?: React.RefObject<any>[];
};

export function PressOutside({ onPressOutside, children, disabled = false, excludeRefs = [] }: PressOutsideProps) {
  const containerRef = useRef<View>(null);

  useEffect(() => {
    if (disabled || Platform.OS !== 'web') return;

    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is inside any excluded refs
      for (const ref of excludeRefs) {
        if (ref.current) {
          const node = ref.current as any;
          if (node && node.contains && node.contains(event.target)) {
            return; // Click is inside excluded element, don't trigger
          }
        }
      }

      // Check if click is inside container
      if (containerRef.current) {
        const node = containerRef.current as any;
        if (node && node.contains && !node.contains(event.target)) {
          onPressOutside();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onPressOutside, disabled, excludeRefs]);

  return (
    <View ref={containerRef} style={styles.container}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
