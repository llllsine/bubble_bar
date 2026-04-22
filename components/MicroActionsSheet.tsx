/**
 * MicroActionsSheet – frosted half-sheet shown on bubble double-tap.
 * Lists AI-generated 5–10 min micro-actions with checkboxes.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Task } from '../types/task';
import { GLASS, URGENCY_COLORS } from '../constants/colors';
import { useTaskStore } from '../store/taskStore';
import { GlassButton } from './GlassButton';

interface Props {
  task: Task | null;
  onClose: () => void;
}

export const MicroActionsSheet: React.FC<Props> = ({ task, onClose }) => {
  const { toggleMicroAction, completeTask } = useTaskStore();
  if (!task) return null;

  const accentColor = URGENCY_COLORS[Math.max(0, (task.urgency ?? 3) - 1)];
  const allDone = task.microActions.every((a) => a.done);

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheetContainer}>
        <BlurView intensity={55} tint="dark" style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handle} />

          <Text style={styles.title}>{task.title}</Text>
          <Text style={styles.subtitle}>AI 拆解 · 5-10 分钟微动作</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {task.microActions.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.actionRow}
                onPress={() => toggleMicroAction(task.id, action.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, action.done && { backgroundColor: accentColor, borderColor: accentColor }]}>
                  {action.done && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={[styles.actionText, action.done && styles.actionDone]}>
                  {action.text}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {allDone && (
            <GlassButton
              label="标记为完成 ✦"
              onPress={() => { completeTask(task.id); onClose(); }}
              style={styles.completeBtn}
            />
          )}

          <GlassButton label="关闭" onPress={onClose} variant="ghost" style={styles.closeBtn} />
        </BlurView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.40)',
  },
  sheetContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 14,
    paddingHorizontal: 22,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: GLASS.border,
    borderBottomWidth: 0,
    minHeight: 360,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: GLASS.border,
    marginBottom: 18,
  },
  title: {
    color: GLASS.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    color: GLASS.textSecondary,
    fontSize: 12,
    marginBottom: 18,
  },
  list: {
    maxHeight: 300,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GLASS.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: GLASS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionText: {
    color: GLASS.textPrimary,
    fontSize: 14,
    flex: 1,
  },
  actionDone: {
    color: GLASS.textSecondary,
    textDecorationLine: 'line-through',
  },
  completeBtn: {
    marginTop: 18,
  },
  closeBtn: {
    marginTop: 10,
  },
});
