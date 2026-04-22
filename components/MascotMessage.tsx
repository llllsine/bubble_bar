/**
 * MascotMessage – non-intrusive floating tip bubble from mascots.
 * Appears for 4 seconds then fades out.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS } from '../constants/colors';

export type Mascot = 'magpie' | 'sloth';

interface Props {
  mascot: Mascot;
  message: string;
  visible: boolean;
}

const MASCOT_EMOJI: Record<Mascot, string> = {
  magpie: '🦅',
  sloth:  '🦥',
};

export const MascotMessage: React.FC<Props> = ({ mascot, message, visible }) => {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.spring(opacity, { toValue: 1, useNativeDriver: true, speed: 14 }),
        Animated.delay(3500),
        Animated.timing(opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, message]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <BlurView intensity={35} tint="dark" style={styles.bubble}>
        <Text style={styles.emoji}>{MASCOT_EMOJI[mascot]}</Text>
        <View style={styles.textWrapper}>
          <Text style={styles.name}>{mascot === 'magpie' ? '秘银喜鹊' : '苔藓树懒'}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </BlurView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GLASS.border,
  },
  emoji: {
    fontSize: 26,
  },
  textWrapper: {
    flex: 1,
  },
  name: {
    color: GLASS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 3,
  },
  message: {
    color: GLASS.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
});
