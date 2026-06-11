/**
 * Outline activity indicator colors; left-border accents on activity
 * rows in the outline tree. Schema authors pick a token per activity
 * type. Reuse across schemas is encouraged; within a single schema,
 * two activity types must not share a token.
 */
export const OUTLINE_COLOR = {
  // Neutral tones; for top-level / structural / organisational types.
  // The deeper one anchors hierarchy; the lighter one recedes.
  NEUTRAL_1: '#4F5662', // deep slate
  NEUTRAL_2: '#6A7A8D', // mid slate
  // Accent tones; for content and specialised activity types.
  // Hue-stepped around the wheel so adjacent indices are visually distinct.
  ACCENT_1: '#28A284', // teal
  ACCENT_2: '#85AF43', // yellow-green
  ACCENT_3: '#D39736', // gold
  ACCENT_4: '#D06A3F', // orange
  ACCENT_5: '#C0578C', // pink
  ACCENT_6: '#8B64CD', // violet
} as const;
