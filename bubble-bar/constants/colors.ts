// Bubble Bar – global design tokens

export const BRAND = {
  indigo:        '#3D2B8F',
  royalPurple:   '#6B35C8',
  magenta:       '#C026A8',
  deepNavy:      '#0D0A1F',
};

// Urgency gradient: red (urgent) → purple → blue (distant)
export const URGENCY_COLORS = [
  '#FF3B5C', // 1 – urgent red
  '#C026A8', // 2 – magenta
  '#8B5CF6', // 3 – violet
  '#6366F1', // 4 – indigo
  '#3B82F6', // 5 – blue (far future)
];

// Category accent tints used on bubble glow
export const CATEGORY_TINT: Record<string, string> = {
  academic: '#6366F1',
  life:     '#22D3EE',
  creative: '#F472B6',
  recovery: '#34D399',
  focus:    '#FBBF24',
  reward:   '#F59E0B',
};

// Glass surface tokens
export const GLASS = {
  surface:        'rgba(255,255,255,0.08)',
  surfaceStrong:  'rgba(255,255,255,0.14)',
  border:         'rgba(255,255,255,0.20)',
  borderFocus:    'rgba(255,255,255,0.45)',
  shadow:         'rgba(0,0,0,0.40)',
  textPrimary:    '#FFFFFF',
  textSecondary:  'rgba(255,255,255,0.60)',
};

// Radius range in pixels (mapped from importance 1-5)
export const BUBBLE_RADIUS = { min: 42, max: 76 };
