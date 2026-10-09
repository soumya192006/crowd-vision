// Deterministic color generation for ByteTrack IDs
// Generates distinguishable, vibrant bounding box colors based on Track ID
const PALETTE = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
  '#84cc16', // lime
  '#e11d48', // rose
  '#0284c7', // sky
];

export function getTrackColor(trackId: number): string {
  const index = Math.abs(trackId) % PALETTE.length;
  return PALETTE[index];
}

export function hexToRgba(hex: string, alpha: number = 0.2): string {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.substring(0, 2), 16);
  const g = parseInt(cleaned.substring(2, 4), 16);
  const b = parseInt(cleaned.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
