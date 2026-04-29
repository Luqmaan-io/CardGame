export type CardFaceDesign = {
  id: string
  name: string
  tier: number
  unlockType: 'default' | 'games_played' | 'games_won'
  unlockCount: number
  description: string
  bgColour: string          // card face background
  rankColourRed: string     // hearts / diamonds rank + suit colour
  rankColourBlack: string   // clubs / spades rank + suit colour
  borderColour: string      // card face border
  borderWidth: number       // card face border width (px)
  cornerStyle: 'standard' | 'rounded' | 'sharp'  // corner accent style
}

// ─── face_00 — Classic Cream ──────────────────────────────────────────────────
const face00: CardFaceDesign = {
  id: 'face_00',
  name: 'Classic Cream',
  tier: 0,
  unlockType: 'default',
  unlockCount: 0,
  description: 'The default warm-cream face. Timeless.',
  bgColour: '#F5F0E8',
  rankColourRed: '#E24B4A',
  rankColourBlack: '#1A1A2E',
  borderColour: '#D4C9B0',
  borderWidth: 1,
  cornerStyle: 'standard',
}

// ─── face_01 — Ivory & Crimson ────────────────────────────────────────────────
const face01: CardFaceDesign = {
  id: 'face_01',
  name: 'Ivory & Crimson',
  tier: 1,
  unlockType: 'games_played',
  unlockCount: 5,
  description: 'Pure ivory with deeper crimson reds for a refined look.',
  bgColour: '#FDFAF4',
  rankColourRed: '#C0282A',
  rankColourBlack: '#111111',
  borderColour: '#C0282A',
  borderWidth: 1.5,
  cornerStyle: 'standard',
}

// ─── face_02 — Midnight Slate ─────────────────────────────────────────────────
const face02: CardFaceDesign = {
  id: 'face_02',
  name: 'Midnight Slate',
  tier: 2,
  unlockType: 'games_played',
  unlockCount: 15,
  description: 'Dark charcoal face — dramatic contrast for late-night sessions.',
  bgColour: '#1E2530',
  rankColourRed: '#FF6B6B',
  rankColourBlack: '#E8E8E8',
  borderColour: '#3A4455',
  borderWidth: 1,
  cornerStyle: 'standard',
}

// ─── face_03 — Forest Green ───────────────────────────────────────────────────
const face03: CardFaceDesign = {
  id: 'face_03',
  name: 'Forest Green',
  tier: 2,
  unlockType: 'games_played',
  unlockCount: 20,
  description: 'Deep green face inspired by the table felt itself.',
  bgColour: '#1A3328',
  rankColourRed: '#F08080',
  rankColourBlack: '#C8DCC4',
  borderColour: '#2D5440',
  borderWidth: 1,
  cornerStyle: 'rounded',
}

// ─── face_04 — Gold Leaf ──────────────────────────────────────────────────────
const face04: CardFaceDesign = {
  id: 'face_04',
  name: 'Gold Leaf',
  tier: 3,
  unlockType: 'games_won',
  unlockCount: 10,
  description: 'Warm parchment with gold accents. Winners only.',
  bgColour: '#F8F0D8',
  rankColourRed: '#9B2020',
  rankColourBlack: '#3D2B00',
  borderColour: '#C9A84C',
  borderWidth: 2,
  cornerStyle: 'standard',
}

// ─── face_05 — Bone & Ink ─────────────────────────────────────────────────────
const face05: CardFaceDesign = {
  id: 'face_05',
  name: 'Bone & Ink',
  tier: 1,
  unlockType: 'games_played',
  unlockCount: 10,
  description: 'Off-white with stark ink-black suits. High contrast.',
  bgColour: '#F0EDE5',
  rankColourRed: '#D63030',
  rankColourBlack: '#0A0A0A',
  borderColour: '#0A0A0A',
  borderWidth: 1.5,
  cornerStyle: 'sharp',
}

// ─── face_06 — Royal Blue ─────────────────────────────────────────────────────
const face06: CardFaceDesign = {
  id: 'face_06',
  name: 'Royal Blue',
  tier: 3,
  unlockType: 'games_played',
  unlockCount: 30,
  description: 'Deep blue face with bright suit colours — regal and bold.',
  bgColour: '#0F1E3D',
  rankColourRed: '#FF4D6D',
  rankColourBlack: '#78C0FF',
  borderColour: '#1A4A8A',
  borderWidth: 1,
  cornerStyle: 'rounded',
}

// ─── face_07 — Rose Quartz ────────────────────────────────────────────────────
const face07: CardFaceDesign = {
  id: 'face_07',
  name: 'Rose Quartz',
  tier: 2,
  unlockType: 'games_played',
  unlockCount: 25,
  description: 'Soft blush background — understated elegance.',
  bgColour: '#FAF0F0',
  rankColourRed: '#C44444',
  rankColourBlack: '#3A2030',
  borderColour: '#E8AAAA',
  borderWidth: 1.5,
  cornerStyle: 'rounded',
}

// ─── face_08 — Obsidian ───────────────────────────────────────────────────────
const face08: CardFaceDesign = {
  id: 'face_08',
  name: 'Obsidian',
  tier: 4,
  unlockType: 'games_won',
  unlockCount: 25,
  description: 'Near-black face with glowing suit colours. Rare.',
  bgColour: '#0D0D10',
  rankColourRed: '#FF3A3A',
  rankColourBlack: '#FFFFFF',
  borderColour: '#2A2A30',
  borderWidth: 0.5,
  cornerStyle: 'sharp',
}

// ─── face_09 — Gilded Night ───────────────────────────────────────────────────
const face09: CardFaceDesign = {
  id: 'face_09',
  name: 'Gilded Night',
  tier: 5,
  unlockType: 'games_won',
  unlockCount: 50,
  description: 'The rarest face — deep navy with gold rank glyphs.',
  bgColour: '#0D1B2A',
  rankColourRed: '#C9A84C',
  rankColourBlack: '#C9A84C',
  borderColour: '#C9A84C',
  borderWidth: 1.5,
  cornerStyle: 'standard',
}

export const CARD_FACES: CardFaceDesign[] = [
  face00,
  face01,
  face02,
  face03,
  face04,
  face05,
  face06,
  face07,
  face08,
  face09,
]

export const CARD_FACES_MAP: Record<string, CardFaceDesign> = Object.fromEntries(
  CARD_FACES.map(f => [f.id, f])
)
