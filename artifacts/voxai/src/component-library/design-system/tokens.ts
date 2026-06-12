export const colors = {
  brand: {
    violet: { 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed', 700: '#6d28d9' },
    blue:   { 400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' },
    pink:   { 400: '#f472b6', 500: '#ec4899', 600: '#db2777' },
    cyan:   { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
    emerald:{ 400: '#34d399', 500: '#10b981', 600: '#059669' },
    amber:  { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  },
  dark: {
    bg:      '#0a0a0a',
    surface: '#111111',
    card:    '#1a1a1a',
    border:  'rgba(255,255,255,0.08)',
    text:    { primary: '#ffffff', secondary: '#a1a1aa', muted: '#71717a' },
  },
  light: {
    bg:      '#ffffff',
    surface: '#fafafa',
    card:    '#f4f4f5',
    border:  'rgba(0,0,0,0.08)',
    text:    { primary: '#09090b', secondary: '#52525b', muted: '#a1a1aa' },
  },
} as const;

export const gradients = {
  violetBlue:  'from-violet-600 to-blue-600',
  violetPink:  'from-violet-500 to-pink-500',
  blueViolet:  'from-blue-500 via-violet-500 to-purple-600',
  cyanBlue:    'from-cyan-400 to-blue-500',
  emeraldCyan: 'from-emerald-400 to-cyan-400',
  pinkOrange:  'from-pink-500 to-orange-400',
  headingDark: 'from-white via-white to-gray-400',
  headingViolet: 'from-violet-400 via-pink-400 to-blue-400',
  headingCyan:   'from-cyan-300 via-blue-400 to-violet-500',
} as const;

export const typography = {
  heading: {
    xl:  'text-5xl md:text-7xl font-black leading-none tracking-tight',
    lg:  'text-4xl md:text-6xl font-bold leading-tight',
    md:  'text-3xl md:text-5xl font-bold',
    sm:  'text-2xl md:text-4xl font-bold',
    xs:  'text-xl md:text-2xl font-semibold',
  },
  body: {
    lg: 'text-lg md:text-xl text-gray-400 leading-relaxed',
    md: 'text-base text-gray-400 leading-relaxed',
    sm: 'text-sm text-gray-400',
  },
  label: 'text-xs font-semibold uppercase tracking-widest',
} as const;

export const spacing = {
  section: 'py-24',
  sectionLg: 'py-32',
  container: 'max-w-7xl mx-auto px-6',
  containerSm: 'max-w-5xl mx-auto px-6',
  containerXs: 'max-w-3xl mx-auto px-6',
} as const;

export const radius = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
} as const;

export const shadows = {
  card:  'shadow-xl shadow-black/20',
  glow:  'shadow-2xl shadow-violet-500/20',
  glowBlue: 'shadow-2xl shadow-blue-500/20',
  none: 'shadow-none',
} as const;

export const cards = {
  glass: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl',
  glassHover: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:border-violet-500/50 hover:bg-white/8 transition-all duration-300',
  solid: 'bg-gray-900 border border-gray-800 rounded-2xl',
  solidHover: 'bg-gray-900 border border-gray-800 rounded-2xl hover:border-gray-700 transition-all duration-300',
} as const;

export const buttons = {
  primary:   'bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-full hover:opacity-90 transition-all duration-200',
  secondary: 'border border-white/20 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition-all duration-200',
  ghost:     'text-gray-400 hover:text-white font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-200',
} as const;
