export type CardBackDesign = {
  id: string
  name: string
  tier: number
  unlockType: 'default' | 'games_played' | 'games_won'
  unlockCount: number
  description: string
  svgContent: string  // SVG elements only, no outer <svg> tag
  bgColour: string
  accentColour: string
  isAnimated?: boolean
}

// ─── Design 0 — The Default ────────────────────────────────────────────────────
const back00: CardBackDesign = {
  id: 'back_00',
  name: 'The Default',
  tier: 0,
  unlockType: 'default',
  unlockCount: 0,
  description: 'The classic Powerstack design. Navy with gold diamond lattice.',
  bgColour: '#0D1B2A',
  accentColour: '#C9A84C',
  svgContent: `
<defs>
  <pattern id="b00-lattice" patternUnits="userSpaceOnUse" width="28" height="28">
    <path d="M14 0L28 14L14 28L0 14Z" fill="none" stroke="rgba(201,168,76,0.18)" stroke-width="0.6"/>
    <circle cx="14" cy="0" r="1.2" fill="rgba(201,168,76,0.3)"/>
    <circle cx="0" cy="14" r="1.2" fill="rgba(201,168,76,0.3)"/>
    <circle cx="28" cy="14" r="1.2" fill="rgba(201,168,76,0.3)"/>
    <circle cx="14" cy="28" r="1.2" fill="rgba(201,168,76,0.3)"/>
  </pattern>
</defs>
<rect width="200" height="300" fill="url(#b00-lattice)"/>
<rect x="5" y="5" width="190" height="290" rx="6" fill="none" stroke="#C9A84C" stroke-width="1.5"/>
<rect x="10" y="10" width="180" height="280" rx="4" fill="none" stroke="rgba(201,168,76,0.28)" stroke-width="0.5"/>
<path d="M5 24 Q5 5 24 5" stroke="#C9A84C" stroke-width="1.2" fill="none"/>
<path d="M5 18 Q5 5 18 5" stroke="rgba(201,168,76,0.5)" stroke-width="0.6" fill="none"/>
<circle cx="5" cy="5" r="2" fill="#C9A84C"/>
<path d="M195 24 Q195 5 176 5" stroke="#C9A84C" stroke-width="1.2" fill="none"/>
<path d="M195 18 Q195 5 182 5" stroke="rgba(201,168,76,0.5)" stroke-width="0.6" fill="none"/>
<circle cx="195" cy="5" r="2" fill="#C9A84C"/>
<path d="M5 276 Q5 295 24 295" stroke="#C9A84C" stroke-width="1.2" fill="none"/>
<path d="M5 282 Q5 295 18 295" stroke="rgba(201,168,76,0.5)" stroke-width="0.6" fill="none"/>
<circle cx="5" cy="295" r="2" fill="#C9A84C"/>
<path d="M195 276 Q195 295 176 295" stroke="#C9A84C" stroke-width="1.2" fill="none"/>
<path d="M195 282 Q195 295 182 295" stroke="rgba(201,168,76,0.5)" stroke-width="0.6" fill="none"/>
<circle cx="195" cy="295" r="2" fill="#C9A84C"/>
<path d="M100 110L140 150L100 190L60 150Z" fill="none" stroke="rgba(201,168,76,0.38)" stroke-width="1"/>
<path d="M100 120L132 150L100 180L68 150Z" fill="none" stroke="rgba(201,168,76,0.18)" stroke-width="0.5"/>
<path d="M105 124L92 148L101 148L95 176L108 152L99 152Z" fill="rgba(201,168,76,0.5)"/>
<polygon points="100,32 102,38 108,38 103,42 105,48 100,44 95,48 97,42 92,38 98,38" fill="rgba(201,168,76,0.45)"/>
<polygon points="100,262 102,268 108,268 103,272 105,278 100,274 95,278 97,272 92,268 98,268" fill="rgba(201,168,76,0.45)"/>
<polygon points="28,148 30,154 36,154 31,158 33,164 28,160 23,164 25,158 20,154 26,154" fill="rgba(201,168,76,0.45)"/>
<polygon points="172,148 174,154 180,154 175,158 177,164 172,160 167,164 169,158 164,154 170,154" fill="rgba(201,168,76,0.45)"/>
`,
}

// ─── Design 1 — The Initiate ──────────────────────────────────────────────────
const back01: CardBackDesign = {
  id: 'back_01',
  name: 'The Initiate',
  tier: 1,
  unlockType: 'games_played',
  unlockCount: 10,
  description: 'Burgundy with gold geometric border. Play 10 games to unlock.',
  bgColour: '#4A0E1E',
  accentColour: '#C9A84C',
  svgContent: `
<defs>
  <pattern id="b01-suits" patternUnits="userSpaceOnUse" width="20" height="20">
    <text x="4" y="9" font-size="6" fill="rgba(201,168,76,0.18)" font-family="serif">♠</text>
    <text x="12" y="17" font-size="6" fill="rgba(201,168,76,0.18)" font-family="serif">♥</text>
  </pattern>
  <pattern id="b01-suits2" patternUnits="userSpaceOnUse" width="20" height="20" x="10" y="10">
    <text x="4" y="9" font-size="6" fill="rgba(201,168,76,0.18)" font-family="serif">♦</text>
    <text x="12" y="17" font-size="6" fill="rgba(201,168,76,0.18)" font-family="serif">♣</text>
  </pattern>
</defs>
<rect width="200" height="300" fill="url(#b01-suits)"/>
<rect width="200" height="300" fill="url(#b01-suits2)"/>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#C9A84C" stroke-width="1.5"/>
<line x1="5" y1="5" x2="30" y2="5" stroke="#C9A84C" stroke-width="1.5"/>
<line x1="5" y1="5" x2="5" y2="30" stroke="#C9A84C" stroke-width="1.5"/>
<polygon points="5,5 22,5 5,22" fill="rgba(201,168,76,0.3)"/>
<polygon points="195,5 178,5 195,22" fill="rgba(201,168,76,0.3)"/>
<polygon points="5,295 22,295 5,278" fill="rgba(201,168,76,0.3)"/>
<polygon points="195,295 178,295 195,278" fill="rgba(201,168,76,0.3)"/>
<polygon points="100,5 112,14 108,5" fill="rgba(201,168,76,0.4)"/>
<polygon points="100,5 88,14 92,5" fill="rgba(201,168,76,0.4)"/>
<polygon points="100,295 112,286 108,295" fill="rgba(201,168,76,0.4)"/>
<polygon points="100,295 88,286 92,295" fill="rgba(201,168,76,0.4)"/>
<polygon points="5,150 14,138 14,162" fill="rgba(201,168,76,0.4)"/>
<polygon points="195,150 186,138 186,162" fill="rgba(201,168,76,0.4)"/>
<circle cx="100" cy="150" r="30" fill="none" stroke="rgba(201,168,76,0.4)" stroke-width="1"/>
<circle cx="100" cy="150" r="20" fill="none" stroke="rgba(201,168,76,0.25)" stroke-width="0.7"/>
<path d="M100 130L103 143L118 143L106 151L110 164L100 156L90 164L94 151L82 143L97 143Z" fill="rgba(201,168,76,0.4)"/>
<text x="100" y="185" text-anchor="middle" font-size="10" fill="rgba(201,168,76,0.35)" font-family="serif" letter-spacing="2">⚡ PS ⚡</text>
`,
}

// ─── Design 2 — The Victor ────────────────────────────────────────────────────
const back02: CardBackDesign = {
  id: 'back_02',
  name: 'The Victor',
  tier: 2,
  unlockType: 'games_won',
  unlockCount: 10,
  description: 'Midnight navy with silver constellation. Win 10 games to unlock.',
  bgColour: '#0A0E2A',
  accentColour: '#C0C8E0',
  isAnimated: true,
  svgContent: `
<style>
@keyframes b02-twinkle-a { 0%,100%{opacity:0.4} 50%{opacity:1} }
@keyframes b02-twinkle-b { 0%,100%{opacity:1} 50%{opacity:0.3} }
@keyframes b02-twinkle-c { 0%,100%{opacity:0.6} 33%{opacity:1} 66%{opacity:0.2} }
.b02-t1 { animation: b02-twinkle-a 3s ease-in-out infinite; }
.b02-t2 { animation: b02-twinkle-b 2.4s ease-in-out infinite 0.8s; }
.b02-t3 { animation: b02-twinkle-c 3.8s ease-in-out infinite 0.3s; }
.b02-t4 { animation: b02-twinkle-a 2.1s ease-in-out infinite 1.2s; }
.b02-t5 { animation: b02-twinkle-b 3.2s ease-in-out infinite 0.5s; }
</style>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#C0C8E0" stroke-width="1.2"/>
<rect x="9" y="9" width="182" height="282" rx="3" fill="none" stroke="rgba(192,200,224,0.3)" stroke-width="0.5" stroke-dasharray="3 3"/>
<line x1="50" y1="40" x2="100" y2="70" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="100" y1="70" x2="150" y2="45" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="150" y1="45" x2="165" y2="90" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="165" y1="90" x2="130" y2="120" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="50" y1="40" x2="30" y2="90" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="30" y1="90" x2="60" y2="130" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="60" y1="130" x2="100" y2="70" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="60" y1="130" x2="130" y2="120" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="130" y1="120" x2="100" y2="160" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="100" y1="160" x2="60" y2="130" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="100" y1="160" x2="140" y2="190" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="140" y1="190" x2="170" y2="220" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="30" y1="200" x2="70" y2="230" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="70" y1="230" x2="100" y2="260" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="100" y1="260" x2="140" y2="240" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="140" y1="240" x2="170" y2="260" stroke="rgba(192,200,224,0.2)" stroke-width="0.5"/>
<line x1="30" y1="200" x2="100" y2="160" stroke="rgba(192,200,224,0.15)" stroke-width="0.5"/>
<circle cx="50" cy="40" r="2.5" fill="#C0C8E0" class="b02-t1"/>
<circle cx="100" cy="70" r="2" fill="#C0C8E0" class="b02-t2"/>
<circle cx="150" cy="45" r="2.5" fill="#C0C8E0" class="b02-t3"/>
<circle cx="165" cy="90" r="1.8" fill="#C0C8E0"/>
<circle cx="130" cy="120" r="2" fill="#C0C8E0"/>
<circle cx="30" cy="90" r="2.2" fill="#C0C8E0" class="b02-t4"/>
<circle cx="60" cy="130" r="2.5" fill="#C0C8E0"/>
<circle cx="100" cy="160" r="3" fill="#C0C8E0" class="b02-t5"/>
<circle cx="140" cy="190" r="1.8" fill="#C0C8E0"/>
<circle cx="170" cy="220" r="2" fill="#C0C8E0"/>
<circle cx="30" cy="200" r="2" fill="#C0C8E0" class="b02-t3"/>
<circle cx="70" cy="230" r="1.6" fill="#C0C8E0"/>
<circle cx="100" cy="260" r="2.5" fill="#C0C8E0" class="b02-t1"/>
<circle cx="140" cy="240" r="2" fill="#C0C8E0"/>
<circle cx="170" cy="260" r="1.8" fill="#C0C8E0"/>
<circle cx="80" cy="180" r="1.5" fill="rgba(192,200,224,0.5)"/>
<circle cx="120" cy="210" r="1.5" fill="rgba(192,200,224,0.5)"/>
<circle cx="45" cy="150" r="1.5" fill="rgba(192,200,224,0.5)"/>
<circle cx="160" cy="160" r="1.5" fill="rgba(192,200,224,0.5)"/>
<circle cx="55" cy="260" r="1.5" fill="rgba(192,200,224,0.5)"/>
<circle cx="155" cy="280" r="1.5" fill="rgba(192,200,224,0.5)"/>
`,
}

// ─── Design 3 — The Regular ───────────────────────────────────────────────────
const back03: CardBackDesign = {
  id: 'back_03',
  name: 'The Regular',
  tier: 3,
  unlockType: 'games_played',
  unlockCount: 25,
  description: 'Forest green with Celtic knot border. Play 25 games to unlock.',
  bgColour: '#0F2E1A',
  accentColour: '#8B6914',
  svgContent: `
<defs>
  <pattern id="b03-stripe" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
    <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(139,105,20,0.05)" stroke-width="4"/>
  </pattern>
</defs>
<rect width="200" height="300" fill="url(#b03-stripe)"/>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#8B6914" stroke-width="2"/>
<path d="M5,5 C5,5 15,5 20,12 C25,19 18,26 25,30 C32,34 40,25 40,25 L40,5 Z" fill="none" stroke="#8B6914" stroke-width="1.2"/>
<path d="M195,5 C195,5 185,5 180,12 C175,19 182,26 175,30 C168,34 160,25 160,25 L160,5 Z" fill="none" stroke="#8B6914" stroke-width="1.2"/>
<path d="M5,295 C5,295 15,295 20,288 C25,281 18,274 25,270 C32,266 40,275 40,275 L40,295 Z" fill="none" stroke="#8B6914" stroke-width="1.2"/>
<path d="M195,295 C195,295 185,295 180,288 C175,281 182,274 175,270 C168,266 160,275 160,275 L160,295 Z" fill="none" stroke="#8B6914" stroke-width="1.2"/>
<path d="M40,5 C50,5 55,12 60,12 C65,12 68,5 78,5" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M78,5 C88,5 90,12 95,12 C100,12 102,5 112,5" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M112,5 C122,5 125,12 130,12 C135,12 138,5 148,5" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M148,5 C158,5 160,5 160,5" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M40,295 C50,295 55,288 60,288 C65,288 68,295 78,295" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M78,295 C88,295 90,288 95,288 C100,288 102,295 112,295" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M112,295 C122,295 125,288 130,288 C135,288 138,295 148,295" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,40 C5,50 12,55 12,60 C12,65 5,68 5,78" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,78 C5,88 12,90 12,95 C12,100 5,102 5,112" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,112 C5,122 12,125 12,130 C12,135 5,140 5,150" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,150 C5,160 12,165 12,170 C12,175 5,178 5,188" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,188 C5,198 12,200 12,205 C12,210 5,215 5,225" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M5,225 C5,235 12,240 12,245 C12,250 5,255 5,265" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,40 C195,50 188,55 188,60 C188,65 195,68 195,78" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,78 C195,88 188,90 188,95 C188,100 195,102 195,112" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,112 C195,122 188,125 188,130 C188,135 195,140 195,150" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,150 C195,160 188,165 188,170 C188,175 195,178 195,188" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,188 C195,198 188,200 188,205 C188,210 195,215 195,225" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<path d="M195,225 C195,235 188,240 188,245 C188,250 195,255 195,265" stroke="#8B6914" stroke-width="1.2" fill="none"/>
<rect x="66" y="116" width="68" height="68" fill="none" stroke="rgba(139,105,20,0.35)" stroke-width="0.7" transform="rotate(45 100 150)"/>
<rect x="76" y="126" width="48" height="48" fill="none" stroke="rgba(139,105,20,0.2)" stroke-width="0.5" transform="rotate(45 100 150)"/>
<g transform="translate(100,150)">
  <rect x="-16" y="-24" width="16" height="28" fill="none" stroke="#8B6914" stroke-width="1" transform="rotate(-45)"/>
  <rect x="0" y="-24" width="16" height="28" fill="none" stroke="#8B6914" stroke-width="1" transform="rotate(45)"/>
  <path d="M-10,-34 Q0,-44 10,-34" fill="rgba(139,105,20,0.5)" stroke="#8B6914" stroke-width="0.8"/>
  <line x1="-6" y1="-30" x2="6" y2="-30" stroke="#8B6914" stroke-width="0.8"/>
</g>
`,
}

// ─── Design 4 — The Tactician ─────────────────────────────────────────────────
const back04: CardBackDesign = {
  id: 'back_04',
  name: 'The Tactician',
  tier: 4,
  unlockType: 'games_won',
  unlockCount: 25,
  description: 'Deep purple circuit board pattern. Win 25 games to unlock.',
  bgColour: '#1A0A3A',
  accentColour: '#7B68EE',
  svgContent: `
<defs>
  <filter id="b04-glow">
    <feGaussianBlur stdDeviation="2" result="blur"/>
    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>
<rect x="5" y="5" width="190" height="290" rx="3" fill="none" stroke="#7B68EE" stroke-width="1.5" filter="url(#b04-glow)"/>
<rect x="9" y="9" width="182" height="282" rx="2" fill="none" stroke="rgba(123,104,238,0.3)" stroke-width="0.5"/>
<line x1="30" y1="20" x2="30" y2="60" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="30" y1="60" x2="80" y2="60" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="80" y1="60" x2="80" y2="90" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="80" y1="90" x2="120" y2="90" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="120" y1="90" x2="120" y2="40" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="120" y1="40" x2="170" y2="40" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="170" y1="40" x2="170" y2="80" stroke="rgba(123,104,238,0.4)" stroke-width="0.8"/>
<line x1="40" y1="100" x2="100" y2="100" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="100" y1="100" x2="100" y2="130" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="100" y1="130" x2="160" y2="130" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="160" y1="130" x2="160" y2="110" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="40" y1="100" x2="40" y2="170" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="40" y1="170" x2="70" y2="170" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="70" y1="170" x2="70" y2="200" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="70" y1="200" x2="130" y2="200" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="130" y1="200" x2="130" y2="160" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="130" y1="160" x2="180" y2="160" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="180" y1="160" x2="180" y2="210" stroke="rgba(123,104,238,0.35)" stroke-width="0.8"/>
<line x1="20" y1="220" x2="60" y2="220" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<line x1="60" y1="220" x2="60" y2="260" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<line x1="60" y1="260" x2="110" y2="260" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<line x1="110" y1="260" x2="110" y2="240" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<line x1="110" y1="240" x2="160" y2="240" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<line x1="160" y1="240" x2="160" y2="275" stroke="rgba(123,104,238,0.3)" stroke-width="0.8"/>
<rect x="26" y="16" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="76" y="56" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="116" y="36" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="166" y="36" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="116" y="86" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="36" y="96" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="96" y="96" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="156" y="106" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="66" y="166" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="126" y="156" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<rect x="176" y="156" width="8" height="8" rx="1" fill="none" stroke="#7B68EE" stroke-width="0.8"/>
<polygon points="50,100 60,88 72,100 60,112" fill="rgba(123,104,238,0.25)" stroke="#7B68EE" stroke-width="0.8"/>
<polygon points="148,200 158,188 170,200 158,212" fill="rgba(123,104,238,0.25)" stroke="#7B68EE" stroke-width="0.8"/>
<polygon points="8,5 5,12 12,12" fill="#7B68EE" opacity="0.8"/>
<polygon points="192,5 195,12 188,12" fill="#7B68EE" opacity="0.8"/>
<polygon points="8,295 5,288 12,288" fill="#7B68EE" opacity="0.8"/>
<polygon points="192,295 195,288 188,288" fill="#7B68EE" opacity="0.8"/>
`,
}

// ─── Design 5 — The Veteran ────────────────────────────────────────────────────
const back05: CardBackDesign = {
  id: 'back_05',
  name: 'The Veteran',
  tier: 5,
  unlockType: 'games_played',
  unlockCount: 50,
  description: 'Hexagonal tessellation in teal and purple. Play 50 games to unlock.',
  bgColour: '#0A0A0A',
  accentColour: '#00D4AA',
  svgContent: `
<defs>
  <pattern id="b05-hex" patternUnits="userSpaceOnUse" width="34.6" height="60">
    <polygon points="17.3,0 34.6,10 34.6,30 17.3,40 0,30 0,10" fill="rgba(0,212,170,0.12)" stroke="rgba(0,212,170,0.5)" stroke-width="0.7"/>
    <polygon points="17.3,20 34.6,30 34.6,50 17.3,60 0,50 0,30" fill="rgba(120,80,200,0.12)" stroke="rgba(120,80,200,0.4)" stroke-width="0.7"/>
  </pattern>
  <pattern id="b05-hex2" patternUnits="userSpaceOnUse" width="34.6" height="60" x="17.3" y="30">
    <polygon points="17.3,0 34.6,10 34.6,30 17.3,40 0,30 0,10" fill="rgba(120,80,200,0.12)" stroke="rgba(120,80,200,0.4)" stroke-width="0.7"/>
  </pattern>
</defs>
<rect width="200" height="300" fill="url(#b05-hex)"/>
<rect width="200" height="300" fill="url(#b05-hex2)"/>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#00D4AA" stroke-width="1.2"/>
<rect x="10" y="10" width="180" height="280" rx="3" fill="none" stroke="rgba(0,212,170,0.25)" stroke-width="0.5"/>
<polygon points="100,128 117.3,138 117.3,158 100,168 82.7,158 82.7,138" fill="rgba(0,212,170,0.15)" stroke="#00D4AA" stroke-width="1.5"/>
<text x="100" y="155" text-anchor="middle" font-size="16" fill="rgba(0,212,170,0.6)" font-family="serif">✦</text>
<circle cx="5" cy="5" r="3" fill="#00D4AA"/>
<circle cx="195" cy="5" r="3" fill="#00D4AA"/>
<circle cx="5" cy="295" r="3" fill="#00D4AA"/>
<circle cx="195" cy="295" r="3" fill="#00D4AA"/>
`,
}

// ─── Design 6 — The Conqueror ─────────────────────────────────────────────────
const back06: CardBackDesign = {
  id: 'back_06',
  name: 'The Conqueror',
  tier: 6,
  unlockType: 'games_won',
  unlockCount: 50,
  description: 'Gold mandala on deep crimson. Win 50 games to unlock.',
  bgColour: '#8B0000',
  accentColour: '#FFD700',
  svgContent: `
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#FFD700" stroke-width="1.5"/>
<rect x="9" y="9" width="182" height="282" rx="3" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="0.5"/>
<g transform="translate(100,150)">
  <circle r="4" fill="#FFD700"/>
  <circle r="10" fill="none" stroke="rgba(255,215,0,0.9)" stroke-width="1.2"/>
  <circle r="18" fill="none" stroke="rgba(255,215,0,0.7)" stroke-width="1"/>
  <circle r="26" fill="none" stroke="rgba(255,215,0,0.6)" stroke-width="0.8"/>
  <circle r="36" fill="none" stroke="rgba(255,215,0,0.5)" stroke-width="0.7"/>
  <circle r="46" fill="none" stroke="rgba(255,215,0,0.4)" stroke-width="0.6"/>
  <circle r="58" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="0.5"/>
  <circle r="70" fill="none" stroke="rgba(255,215,0,0.2)" stroke-width="0.5"/>
  <line x1="0" y1="-70" x2="0" y2="70" stroke="rgba(255,215,0,0.4)" stroke-width="0.5"/>
  <line x1="-70" y1="0" x2="70" y2="0" stroke="rgba(255,215,0,0.4)" stroke-width="0.5"/>
  <line x1="-49.5" y1="-49.5" x2="49.5" y2="49.5" stroke="rgba(255,215,0,0.35)" stroke-width="0.5"/>
  <line x1="49.5" y1="-49.5" x2="-49.5" y2="49.5" stroke="rgba(255,215,0,0.35)" stroke-width="0.5"/>
  <line x1="-26.5" y1="-65" x2="26.5" y2="65" stroke="rgba(255,215,0,0.25)" stroke-width="0.4"/>
  <line x1="26.5" y1="-65" x2="-26.5" y2="65" stroke="rgba(255,215,0,0.25)" stroke-width="0.4"/>
  <line x1="-65" y1="-26.5" x2="65" y2="26.5" stroke="rgba(255,215,0,0.25)" stroke-width="0.4"/>
  <line x1="65" y1="-26.5" x2="-65" y2="26.5" stroke="rgba(255,215,0,0.25)" stroke-width="0.4"/>
  <polygon points="0,-26 3,-20 9,-20 4.5,-16 6,-10 0,-13.5 -6,-10 -4.5,-16 -9,-20 -3,-20" fill="rgba(255,215,0,0.8)"/>
  <polygon points="0,26 3,20 9,20 4.5,16 6,10 0,13.5 -6,10 -4.5,16 -9,20 -3,20" fill="rgba(255,215,0,0.8)"/>
  <polygon points="-26,0 -20,3 -20,9 -16,4.5 -10,6 -13.5,0 -10,-6 -16,-4.5 -20,-9 -20,-3" fill="rgba(255,215,0,0.8)"/>
  <polygon points="26,0 20,3 20,9 16,4.5 10,6 13.5,0 10,-6 16,-4.5 20,-9 20,-3" fill="rgba(255,215,0,0.8)"/>
  <polygon points="0,-36 2,-32 6,-32 3,-29 4,-25 0,-27.5 -4,-25 -3,-29 -6,-32 -2,-32" fill="rgba(255,215,0,0.6)"/>
  <polygon points="0,36 2,32 6,32 3,29 4,25 0,27.5 -4,25 -3,29 -6,32 -2,32" fill="rgba(255,215,0,0.6)"/>
  <polygon points="-36,0 -32,2 -32,6 -29,3 -25,4 -27.5,0 -25,-4 -29,-3 -32,-6 -32,-2" fill="rgba(255,215,0,0.6)"/>
  <polygon points="36,0 32,2 32,6 29,3 25,4 27.5,0 25,-4 29,-3 32,-6 32,-2" fill="rgba(255,215,0,0.6)"/>
  <polygon points="-18.4,-18.4 -13,-21 -10,-17 -13,-13 -18.4,-11" fill="rgba(255,215,0,0.5)"/>
  <polygon points="18.4,-18.4 21,-13 17,-10 13,-13 11,-18.4" fill="rgba(255,215,0,0.5)"/>
  <polygon points="-18.4,18.4 -21,13 -17,10 -13,13 -11,18.4" fill="rgba(255,215,0,0.5)"/>
  <polygon points="18.4,18.4 13,21 10,17 13,13 18.4,11" fill="rgba(255,215,0,0.5)"/>
</g>
<polygon points="100,5 103,12 110,12 104.5,16.5 106.5,24 100,20 93.5,24 95.5,16.5 90,12 97,12" fill="rgba(255,215,0,0.5)"/>
<polygon points="100,295 103,288 110,288 104.5,283.5 106.5,276 100,280 93.5,276 95.5,283.5 90,288 97,288" fill="rgba(255,215,0,0.5)"/>
<polygon points="5,150 12,147 12,140 16.5,145.5 24,143.5 20,150 24,156.5 16.5,154.5 12,160 12,153" fill="rgba(255,215,0,0.5)"/>
<polygon points="195,150 188,147 188,140 183.5,145.5 176,143.5 180,150 176,156.5 183.5,154.5 188,160 188,153" fill="rgba(255,215,0,0.5)"/>
`,
}

// ─── Design 7 — The Legend ────────────────────────────────────────────────────
const back07: CardBackDesign = {
  id: 'back_07',
  name: 'The Legend',
  tier: 7,
  unlockType: 'games_played',
  unlockCount: 100,
  description: 'Aurora borealis bands. Animated. Play 100 games to unlock.',
  bgColour: '#0A0A1E',
  accentColour: '#00FFFF',
  isAnimated: true,
  svgContent: `
<style>
@keyframes b07-drift {
  0% { transform: translateX(0px) translateY(0px); }
  33% { transform: translateX(8px) translateY(-4px); }
  66% { transform: translateX(-5px) translateY(6px); }
  100% { transform: translateX(0px) translateY(0px); }
}
.b07-aurora { animation: b07-drift 8s ease-in-out infinite; }
</style>
<defs>
  <linearGradient id="b07-a1" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(0,212,170,0)" />
    <stop offset="30%" stop-color="rgba(0,212,170,0.35)" />
    <stop offset="70%" stop-color="rgba(100,60,200,0.35)" />
    <stop offset="100%" stop-color="rgba(100,60,200,0)" />
  </linearGradient>
  <linearGradient id="b07-a2" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(0,150,255,0)" />
    <stop offset="40%" stop-color="rgba(0,150,255,0.3)" />
    <stop offset="80%" stop-color="rgba(0,220,100,0.3)" />
    <stop offset="100%" stop-color="rgba(0,220,100,0)" />
  </linearGradient>
  <linearGradient id="b07-a3" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(255,180,0,0)" />
    <stop offset="50%" stop-color="rgba(255,180,0,0.25)" />
    <stop offset="100%" stop-color="rgba(255,180,0,0)" />
  </linearGradient>
  <linearGradient id="b07-a4" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(180,0,255,0)" />
    <stop offset="35%" stop-color="rgba(180,0,255,0.28)" />
    <stop offset="75%" stop-color="rgba(0,180,255,0.28)" />
    <stop offset="100%" stop-color="rgba(0,180,255,0)" />
  </linearGradient>
  <linearGradient id="b07-a5" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%" stop-color="rgba(0,255,150,0)" />
    <stop offset="50%" stop-color="rgba(0,255,150,0.2)" />
    <stop offset="100%" stop-color="rgba(0,255,150,0)" />
  </linearGradient>
</defs>
<g class="b07-aurora">
  <path d="M-10,60 Q50,40 100,70 Q150,100 210,55" fill="none" stroke="url(#b07-a1)" stroke-width="18"/>
  <path d="M-10,110 Q60,80 110,115 Q160,150 210,105" fill="none" stroke="url(#b07-a2)" stroke-width="22"/>
  <path d="M-10,160 Q70,130 100,165 Q140,200 210,155" fill="none" stroke="url(#b07-a3)" stroke-width="20"/>
  <path d="M-10,210 Q55,175 105,210 Q155,245 210,200" fill="none" stroke="url(#b07-a4)" stroke-width="24"/>
  <path d="M-10,255 Q60,225 100,255 Q150,285 210,248" fill="none" stroke="url(#b07-a5)" stroke-width="18"/>
</g>
<circle cx="40" cy="30" r="1.5" fill="rgba(255,255,255,0.7)"/>
<circle cx="85" cy="18" r="1" fill="rgba(255,255,255,0.6)"/>
<circle cx="140" cy="26" r="1.5" fill="rgba(255,255,255,0.8)"/>
<circle cx="168" cy="15" r="1" fill="rgba(255,255,255,0.5)"/>
<circle cx="20" cy="50" r="1" fill="rgba(255,255,255,0.4)"/>
<circle cx="175" cy="44" r="1.5" fill="rgba(255,255,255,0.6)"/>
<circle cx="55" cy="280" r="1" fill="rgba(255,255,255,0.4)"/>
<circle cx="120" cy="272" r="1.5" fill="rgba(255,255,255,0.7)"/>
<circle cx="160" cy="285" r="1" fill="rgba(255,255,255,0.5)"/>
<circle cx="15" cy="265" r="1" fill="rgba(255,255,255,0.6)"/>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="rgba(0,255,255,0.7)" stroke-width="1.2"/>
<rect x="9" y="9" width="182" height="282" rx="3" fill="none" stroke="rgba(0,255,255,0.2)" stroke-width="0.5"/>
<circle cx="5" cy="5" r="2.5" fill="rgba(0,255,255,0.6)"/>
<circle cx="195" cy="5" r="2.5" fill="rgba(0,255,255,0.6)"/>
<circle cx="5" cy="295" r="2.5" fill="rgba(0,255,255,0.6)"/>
<circle cx="195" cy="295" r="2.5" fill="rgba(0,255,255,0.6)"/>
`,
}

// ─── Design 8 — The Champion ──────────────────────────────────────────────────
const back08: CardBackDesign = {
  id: 'back_08',
  name: 'The Champion',
  tier: 8,
  unlockType: 'games_won',
  unlockCount: 100,
  description: 'White heraldic coat of arms on pure black. Win 100 games to unlock.',
  bgColour: '#080808',
  accentColour: '#FFFFFF',
  svgContent: `
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="rgba(255,255,255,0.8)" stroke-width="1.5"/>
<rect x="10" y="10" width="180" height="280" rx="3" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="0.5"/>
<g transform="translate(100,155)">
  <path d="M-42,-60 L42,-60 L48,0 L42,30 Q20,60 0,70 Q-20,60 -42,30 L-48,0 Z" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="1.5"/>
  <line x1="0" y1="-60" x2="0" y2="70" stroke="rgba(255,255,255,0.35)" stroke-width="0.7"/>
  <line x1="-48" y1="0" x2="48" y2="0" stroke="rgba(255,255,255,0.35)" stroke-width="0.7"/>
  <text x="-21" y="-22" text-anchor="middle" font-size="22" fill="rgba(255,255,255,0.7)" font-family="serif">♠</text>
  <text x="21" y="-22" text-anchor="middle" font-size="22" fill="rgba(200,60,60,0.7)" font-family="serif">♥</text>
  <text x="-21" y="26" text-anchor="middle" font-size="22" fill="rgba(200,60,60,0.7)" font-family="serif">♦</text>
  <text x="21" y="26" text-anchor="middle" font-size="22" fill="rgba(255,255,255,0.7)" font-family="serif">♣</text>
  <path d="M-20,-80 L0,-95 L20,-80 L14,-74 L0,-84 L-14,-74 Z" fill="rgba(255,215,0,0.7)" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
  <path d="M-6,-74 L6,-74 L8,-66 L0,-62 L-8,-66 Z" fill="rgba(255,215,0,0.6)"/>
  <line x1="-60" y1="90" x2="-50" y2="55" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>
  <line x1="-50" y1="55" x2="-30" y2="70" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
  <circle cx="-60" cy="90" r="4" fill="rgba(255,215,0,0.6)" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
  <line x1="60" y1="90" x2="50" y2="55" stroke="rgba(255,255,255,0.5)" stroke-width="1.2"/>
  <line x1="50" y1="55" x2="30" y2="70" stroke="rgba(255,255,255,0.5)" stroke-width="1"/>
  <circle cx="60" cy="90" r="4" fill="rgba(255,215,0,0.6)" stroke="rgba(255,255,255,0.5)" stroke-width="0.8"/>
</g>
<path d="M5,5 L20,5 L5,20" fill="rgba(255,255,255,0.15)"/>
<path d="M195,5 L180,5 L195,20" fill="rgba(255,255,255,0.15)"/>
<path d="M5,295 L20,295 L5,280" fill="rgba(255,255,255,0.15)"/>
<path d="M195,295 L180,295 L195,280" fill="rgba(255,255,255,0.15)"/>
`,
}

// ─── Design 9 — The Immortal ──────────────────────────────────────────────────
const back09: CardBackDesign = {
  id: 'back_09',
  name: 'The Immortal',
  tier: 9,
  unlockType: 'games_won',
  unlockCount: 200,
  description: 'Fractal pattern with shimmer animation. Win 200 games to unlock.',
  bgColour: '#1A1400',
  accentColour: '#FFD700',
  isAnimated: true,
  svgContent: `
<style>
@keyframes b09-shimmer {
  0% { transform: translateX(-220px) skewX(-15deg); opacity:0; }
  10% { opacity: 0.15; }
  50% { opacity: 0.15; }
  60% { opacity: 0; }
  100% { transform: translateX(440px) skewX(-15deg); opacity: 0; }
}
.b09-shimmer { animation: b09-shimmer 4s ease-in-out infinite; }
@keyframes b09-spark {
  0%,100% { opacity:0; }
  50% { opacity:1; }
}
.b09-s1 { animation: b09-spark 2s ease-in-out infinite 0s; }
.b09-s2 { animation: b09-spark 2s ease-in-out infinite 0.5s; }
.b09-s3 { animation: b09-spark 2s ease-in-out infinite 1s; }
.b09-s4 { animation: b09-spark 2s ease-in-out infinite 1.5s; }
</style>
<rect x="5" y="5" width="190" height="290" rx="4" fill="none" stroke="#FFD700" stroke-width="1.5"/>
<rect x="9" y="9" width="182" height="282" rx="3" fill="none" stroke="rgba(255,215,0,0.3)" stroke-width="0.5"/>
<g transform="translate(100,155)" opacity="0.85">
  <polygon points="0,-110 95.3,55 -95.3,55" fill="none" stroke="rgba(0,0,0,0.9)" stroke-width="1"/>
  <polygon points="0,-110 95.3,55 -95.3,55" fill="rgba(0,0,0,0.4)"/>
  <polygon points="0,-55 47.6,27.5 -47.6,27.5" fill="rgba(255,215,0,0.06)" stroke="rgba(0,0,0,0.8)" stroke-width="0.8"/>
  <polygon points="-47.6,-27.5 0,-55 -47.6,27.5" fill="rgba(0,0,0,0.5)" stroke="rgba(0,0,0,0.8)" stroke-width="0.8"/>
  <polygon points="47.6,-27.5 0,-55 47.6,27.5" fill="rgba(0,0,0,0.5)" stroke="rgba(0,0,0,0.8)" stroke-width="0.8"/>
  <polygon points="0,55 47.6,27.5 -47.6,27.5" fill="rgba(0,0,0,0.5)" stroke="rgba(0,0,0,0.8)" stroke-width="0.8"/>
  <polygon points="0,-55 23.8,-13.75 -23.8,-13.75" fill="rgba(255,215,0,0.06)" stroke="rgba(0,0,0,0.7)" stroke-width="0.6"/>
  <polygon points="-23.8,-13.75 0,-27.5 -23.8,13.75" fill="rgba(0,0,0,0.4)" stroke="rgba(0,0,0,0.7)" stroke-width="0.6"/>
  <polygon points="23.8,-13.75 0,-27.5 23.8,13.75" fill="rgba(0,0,0,0.4)" stroke="rgba(0,0,0,0.7)" stroke-width="0.6"/>
  <polygon points="0,27.5 23.8,13.75 -23.8,13.75" fill="rgba(0,0,0,0.4)" stroke="rgba(0,0,0,0.7)" stroke-width="0.6"/>
  <polygon points="-47.6,-27.5 -23.8,-41.25 -23.8,-13.75" fill="rgba(255,215,0,0.06)" stroke="rgba(0,0,0,0.6)" stroke-width="0.5"/>
  <polygon points="47.6,-27.5 23.8,-41.25 23.8,-13.75" fill="rgba(255,215,0,0.06)" stroke="rgba(0,0,0,0.6)" stroke-width="0.5"/>
  <polygon points="0,55 23.8,41.25 -23.8,41.25" fill="rgba(255,215,0,0.06)" stroke="rgba(0,0,0,0.6)" stroke-width="0.5"/>
</g>
<rect class="b09-shimmer" x="0" y="0" width="40" height="300" fill="rgba(255,215,0,0.6)"/>
<polygon points="14,5 17,12 24,12 18.5,16.5 20.5,24 14,20 7.5,24 9.5,16.5 4,12 11,12" fill="#FFD700" class="b09-s1"/>
<polygon points="186,5 189,12 196,12 190.5,16.5 192.5,24 186,20 179.5,24 181.5,16.5 176,12 183,12" fill="#FFD700" class="b09-s2"/>
<polygon points="14,295 17,288 24,288 18.5,283.5 20.5,276 14,280 7.5,276 9.5,283.5 4,288 11,288" fill="#FFD700" class="b09-s3"/>
<polygon points="186,295 189,288 196,288 190.5,283.5 192.5,276 186,280 179.5,276 181.5,283.5 176,288 183,288" fill="#FFD700" class="b09-s4"/>
`,
}

export const CARD_BACKS: CardBackDesign[] = [
  back00, back01, back02, back03, back04,
  back05, back06, back07, back08, back09,
]

export const CARD_BACKS_MAP: Record<string, CardBackDesign> =
  Object.fromEntries(CARD_BACKS.map((d) => [d.id, d]))
