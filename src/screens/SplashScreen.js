import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet, TouchableOpacity } from 'react-native';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const COLUMNS = 14;
const COL_W = SCREEN_W / COLUMNS;
const TOTAL_DROPS = 50;

function createDrop(index, staggered = true) {
  return {
    id: index,
    col: Math.floor(Math.random() * COLUMNS),
    bits: Array.from({ length: 4 + Math.floor(Math.random() * 5) }, () =>
      Math.random() > 0.5 ? '1' : '0'
    ).join(''),
    anim: new Animated.Value(staggered ? -(Math.random() * SCREEN_H * 1.2) : -60 - Math.random() * 300),
    opacity: new Animated.Value(0.15 + Math.random() * 0.65),
    speed: 2200 + Math.random() * 3500,
    fontSize: 11 + Math.floor(Math.random() * 7),
  };
}

export default function SplashScreen({ onFinish, playerName }) {
  const [phase, setPhase] = useState('rain');       // 'rain' | 'converge' | 'done'
  const finishedRef = useRef(false);
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleScale = useRef(new Animated.Value(0.6)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const bnccOpacity = useRef(new Animated.Value(0)).current;
  const whiteFlash = useRef(new Animated.Value(0)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  const handleFinish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (onFinish) onFinish();
  };

  const [drops] = useState(() =>
    Array.from({ length: TOTAL_DROPS }, (_, i) => createDrop(i, true))
  );

  // Animate each drop falling
  useEffect(() => {
    drops.forEach((drop) => {
      const loop = () => {
        drop.anim.setValue(-80 - Math.random() * 200);
        drop.col = Math.floor(Math.random() * COLUMNS);
        drop.bits = Array.from({ length: 4 + Math.floor(Math.random() * 5) }, () =>
          Math.random() > 0.5 ? '1' : '0'
        ).join('');

        Animated.timing(drop.anim, {
          toValue: SCREEN_H + 100,
          duration: drop.speed,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished && phase === 'rain' && !finishedRef.current) loop();
        });
      };

      // Initial staggered fall
      Animated.timing(drop.anim, {
        toValue: SCREEN_H + 100,
        duration: drop.speed,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished && phase === 'rain' && !finishedRef.current) loop();
      });
    });
  }, []);

  // After 2s of rain, show logo
  useEffect(() => {
    const timer = setTimeout(() => {
      if (finishedRef.current) return;
      setPhase('converge');

      // Flash
      Animated.sequence([
        Animated.timing(whiteFlash, {
          toValue: 0.6,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.timing(whiteFlash, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Title
      Animated.parallel([
        Animated.spring(titleScale, {
          toValue: 1,
          friction: 5,
          tension: 60,
          useNativeDriver: true,
        }),
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Subtitle
      setTimeout(() => {
        if (finishedRef.current) return;
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 350);

      // BNCC badge
      setTimeout(() => {
        if (finishedRef.current) return;
        Animated.timing(bnccOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 700);

      // Fade out everything and finish
      setTimeout(() => {
        if (finishedRef.current) return;
        Animated.timing(containerOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          handleFinish();
        });
      }, 2400);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      {/* Binary Rain Drops */}
      {drops.map((drop) => (
        <Animated.Text
          key={drop.id}
          style={[
            styles.bitDrop,
            {
              left: drop.col * COL_W + COL_W * 0.1,
              fontSize: drop.fontSize,
              opacity: drop.opacity,
              transform: [{ translateY: drop.anim }],
            },
          ]}
        >
          {drop.bits.split('').join('\n')}
        </Animated.Text>
      ))}

      {/* Glow overlay at center */}
      <View style={styles.glowOverlay} />

      {/* Flash */}
      <Animated.View style={[styles.flash, { opacity: whiteFlash }]} pointerEvents="none" />

      {/* Logo Area */}
      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../../assets/logo.jpg')}
          style={[
            styles.splashLogoImg,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
          resizeMode="contain"
        />

        <Animated.View
          style={[
            styles.bnccBadge,
            { opacity: bnccOpacity },
          ]}
        >
          <Text style={styles.bnccText}>BNCC EM13CHS103 • EM13CO13</Text>
        </Animated.View>

        <Animated.Text
          style={[
            styles.title,
            {
              opacity: titleOpacity,
              transform: [{ scale: titleScale }],
            },
          ]}
        >
          História{'\n'}em Bits
        </Animated.Text>

        <Animated.Text style={[styles.subtitle, { opacity: subtitleOpacity }]}>
          Era das Revoluções • Cooperativo Local
        </Animated.Text>

        {playerName ? (
          <Animated.View style={[styles.playerBadge, { opacity: subtitleOpacity }]}>
            <Text style={styles.playerBadgeText}>👤 Conectando: {playerName}</Text>
          </Animated.View>
        ) : null}

        <Animated.Text style={[styles.authors, { opacity: subtitleOpacity }]}>
          Andresa F. • Fernanda A. • Pâmela A.
        </Animated.Text>

        {/* Skip button */}
        <TouchableOpacity style={styles.skipBtn} onPress={handleFinish}>
          <Text style={styles.skipBtnText}>Pular abertura ➔</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#020617',
    zIndex: 999,
  },
  bitDrop: {
    position: 'absolute',
    color: '#38BDF8',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    lineHeight: 16,
    textShadowColor: '#38BDF8',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  glowOverlay: {
    position: 'absolute',
    top: SCREEN_H * 0.25,
    left: SCREEN_W * 0.1,
    width: SCREEN_W * 0.8,
    height: SCREEN_H * 0.5,
    borderRadius: SCREEN_W * 0.4,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFFFFF',
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  splashLogoImg: {
    width: 90,
    height: 90,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  bnccBadge: {
    backgroundColor: 'rgba(30, 27, 75, 0.85)',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4338CA',
    marginBottom: 14,
  },
  bnccText: {
    color: '#A5B4FC',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 44,
    fontWeight: '900',
    color: '#38BDF8',
    textAlign: 'center',
    lineHeight: 50,
    textShadowColor: 'rgba(56, 189, 248, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
    marginTop: 10,
    textAlign: 'center',
  },
  playerBadge: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginTop: 12,
  },
  playerBadgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: 'bold',
  },
  authors: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
  },
  skipBtn: {
    marginTop: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderWidth: 1,
    borderColor: '#475569',
  },
  skipBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
});
