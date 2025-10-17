// Export color palette for both frontend and backend consistency
export const CANVAS_COLORS = {
  indigo: '#4f46e5',
  purple: '#7c3aed',
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  gray: '#6b7280',
  slate: '#64748b',
  zinc: '#71717a',
  'indigo-light': '#e0e7ff',
  'red-light': '#fee2e2',
  'green-light': '#dcfce7',
  'blue-light': '#dbeafe',
  'yellow-light': '#fef08a',
  'orange-light': '#ffedd5',
  'indigo-dark': '#312e81',
  'red-dark': '#7f1d1d',
  'green-dark': '#15803d',
  'blue-dark': '#1e40af',
  'yellow-dark': '#ca8a04',
  'orange-dark': '#92400e',
  white: '#ffffff',
  'gray-900': '#111827',
  'gray-800': '#1f2937',
  'gray-700': '#374151',
} as const

export type ColorName = keyof typeof CANVAS_COLORS

export function getColorHex(colorName: string): string {
  const normalized = colorName.toLowerCase().trim()
  return CANVAS_COLORS[normalized as ColorName] || CANVAS_COLORS.indigo
}

export function getAllColorEntries(): [ColorName, string][] {
  return Object.entries(CANVAS_COLORS) as [ColorName, string][]
}
