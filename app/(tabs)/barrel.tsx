/**
 * 橡木酒桶 (The Barrel) – deferred tasks aging view
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { useTaskStore } from '../../store/taskStore';
import { Task } from '../../types/task';
import { GLASS, URGENCY_COLORS, BRAND } from '../../constants/colors';
import { GlassButton } from '../../components/GlassButton';
import { MascotMessage } from '../../components/MascotMessage';

const DAY_MS = 24 * 60 * 60 * 1000;

function daysAged(task: Task): number {
  if (!task.agedAt) return 0;
  return Math.floor((Date.now() - task.agedAt) / DAY_MS);
}

function daysLeft(task: Task): number {
  if (!task.agingDeadline) return 0;
  return Math.max(0, Math.ceil((task.agingDeadline - Date.now()) / DAY_MS));
}

export default function BarrelScreen() {
  const { getAgingTasks, recallTask, removeTask } = useTaskStore();
  const agingTasks = getAgingTasks();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [mascotMsg, setMascotMsg] = useState('');

  const handleRecall = (task: Task) => {
    const aged = daysAged(task);
    setSelectedTask(null);
    recallTask(task.id);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMascotMsg(`经过 ${aged} 天的陈酿，现在的你处理起来会更得心应手 🌿`);
    setMascotVisible(true);
    setTimeout(() => setMascotVisible(false), 5000);
  };

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#1A0A2E', '#2D1B5E', '#1A0A2E']}
        style={StyleSheet.absoluteFill}
      />
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.barrelEmoji}>🛢</Text>
          <Text style={styles.title}>橡木酒桶</Text>
          <Text style={styles.subtitle}>陈酿中的任务，21 天后醒来</Text>
        </View>

        {agingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🍶</Text>
            <Text style={styles.emptyText}>酒桶空空如也{'\n'}从主界面长按气泡拖入酒桶</Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {agingTasks.map((task) => {
              const aged    = daysAged(task);
              const left    = daysLeft(task);
              const percent = Math.min(1, aged / 21);
              const accent  = URGENCY_COLORS[Math.max(0, (task.urgency ?? 3) - 1)];
              return (
                <TouchableOpacity
                  key={task.id}
                  onPress={() => setSelectedTask(task)}
                  activeOpacity={0.75}
                >
                  <BlurView intensity={22} tint="dark" style={[styles.card, { borderColor: accent + '44' }]}>
                    <View style={styles.cardTop}>
                      <Text style={styles.cardTitle}>{task.title}</Text>
                      <Text style={styles.badge}>陈酿中</Text>
                    </View>
                    {/* Aging progress bar */}
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${percent * 100}%`, backgroundColor: accent }]} />
                    </View>
                    <Text style={styles.cardMeta}>
                      已陈酿 {aged} 天 · 还剩 {left} 天
                    </Text>
                  </BlurView>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>

      {/* Recall detail modal */}
      {selectedTask && (
        <Modal transparent animationType="slide" onRequestClose={() => setSelectedTask(null)}>
          <Pressable style={styles.backdrop} onPress={() => setSelectedTask(null)} />
          <View style={styles.sheetOuter}>
            <BlurView intensity={55} tint="dark" style={styles.sheet}>
              <View style={styles.handle} />
              <Text style={styles.sheetTitle}>{selectedTask.title}</Text>
              <Text style={styles.sheetMeta}>
                陈酿 {daysAged(selectedTask)} 天 · 还剩 {daysLeft(selectedTask)} 天
              </Text>
              <Text style={styles.slothQuote}>
                🦥 苔藓树懒说：「经过 {daysAged(selectedTask)} 天的陈酿，现在的你处理起来会更得心应手。」
              </Text>
              <GlassButton
                label="召回气泡 ↑"
                onPress={() => handleRecall(selectedTask)}
                style={styles.recallBtn}
              />
              <GlassButton
                label="永久丢弃"
                onPress={() => { removeTask(selectedTask.id); setSelectedTask(null); }}
                variant="danger"
                style={{ marginTop: 10 }}
              />
              <GlassButton
                label="继续陈酿"
                onPress={() => setSelectedTask(null)}
                variant="ghost"
                style={{ marginTop: 10 }}
              />
            </BlurView>
          </View>
        </Modal>
      )}

      <MascotMessage mascot="sloth" message={mascotMsg} visible={mascotVisible} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  safe:     { flex: 1 },
  header:   { alignItems: 'center', paddingVertical: 24 },
  barrelEmoji: { fontSize: 44 },
  title:    { color: '#fff', fontSize: 24, fontWeight: '800', marginTop: 8 },
  subtitle: { color: GLASS.textSecondary, fontSize: 13, marginTop: 4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyEmoji: { fontSize: 48 },
  emptyText:  { color: GLASS.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 22 },

  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cardTitle: { color: GLASS.textPrimary, fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    color: '#C9A84C',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(201,168,76,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: { height: '100%', borderRadius: 2 },
  cardMeta: { color: GLASS.textSecondary, fontSize: 12 },

  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheetOuter: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 14, paddingHorizontal: 22, paddingBottom: 44,
    borderWidth: 1, borderColor: GLASS.border, borderBottomWidth: 0,
  },
  handle: { alignSelf: 'center', width: 44, height: 4, borderRadius: 2, backgroundColor: GLASS.border, marginBottom: 18 },
  sheetTitle: { color: GLASS.textPrimary, fontSize: 18, fontWeight: '700' },
  sheetMeta:  { color: GLASS.textSecondary, fontSize: 12, marginTop: 4, marginBottom: 16 },
  slothQuote: { color: '#C9A84C', fontSize: 13, lineHeight: 20, marginBottom: 22, fontStyle: 'italic' },
  recallBtn:  { marginTop: 4 },
});
