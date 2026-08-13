import { SiteConfig } from '../types';

export interface ThemePalette {
  id: string;
  name: string;
  category: string;
  description: string;
  primary: string;        // Hex e.g. #e11d48
  primaryHover: string;   // Hex e.g. #be123c
  primaryLight: string;   // Hex e.g. #fff1f2
  primaryBorder: string;  // Hex e.g. #fecdd3
  primaryDarkBg: string;  // Hex for dark mode bg e.g. #4c0519
  primaryDarkText: string;// Hex for dark mode text e.g. #fb7185
  accent: string;         // Hex e.g. #f59e0b
  swatchColors: [string, string, string]; // Preview swatch
}

export const COLOR_PALETTES: ThemePalette[] = [
  {
    id: 'rose-coral',
    name: 'Rose Coral',
    category: 'Parenting, Family & Lifestyle',
    description: 'Tone hangat, lembut, dan penuh empati untuk pengasuhan anak, keluarga & edukasi.',
    primary: '#e11d48',
    primaryHover: '#be123c',
    primaryLight: '#fff1f2',
    primaryBorder: '#fecdd3',
    primaryDarkBg: '#4c0519',
    primaryDarkText: '#fb7185',
    accent: '#f59e0b',
    swatchColors: ['#e11d48', '#fff1f2', '#f59e0b'],
  },
  {
    id: 'emerald-mint',
    name: 'Emerald Mint',
    category: 'Health, Wellness & Organic',
    description: 'Nuansa hijau alami yang menenangkan untuk kesehatan, gizi, medis & kebugaran.',
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    primaryDarkBg: '#064e3b',
    primaryDarkText: '#34d399',
    accent: '#10b981',
    swatchColors: ['#059669', '#ecfdf5', '#10b981'],
  },
  {
    id: 'sapphire-tech',
    name: 'Sapphire Tech',
    category: 'Technology, AI & Software',
    description: 'Biru profesional dan kredibel untuk portal teknologi, AI, software & gadget.',
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    primaryDarkBg: '#1e3a8a',
    primaryDarkText: '#60a5fa',
    accent: '#06b6d4',
    swatchColors: ['#2563eb', '#eff6ff', '#06b6d4'],
  },
  {
    id: 'amber-editorial',
    name: 'Amber Editorial',
    category: 'Magazine, Culinary & Travel',
    description: 'Warna hangat golden-amber untuk majalah gaya hidup, kuliner & perjalanan.',
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    primaryDarkBg: '#78350f',
    primaryDarkText: '#fbbf24',
    accent: '#ea580c',
    swatchColors: ['#d97706', '#fffbeb', '#ea580c'],
  },
  {
    id: 'indigo-saas',
    name: 'Indigo Corporate',
    category: 'Business, SaaS & Finance',
    description: 'Nila / Indigo modern untuk media bisnis, startup, ekonomi & finansial.',
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryLight: '#eef2ff',
    primaryBorder: '#c7d2fe',
    primaryDarkBg: '#312e81',
    primaryDarkText: '#818cf8',
    accent: '#8b5cf6',
    swatchColors: ['#4f46e5', '#eef2ff', '#8b5cf6'],
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyber Neon',
    category: 'Gaming, Esports & Crypto',
    description: 'Ungu & cyan futuristik dengan kontras tinggi untuk gaming, pop culture & crypto.',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#f5f3ff',
    primaryBorder: '#ddd6fe',
    primaryDarkBg: '#4c1d95',
    primaryDarkText: '#c084fc',
    accent: '#06b6d4',
    swatchColors: ['#8b5cf6', '#f5f3ff', '#06b6d4'],
  },
  {
    id: 'slate-minimal',
    name: 'Monochrome Slate',
    category: 'Architecture, Design & Fashion',
    description: 'Gaya monokromatis elegan & minimalis untuk portal arsitektur, seni & desain.',
    primary: '#0f172a',
    primaryHover: '#1e293b',
    primaryLight: '#f8fafc',
    primaryBorder: '#e2e8f0',
    primaryDarkBg: '#0f172a',
    primaryDarkText: '#94a3b8',
    accent: '#64748b',
    swatchColors: ['#0f172a', '#f8fafc', '#64748b'],
  },
  {
    id: 'violet-creative',
    name: 'Creative Violet',
    category: 'Art, Portfolio & Beauty',
    description: 'Ungu fuchsia yang artistik dan mewah untuk majalah seni, kecantikan & fotografi.',
    primary: '#7c3aed',
    primaryHover: '#6d28d9',
    primaryLight: '#faf5ff',
    primaryBorder: '#e9d5ff',
    primaryDarkBg: '#581c87',
    primaryDarkText: '#c084fc',
    accent: '#ec4899',
    swatchColors: ['#7c3aed', '#faf5ff', '#ec4899'],
  },
  {
    id: 'teal-ocean',
    name: 'Ocean Teal',
    category: 'Nature, Environment & Travel',
    description: 'Teal samudera segar untuk jurnal alam, lingkungan, petualangan & riset.',
    primary: '#0d9488',
    primaryHover: '#0f766e',
    primaryLight: '#f0fdfa',
    primaryBorder: '#99f6e4',
    primaryDarkBg: '#134e4a',
    primaryDarkText: '#2dd4bf',
    accent: '#0284c7',
    swatchColors: ['#0d9488', '#f0fdfa', '#0284c7'],
  },
  {
    id: 'crimson-news',
    name: 'Crimson Portal',
    category: 'Major News, Politics & Sports',
    description: 'Merah crimson tegas & berani untuk portal berita utama, politik, & olahraga.',
    primary: '#dc2626',
    primaryHover: '#b91c1c',
    primaryLight: '#fef2f2',
    primaryBorder: '#fecaca',
    primaryDarkBg: '#7f1d1d',
    primaryDarkText: '#f87171',
    accent: '#f59e0b',
    swatchColors: ['#dc2626', '#fef2f2', '#f59e0b'],
  },
];

export const FONT_SCALE_OPTIONS = [
  {
    id: 'compact',
    name: 'Dense & Compact',
    description: 'Ukuran font 14px base - Padat untuk pembaca informasi tinggi / berita cepat',
    sizePx: '14.5px',
  },
  {
    id: 'standard',
    name: 'Standard Balanced (Default)',
    description: 'Ukuran font 16px base - Seimbang & nyaman untuk berbagai layar',
    sizePx: '16px',
  },
  {
    id: 'spacious',
    name: 'Spacious & Accessible',
    description: 'Ukuran font 17.5px base - Lebih besar, lega, & sangat ramah mata',
    sizePx: '17.5px',
  },
];

export const THEME_MODE_OPTIONS = [
  {
    id: 'light',
    name: 'Bright Mode (Light Theme - Default)',
    description: 'Tampilan bersih, terang, & berlatar belakang cerah.',
  },
  {
    id: 'dark',
    name: 'Dark Mode (Night Theme)',
    description: 'Tampilan gelap elegan, nyaman untuk dibaca saat malam hari.',
  },
  {
    id: 'auto',
    name: 'Auto Detect (System OS Preference)',
    description: 'Otomatis menyesuaikan dengan mode terang / gelap perangkat pengguna.',
  },
];

let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

export function applyTheme(config?: Partial<SiteConfig>): void {
  if (typeof document === 'undefined') return;

  const mode = config?.theme_mode || 'light';
  const paletteId = config?.theme_palette || 'rose-coral';
  const scaleId = config?.font_size_scale || 'standard';

  // 1. Resolve Dark Mode State
  let isDark = false;

  // Clean up old listener if exists
  if (mediaQueryListener && typeof window !== 'undefined') {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.removeEventListener('change', mediaQueryListener);
    mediaQueryListener = null;
  }

  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else if (mode === 'auto') {
    if (typeof window !== 'undefined') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      isDark = mq.matches;

      // Add live listener
      mediaQueryListener = (e: MediaQueryListEvent) => {
        applyTheme({ ...config, theme_mode: 'auto' });
      };
      mq.addEventListener('change', mediaQueryListener);
    }
  }

  // Toggle 'dark' class on <html>
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }

  // 2. Resolve Font Scale
  const scaleObj = FONT_SCALE_OPTIONS.find((s) => s.id === scaleId) || FONT_SCALE_OPTIONS[1];
  document.documentElement.style.fontSize = scaleObj.sizePx;

  // 3. Resolve Palette & Inject Dynamic CSS Rules
  const palette = COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0];

  let styleEl = document.getElementById('dynamic-theme-styles') as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'dynamic-theme-styles';
    document.head.appendChild(styleEl);
  }

  styleEl.textContent = `
    :root {
      --color-primary: ${palette.primary};
      --color-primary-hover: ${palette.primaryHover};
      --color-primary-light: ${palette.primaryLight};
      --color-primary-border: ${palette.primaryBorder};
      --color-primary-dark-bg: ${palette.primaryDarkBg};
      --color-primary-dark-text: ${palette.primaryDarkText};
      --color-accent: ${palette.accent};
    }

    /* OVERRIDE TAILWIND ROSE CLASSES TO MAP DYNAMICALLY TO SELECTED PALETTE */
    .bg-rose-600, .bg-rose-500 { background-color: ${palette.primary} !important; }
    .hover\\:bg-rose-700:hover, .hover\\:bg-rose-600:hover { background-color: ${palette.primaryHover} !important; }
    .bg-rose-50 { background-color: ${palette.primaryLight} !important; }
    .text-rose-600, .text-rose-500 { color: ${palette.primary} !important; }
    .text-rose-700 { color: ${palette.primaryHover} !important; }
    .hover\\:text-rose-600:hover, .hover\\:text-rose-700:hover { color: ${palette.primaryHover} !important; }
    .border-rose-500, .border-rose-600 { border-color: ${palette.primary} !important; }
    .border-rose-200, .border-rose-100 { border-color: ${palette.primaryBorder} !important; }
    .focus\\:ring-rose-500:focus, .focus\\:ring-rose-600:focus { --tw-ring-color: ${palette.primary} !important; }
    .fill-rose-500, .fill-rose-600 { fill: ${palette.primary} !important; }
    
    /* DARK MODE PALETTE ADAPTATION */
    .dark .dark\\:bg-rose-950\\/50, .dark .dark\\:bg-rose-950\\/60, .dark .dark\\:bg-rose-950 {
      background-color: ${palette.primaryDarkBg}80 !important;
    }
    .dark .dark\\:text-rose-400, .dark .dark\\:text-rose-300 {
      color: ${palette.primaryDarkText} !important;
    }
    .dark .dark\\:border-rose-800, .dark .dark\\:border-rose-900 {
      border-color: ${palette.primaryDarkBg} !important;
    }

    /* AUTOLINK DECORATION */
    .decoration-rose-300 {
      text-decoration-color: ${palette.primaryBorder} !important;
    }
    .hover\\:bg-rose-50:hover {
      background-color: ${palette.primaryLight} !important;
    }
  `;
}
