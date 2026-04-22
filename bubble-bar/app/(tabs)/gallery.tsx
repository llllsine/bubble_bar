/**
 * 荣誉展柜 (The Gallery) – completed tasks as crystallised cups
 * - Cup shape varies by category
 * - Timeline "drinks menu" scroll view
 * - Auto-stacking 3D sculpture (simulated with Z-offset + scale)
 */
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTaskStore } from '../../store/taskStore';
import { Task, TaskCategory } from '../../types/task';
import { GLASS, CATEGORY_TINT, URGENCY_COLORS } from '../../constants/colors';

// Cup shape by category
const CUP_SHAPE: Record<TaskCategory, { emoji: string; label: string }> = {
  academic:  { emoji: '🔷', label: '方冰杯' },
  life:      { emoji: '🫧', label: '苏打杯' },
  creative:  { emoji: '✨', label: '流光杯' },
  recovery:  { emoji: '🌿', label: '草本杯' },
  focus:     { emoji: '💎', label: '晶石杯' },
  reward:    { emoji: '🏆', label: '金冠杯' },
};

function dateStr(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

// Sculpture: stack cups with slight Z perspective offset
const SculptureItem: React.FC<{ task: Task; index: number; total: number }> = ({ task, index, total }) => {
  const cup     = CUP_SHAPE[task.category];
  const tint    = CATEGORY_TINT[task.category];
  const scale   = 1 - index * 0.04;
  const offsetY = -(index * 14);

  return (
    <Animated.View
      style={{
        alignItems: 'center',
        marginTop: index === 0 ? 0 : -32,
        transform: [{ scale }, { translateY: offsetY }],
        zIndex: total - index,
      }}
    >
      <BlurView intensity={30} tint="dark" style={[styles.cupSculpture, { borderColor: tint + '66' }]}>
        <Text style={styles.cupEmoji}>{cup.emoji}</Text>
      </BlurView>
    </Animated.View>
  );
};

export default function GalleryScreen() {
  const { getCompletedTasks } = useTaskStore();
  const completed = useMemo(
    () => getCompletedTasks().sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0)),
    [getCompletedTasks()]
  );

  // Group by date for timeline
  const grouped = useMemo(() => {
    const map: Record<string, Task[]> = {};
    completed.forEach((t) => {
      const key = t.completedAt ? dateStr(t.completedAt) : '未知';
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return Object.entries(map);
  }, [completed]);

  // Top N for sculpture display
  const sculptureItems = completed.slice(0, 8);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0D0A1F', '#1A1040', '#0D0A1F']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.title}>荣誉展柜</Text>
          <Text style={styles.subtitle}>{completed.length} 个任务已化为晶莹酒杯</Text>
        </View>

        {completed.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🫗</Text>
            <Text style={styles.emptyText}>展柜空空如也{'\n'}完成第一个任务，看它晶体化吧</Text>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* 3D Sculpture */}
            <View style={styles.sculptureSection}>
              <Text style={styles.sectionLabel}>成就雕塑</Text>
              <View style={styles.sculptureContainer}>
                {sculptureItems.map((t, i) => (
                  <SculptureItem key={t.id} task={t} index={i} total={sculptureItems.length} />
                ))}
              </View>
            </View>

            {/* Timeline */}
            <View style={styles.timelineSection}>
              <Text style={styles.sectionLabel}>调酒日志</Text>
              {grouped.map(([date, tasks]) => (
                <View key={date} style={styles.dateGroup}>
                  <View style={styles.dateLine}>
                    <View style={styles.dateDot} />
                    <Text style={styles.dateText}>{date}</Text>
                  </View>
                  {tasks.map((task) => {
                    const cup   = CUP_SHAPE[task.category];
                    const tint  = CATEGORY_TINT[task.category];
                    const accentIdx = Math.max(0, (task.urgency ?? 3) - 1);
                    return (
                      <BlurView
                        key={task.id}
                        intensity={18}
                        tint="dark"
                        style={[styles.timelineCard, { borderColor: tint + '44' }]}
                      >
                        <Text style={styles.cupEmojiSmall}>{cup.emoji}</Text>
                        <View style={styles.cardBody}>
                          <Text style={styles.cardTitle}>{task.title}</Text>
                          <Text style={[styles.cardMeta, { color: tint }]}>
                            {cup.label} · {task.category}
                          </Text>
                        </View>
                        <View style={[styles.urgencyDot, { backgroundColor: URGENCY_COLORS[accentIdx] }]} />
                      </BlurView>
                    );
                  })}
                </View>
              ))}
            </View>
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: { alignItems: 'center', paddingVertical: 20 },
  title:    { color: '#fff', fontSize: 24, fontWeight: '800' },
  subtitle: { color: GLASS.textSecondary, fontSize: 13, marginTop: 4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyEmoji: { fontSize: 52 },
  emptyText:  { color: GLASS.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },

  sculptureSection:  { alignItems: 'center', paddingVertical: 24 },
  sectionLabel: { color: GLASS.textSecondary, fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 16 },
  sculptureContainer: { alignItems: 'center', minHeight: 80 },

  cupSculpture: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  cupEmoji: { fontSize: 28 },

  timelineSection: { paddingHorizontal: 20, paddingBottom: 40 },
  dateGroup: { marginBottom: 20 },
  dateLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dateDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: GLASS.border },
  dateText: { color: GLASS.textSecondary, fontSize: 12 },

  timelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
    overflow: 'hidden',
  },
  cupEmojiSmall: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { color: GLASS.textPrimary, fontSize: 14, fontWeight: '600' },
  cardMeta:  { fontSize: 11, marginTop: 2 },
  urgencyDot: { width: 8, height: 8, borderRadius: 4 },
});
