import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

interface SmoothTransitionProps {
  children: React.ReactNode;
  isVisible: boolean;
  duration?: number;
  style?: any;
}

/**
 * Composant pour des transitions fluides entre les écrans
 * Évite les écrans de chargement brusques
 */
export function SmoothTransition({ 
  children, 
  isVisible, 
  duration = 200, 
  style 
}: SmoothTransitionProps) {
  const fadeAnim = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(isVisible ? 1 : 0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: isVisible ? 1 : 0,
        duration,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: isVisible ? 1 : 0.95,
        duration,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isVisible, duration, fadeAnim, scaleAnim]);

  if (!isVisible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
