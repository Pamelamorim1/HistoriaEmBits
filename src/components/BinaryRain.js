import React, { useEffect, useState } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLUMNS = 16;
const COL_W = SCREEN_W / COLUMNS;
const TOTAL_DROPS = 40;

function generateBits() {
  const len = 4 + Math.floor(Math.random() * 5);
  return Array.from({ length: len }, () => (Math.random() > 0.5 ? '1' : '0')).join('\n');
}

function createDrop(index) {
  // Start drops across the ENTIRE screen so it is visible immediately on load!
  const initialY = (index / TOTAL_DROPS) * (SCREEN_H + 100) - 50 + (Math.random() * 60 - 30);
  const speed = 3000 + Math.random() * 3000;
  return {
    id: index,
    col: index % COLUMNS,
    bits: generateBits(),
    anim: new Animated.Value(initialY),
    opacity: 0.4 + Math.random() * 0.5, // High visibility (0.4 to 0.9)
    color: Math.random() > 0.3 ? '#38BDF8' : '#34D399', // Cyan or emerald green
    speed,
    fontSize: 13 + Math.floor(Math.random() * 5),
  };
}

export default function BinaryRain() {
  const [drops] = useState(() =>
    Array.from({ length: TOTAL_DROPS }, (_, i) => createDrop(i))
  );

  useEffect(() => {
    let isMounted = true;

    drops.forEach((drop) => {
      const runCycle = (startY) => {
        if (!isMounted) return;

        const distance = SCREEN_H + 100 - startY;
        const totalDistance = SCREEN_H + 200;
        const duration = Math.max(800, (distance / totalDistance) * drop.speed);

        Animated.timing(drop.anim, {
          toValue: SCREEN_H + 100,
          duration,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && isMounted) {
            drop.anim.setValue(-100);
            drop.col = Math.floor(Math.random() * COLUMNS);
            drop.bits = generateBits();
            runCycle(-100);
          }
        });
      };

      // Start current cycle from initial position
      const currentVal = drop.anim._value !== undefined ? drop.anim._value : 0;
      runCycle(currentVal);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {drops.map((drop) => (
        <Animated.Text
          key={drop.id}
          style={[
            styles.bitDrop,
            {
              left: drop.col * COL_W + COL_W * 0.1,
              fontSize: drop.fontSize,
              color: drop.color,
              opacity: drop.opacity,
              transform: [{ translateY: drop.anim }],
            },
          ]}
        >
          {drop.bits}
        </Animated.Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    zIndex: 0,
  },
  bitDrop: {
    position: 'absolute',
    fontFamily: 'monospace',
    fontWeight: '900',
    lineHeight: 18,
    textShadowColor: 'rgba(56, 189, 248, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
