/**
 * BubbleItem – a single animated task bubble.
 *
 * Features:
 *  - Radius scales with importance
 *  - Fill colour maps urgency → URGENCY_COLORS
 *  - Inner turbidity (opacity of fill layer) maps energyCost
 *  - Breathing animation (spring scale loop)
 *  - Double-tap → onDoubleTap callback
 *  - Long-press drag → calls onDragEnd(x,y) for barrel drop
 *  - Focus mode: non-focused bubbles shrink + move to edge
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Task } from '../types/task';
import { URGENCY_COLORS, CATEGORY_TINT, BUBBLE_RADIUS, GLASS } from '../constants/colors';

interface Props {
  task: Task;
  isFocused: boolean;      // true = center spotlight in focus mode
  viewMode: 'panorama' | 'focus';
  barrelY: number;         // screen Y of barrel icon (for drop detection)
  onDoubleTap: (task: Task) => void;
  onDrop: (task: Task) => void;   // called when dropped on barrel
}

function bubbleRadius(importance: number) {
  const { min, max } = BUBBLE_RADIUS;
  return min + ((importance - 1) / 4) * (max - min);
}

export const BubbleItem: React.FC<Props> = ({
  task,
  isFocused,
  viewMode,
  barrelY,
  onDoubleTap,
  onDrop,
}) => {
  const radius      = bubbleRadius(task.importance);
  const urgencyIdx  = Math.max(0, Math.min(4, (task.urgency ?? 3) - 1));
  const accentColor = URGENCY_COLORS[urgencyIdx];
  const categoryGlow = CATEGORY_TINT[task.category] ?? accentColor;

  // Turbidity: high energyCost = more opaque fill
  const fillOpacity = 0.25 + (task.energyCost / 5) * 0.45;

  // --- Positions ---
  const posX = useRef(new Animated.Value(task.x ?? 0)).current;
  const posY = useRef(new Animated.Value(task.y ?? 0)).current;
  useEffect(() => {
    if (task.x !== undefined) Animated.spring(posX, { toValue: task.x, useNativeDriver: true, speed: 12, bounciness: 2 }).start();
    if (task.y !== undefined) Animated.spring(posY, { toValue: task.y, useNativeDriver: true, speed: 12, bounciness: 2 }).start();
  }, [task.x, task.y]);

  // --- Breathing animation ---
  const breathScale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.spring(breathScale, { toValue: 1.05, useNativeDriver: true, speed: 0.6, bounciness: 8 }),
        Animated.spring(breathScale, { toValue: 1.00, useNativeDriver: true, speed: 0.6, bounciness: 8 }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  // --- Focus mode opacity / scale ---
  const focusOpacity = useRef(new Animated.Value(1)).current;
  const focusScale   = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (viewMode === 'focus') {
      Animated.parallel([
        Animated.spring(focusOpacity, { toValue: isFocused ? 1 : 0.28, useNativeDriver: true, speed: 8 }),
        Animated.spring(focusScale,   { toValue: isFocused ? 1 : 0.72, useNativeDriver: true, speed: 8 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(focusOpacity, { toValue: 1, useNativeDriver: true, speed: 8 }),
        Animated.spring(focusScale,   { toValue: 1, useNativeDriver: true, speed: 8 }),
      ]).start();
    }
  }, [viewMode, isFocused]);

  // --- Double-tap detection ---
  const lastTap = useRef(0);
  const handleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      onDoubleTap(task);
    }
    lastTap.current = now;
  }, [task, onDoubleTap]);

  // --- Long-press drag for barrel drop ---
  const dragX = useRef(new Animated.Value(0)).current;
  const dragY = useRef(new Animated.Value(0)).current;
  const dragging = useRef(false);
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      onPanResponderGrant: (e) => {
        dragging.current = true;
        dragOffsetX.current = (task.x ?? 0);
        dragOffsetY.current = (task.y ?? 0);
      },
      onPanResponderMove: (_, g) => {
        dragX.setValue(g.dx);
        dragY.setValue(g.dy);
      },
      onPanResponderRelease: (e, g) => {
        dragging.current = false;
        dragX.setValue(0);
        dragY.setValue(0);
        const finalY = dragOffsetY.current + g.dy;
        if (finalY > barrelY - 60) {
          onDrop(task);
        }
      },
    })
  ).current;

  const diameter = radius * 2;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.absoluteWrapper,
        {
          width: diameter,
          height: diameter,
          transform: [
            { translateX: Animated.add(posX, dragX) },
            { translateY: Animated.add(posY, dragY) },
            { translateX: -radius },
            { translateY: -radius },
            { scale: Animated.multiply(breathScale, focusScale) },
          ],
          opacity: focusOpacity,
        },
      ]}
    >
      <TouchableOpacity onPress={handleTap} activeOpacity={0.85} style={{ flex: 1 }}>
        <BlurView intensity={22} tint="dark" style={[styles.bubble, { borderRadius: radius, borderColor: accentColor + '66' }]}>
          {/* Turbid fill */}
          <View style={[StyleSheet.absoluteFill, { borderRadius: radius, backgroundColor: accentColor, opacity: fillOpacity }]} />
          {/* Category glow ring */}
          <View style={[StyleSheet.absoluteFill, { borderRadius: radius, borderWidth: 1.5, borderColor: categoryGlow + '88' }]} />
          {/* Highlight shimmer */}
          <View style={[styles.highlight, { borderRadius: radius }]} />
          {/* Label */}
          <Text style={styles.label} numberOfLines={2}>{task.title}</Text>
          {/* Priority badge */}
          {isFocused && viewMode === 'focus' && (
            <View style={styles.focusBadge}>
              <Text style={styles.focusBadgeText}>●</Text>
            </View>
          )}
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  absoluteWrapper: {
    position: 'absolute',
  },
  bubble: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
  },
  highlight: {
    position: 'absolute',
    top: 6,
    left: 10,
    width: '40%',
    height: '22%',
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  label: {
    color: GLASS.textPrimary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 8,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  focusBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
  },
  focusBadgeText: {
    color: '#FFD700',
    fontSize: 8,
  },
});
