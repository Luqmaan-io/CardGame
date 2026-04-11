export type AvatarData = {
    id: string
    label: string
    bgColour: string
    svg: string  // raw SVG path data only — not the full SVG element
  }
  
  export const AVATAR_DATA: AvatarData[] = [
    {
      id: 'avatar_01',
      label: 'Lion',
      bgColour: '#EF9F27',
      svg: `
        <circle cx="100" cy="100" r="60" fill="#F5C842"/>
        <circle cx="100" cy="100" r="75" fill="none" stroke="#D4880A" stroke-width="18"/>
        <circle cx="82" cy="88" r="8" fill="#3d2b00"/>
        <circle cx="118" cy="88" r="8" fill="#3d2b00"/>
        <circle cx="100" cy="108" r="6" fill="#C0792A"/>
        <path d="M85 120 Q100 134 115 120" stroke="#3d2b00" stroke-width="3" fill="none" stroke-linecap="round"/>
        <polygon points="80,45 88,68 72,68" fill="#EF9F27"/>
        <polygon points="120,45 128,68 112,68" fill="#EF9F27"/>
      `
    },
    {
      id: 'avatar_02',
      label: 'Shark',
      bgColour: '#185FA5',
      svg: `
        <ellipse cx="100" cy="110" rx="55" ry="45" fill="#888780"/>
        <ellipse cx="100" cy="118" rx="40" ry="25" fill="#f0f0f0"/>
        <circle cx="82" cy="95" r="7" fill="#1a1a1a"/>
        <circle cx="118" cy="95" r="7" fill="#1a1a1a"/>
        <polygon points="100,45 88,75 112,75" fill="#888780"/>
        <polygon points="55,90 40,75 55,108" fill="#888780"/>
        <polygon points="145,90 160,75 145,108" fill="#888780"/>
        <path d="M80 125 L88 118 L96 125 L104 118 L112 125 L120 118 L128 125" stroke="#1a1a1a" stroke-width="2" fill="none"/>
      `
    },
    {
      id: 'avatar_03',
      label: 'Fox',
      bgColour: '#D85A30',
      svg: `
        <ellipse cx="100" cy="105" rx="52" ry="50" fill="#E8732A"/>
        <circle cx="78" cy="105" r="22" fill="#f5f5f5"/>
        <circle cx="122" cy="105" r="22" fill="#f5f5f5"/>
        <polygon points="68,55 58,85 88,75" fill="#E8732A"/>
        <polygon points="132,55 142,85 112,75" fill="#E8732A"/>
        <polygon points="68,55 62,80 82,74" fill="#F4A070"/>
        <polygon points="132,55 138,80 118,74" fill="#F4A070"/>
        <circle cx="88" cy="95" r="8" fill="#3d2b00"/>
        <circle cx="112" cy="95" r="8" fill="#3d2b00"/>
        <ellipse cx="100" cy="112" rx="7" ry="5" fill="#1a1a1a"/>
        <line x1="70" y1="108" x2="88" y2="112" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="130" y1="108" x2="112" y2="112" stroke="#1a1a1a" stroke-width="2"/>
      `
    },
    {
      id: 'avatar_04',
      label: 'Owl',
      bgColour: '#633806',
      svg: `
        <ellipse cx="100" cy="108" rx="50" ry="52" fill="#C8A06A"/>
        <circle cx="82" cy="98" r="22" fill="#f5f5f5"/>
        <circle cx="118" cy="98" r="22" fill="#f5f5f5"/>
        <circle cx="82" cy="98" r="15" fill="#5C8A3C"/>
        <circle cx="118" cy="98" r="15" fill="#5C8A3C"/>
        <circle cx="82" cy="98" r="8" fill="#1a1a1a"/>
        <circle cx="118" cy="98" r="8" fill="#1a1a1a"/>
        <polygon points="100,118 92,130 108,130" fill="#E8A020"/>
        <polygon points="72,52 65,75 88,70" fill="#C8A06A"/>
        <polygon points="128,52 135,75 112,70" fill="#C8A06A"/>
      `
    },
    {
      id: 'avatar_05',
      label: 'Panda',
      bgColour: '#B4B2A9',
      svg: `
        <circle cx="100" cy="100" r="55" fill="#f5f5f5"/>
        <ellipse cx="76" cy="82" rx="20" ry="18" fill="#1a1a1a"/>
        <ellipse cx="124" cy="82" rx="20" ry="18" fill="#1a1a1a"/>
        <circle cx="78" cy="88" r="7" fill="#f5f5f5"/>
        <circle cx="122" cy="88" r="7" fill="#f5f5f5"/>
        <circle cx="80" cy="90" r="4" fill="#1a1a1a"/>
        <circle cx="120" cy="90" r="4" fill="#1a1a1a"/>
        <ellipse cx="100" cy="115" rx="10" ry="7" fill="#D4B0B0"/>
        <ellipse cx="100" cy="113" rx="6" ry="4" fill="#1a1a1a"/>
        <path d="M88 125 Q100 135 112 125" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="72" cy="55" rx="14" ry="16" fill="#1a1a1a"/>
        <ellipse cx="128" cy="55" rx="14" ry="16" fill="#1a1a1a"/>
      `
    },
    {
      id: 'avatar_06',
      label: 'Tiger',
      bgColour: '#D85A30',
      svg: `
        <ellipse cx="100" cy="105" rx="55" ry="52" fill="#F4A030"/>
        <ellipse cx="100" cy="120" rx="35" ry="22" fill="#f5f5f5"/>
        <circle cx="82" cy="90" r="9" fill="#3d2b00"/>
        <circle cx="118" cy="90" r="9" fill="#3d2b00"/>
        <ellipse cx="100" cy="112" rx="8" ry="6" fill="#C07040"/>
        <path d="M85 125 Q100 138 115 125" stroke="#3d2b00" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M80 65 Q85 75 80 85" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M100 60 Q100 72 100 82" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M120 65 Q115 75 120 85" stroke="#1a1a1a" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M72 100 Q82 105 72 110" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M128 100 Q118 105 128 110" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <polygon points="80,48 88,70 72,65" fill="#F4A030"/>
        <polygon points="120,48 128,65 112,70" fill="#F4A030"/>
      `
    },
    {
      id: 'avatar_07',
      label: 'Penguin',
      bgColour: '#0C447C',
      svg: `
        <ellipse cx="100" cy="100" rx="48" ry="58" fill="#1a1a1a"/>
        <ellipse cx="100" cy="108" rx="32" ry="42" fill="#f5f5f5"/>
        <circle cx="84" cy="88" r="8" fill="#f5f5f5"/>
        <circle cx="116" cy="88" r="8" fill="#f5f5f5"/>
        <circle cx="86" cy="90" r="5" fill="#1a1a1a"/>
        <circle cx="114" cy="90" r="5" fill="#1a1a1a"/>
        <polygon points="100,108 92,118 108,118" fill="#E8A020"/>
        <ellipse cx="78" cy="120" rx="8" ry="5" fill="#E8A020"/>
        <ellipse cx="122" cy="120" rx="8" ry="5" fill="#E8A020"/>
      `
    },
    {
      id: 'avatar_08',
      label: 'Cat',
      bgColour: '#7F77DD',
      svg: `
        <ellipse cx="100" cy="108" rx="52" ry="50" fill="#888780"/>
        <circle cx="82" cy="92" r="9" fill="#5C9A5C"/>
        <circle cx="118" cy="92" r="9" fill="#5C9A5C"/>
        <circle cx="84" cy="94" r="5" fill="#1a1a1a"/>
        <circle cx="116" cy="94" r="5" fill="#1a1a1a"/>
        <ellipse cx="100" cy="110" rx="7" ry="5" fill="#D4909090"/>
        <path d="M86 120 Q100 130 114 120" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <line x1="65" y1="105" x2="88" y2="112" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="65" y1="112" x2="88" y2="115" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="135" y1="105" x2="112" y2="112" stroke="#1a1a1a" stroke-width="2"/>
        <line x1="135" y1="112" x2="112" y2="115" stroke="#1a1a1a" stroke-width="2"/>
        <polygon points="74,48 65,75 88,68" fill="#888780"/>
        <polygon points="126,48 135,75 112,68" fill="#888780"/>
        <polygon points="74,52 68,72 86,68" fill="#F4A0A0"/>
        <polygon points="126,52 132,72 114,68" fill="#F4A0A0"/>
      `
    },
    {
      id: 'avatar_09',
      label: 'Eagle',
      bgColour: '#378ADD',
      svg: `
        <circle cx="100" cy="90" r="52" fill="#8B5E3C"/>
        <ellipse cx="100" cy="72" rx="38" ry="30" fill="#f5f5f5"/>
        <circle cx="84" cy="78" r="9" fill="#E8A020"/>
        <circle cx="116" cy="78" r="9" fill="#E8A020"/>
        <circle cx="86" cy="80" r="5" fill="#1a1a1a"/>
        <circle cx="114" cy="80" r="5" fill="#1a1a1a"/>
        <polygon points="100,95 88,110 112,110" fill="#E8A020"/>
        <ellipse cx="60" cy="108" rx="22" ry="12" fill="#8B5E3C" transform="rotate(-20 60 108)"/>
        <ellipse cx="140" cy="108" rx="22" ry="12" fill="#8B5E3C" transform="rotate(20 140 108)"/>
      `
    },
    {
      id: 'avatar_10',
      label: 'Frog',
      bgColour: '#3B6D11',
      svg: `
        <ellipse cx="100" cy="112" rx="52" ry="45" fill="#5CA832"/>
        <circle cx="78" cy="68" r="22" fill="#5CA832"/>
        <circle cx="122" cy="68" r="22" fill="#5CA832"/>
        <circle cx="78" cy="68" r="14" fill="#f5f5f5"/>
        <circle cx="122" cy="68" r="14" fill="#f5f5f5"/>
        <circle cx="80" cy="70" r="8" fill="#1a1a1a"/>
        <circle cx="120" cy="70" r="8" fill="#1a1a1a"/>
        <circle cx="82" cy="68" r="3" fill="#f5f5f5"/>
        <circle cx="122" cy="68" r="3" fill="#f5f5f5"/>
        <ellipse cx="100" cy="108" rx="8" ry="5" fill="#3B8020"/>
        <path d="M80 125 Q100 142 120 125" stroke="#1a1a1a" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="88" cy="118" rx="4" fill="#4A9828"/>
        <circle cx="112" cy="118" rx="4" fill="#4A9828"/>
      `
    },
    {
      id: 'avatar_11',
      label: 'Wolf',
      bgColour: '#444441',
      svg: `
        <ellipse cx="100" cy="108" rx="52" ry="50" fill="#888780"/>
        <ellipse cx="100" cy="120" rx="35" ry="25" fill="#D3D1C7"/>
        <circle cx="82" cy="92" r="9" fill="#85B7EB"/>
        <circle cx="118" cy="92" r="9" fill="#85B7EB"/>
        <circle cx="84" cy="94" r="5" fill="#1a1a1a"/>
        <circle cx="116" cy="94" r="5" fill="#1a1a1a"/>
        <ellipse cx="100" cy="112" rx="7" ry="5" fill="#5F5E5A"/>
        <path d="M88 125 Q100 133 112 125" stroke="#1a1a1a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <polygon points="74,48 62,78 90,70" fill="#888780"/>
        <polygon points="126,48 138,78 110,70" fill="#888780"/>
        <polygon points="76,52 66,74 88,68" fill="#5F5E5A"/>
        <polygon points="124,52 134,74 112,68" fill="#5F5E5A"/>
      `
    },
    {
      id: 'avatar_12',
      label: 'Monkey',
      bgColour: '#854F0B',
      svg: `
        <circle cx="100" cy="100" r="52" fill="#8B5E3C"/>
        <ellipse cx="100" cy="112" rx="38" ry="30" fill="#D4A870"/>
        <circle cx="72" cy="95" r="18" fill="#8B5E3C"/>
        <circle cx="128" cy="95" r="18" fill="#8B5E3C"/>
        <circle cx="72" cy="98" r="12" fill="#D4A870"/>
        <circle cx="128" cy="98" r="12" fill="#D4A870"/>
        <circle cx="84" cy="90" r="9" fill="#3d2b00"/>
        <circle cx="116" cy="90" r="9" fill="#3d2b00"/>
        <ellipse cx="100" cy="110" rx="8" ry="6" fill="#A07848"/>
        <path d="M85 125 Q100 138 115 125" stroke="#3d2b00" stroke-width="3" fill="none" stroke-linecap="round"/>
      `
    },
    {
      id: 'avatar_13',
      label: 'Crown',
      bgColour: '#534AB7',
      svg: `
        <path d="M40 140 L40 95 L65 115 L100 60 L135 115 L160 95 L160 140 Z" fill="#EF9F27"/>
        <rect x="38" y="138" width="124" height="16" rx="4" fill="#EF9F27"/>
        <circle cx="100" cy="62" r="10" fill="#E24B4A"/>
        <circle cx="65" cy="117" r="8" fill="#5DCAA5"/>
        <circle cx="135" cy="117" r="8" fill="#378ADD"/>
        <circle cx="40" cy="96" r="7" fill="#7F77DD"/>
        <circle cx="160" cy="96" r="7" fill="#E24B4A"/>
        <circle cx="62" cy="142" r="5" fill="#f5f5f5"/>
        <circle cx="85" cy="142" r="5" fill="#f5f5f5"/>
        <circle cx="100" cy="142" r="5" fill="#f5f5f5"/>
        <circle cx="115" cy="142" r="5" fill="#f5f5f5"/>
        <circle cx="138" cy="142" r="5" fill="#f5f5f5"/>
      `
    },
    {
      id: 'avatar_14',
      label: 'Flame',
      bgColour: '#A32D2D',
      svg: `
        <path d="M100 30 Q115 55 130 50 Q118 75 125 90 Q115 80 118 100 Q108 88 110 108 Q100 95 100 140 Q90 95 90 108 Q92 88 82 100 Q85 80 75 90 Q82 75 70 50 Q85 55 100 30Z" fill="#E24B4A"/>
        <path d="M100 55 Q110 72 118 68 Q112 85 116 97 Q108 90 110 105 Q100 95 100 130 Q90 95 90 105 Q92 90 84 97 Q88 85 82 68 Q90 72 100 55Z" fill="#EF9F27"/>
        <path d="M100 80 Q106 92 110 90 Q107 102 108 112 Q100 105 100 125 Q100 105 92 112 Q93 102 90 90 Q94 92 100 80Z" fill="#FAC775"/>
        <circle cx="90" cy="88" r="5" fill="#1a1a1a"/>
        <circle cx="110" cy="88" r="5" fill="#1a1a1a"/>
      `
    },
    {
      id: 'avatar_15',
      label: 'Lightning',
      bgColour: '#042C53',
      svg: `
        <polygon points="115,30 85,105 105,105 85,170 130,85 108,85 130,30" fill="#EF9F27"/>
        <polygon points="112,35 88,102 106,102 88,160 126,88 106,88 126,35" fill="#FAC775"/>
        <line x1="55" y1="55" x2="65" y2="65" stroke="#EF9F27" stroke-width="3" stroke-linecap="round"/>
        <line x1="145" y1="55" x2="135" y2="65" stroke="#EF9F27" stroke-width="3" stroke-linecap="round"/>
        <line x1="48" y1="100" x2="62" y2="100" stroke="#EF9F27" stroke-width="3" stroke-linecap="round"/>
        <line x1="152" y1="100" x2="138" y2="100" stroke="#EF9F27" stroke-width="3" stroke-linecap="round"/>
        <circle cx="97" cy="88" r="5" fill="#1a1a1a"/>
        <circle cx="112" cy="75" r="4" fill="#1a1a1a"/>
      `
    },
    {
      id: 'avatar_16',
      label: 'Diamond',
      bgColour: '#0F6E56',
      svg: `
        <polygon points="100,28 148,75 100,172 52,75" fill="#85B7EB"/>
        <polygon points="100,28 148,75 100,100" fill="#B5D4F4"/>
        <polygon points="100,28 52,75 100,100" fill="#378ADD"/>
        <polygon points="52,75 100,172 100,100" fill="#185FA5"/>
        <polygon points="148,75 100,172 100,100" fill="#0C447C"/>
        <circle cx="72" cy="50" r="4" fill="#f5f5f5" opacity="0.8"/>
        <circle cx="82" cy="40" r="3" fill="#f5f5f5" opacity="0.6"/>
        <circle cx="62" cy="42" r="2" fill="#f5f5f5" opacity="0.5"/>
      `
    },
  ]