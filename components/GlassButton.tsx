/**
 * GlassButton – reusable frosted-glass button component.
 * Renders a BlurView background with a subtle border highlight.
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GLASS } from '../constants/colors';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  icon?: React.ReactNode;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  style,
  textStyle,
}) => {
  const borderColor =
    variant === 'danger'
      ? 'rgba(255,59,92,0.55)'
      : variant === 'ghost'
      ? GLASS.border
      : GLASS.borderFocus;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={[styles.wrapper, style]}>
      <BlurView intensity={28} tint="dark" style={[styles.blur, { borderColor }]}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, textStyle]}>{label}</Text>
          </>
        )}
      </BlurView>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  blur: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderWidth: 1,
    borderRadius: 16,
  },
  label: {
    color: GLASS.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
