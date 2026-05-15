/** Dark purple/pink theme matching Figma design. */
export const colors = {
  // Backgrounds
  background: 'transparent',
  backgroundGradientStart: '#1a0533',
  backgroundGradientEnd: '#4a1942',
  surface: 'rgba(255, 255, 255, 0.06)',
  surfaceLight: 'rgba(255, 255, 255, 0.1)',
  surfaceActive: 'rgba(233, 30, 140, 0.08)',

  // Primary (pink/magenta accent)
  primary: '#e91e8c',
  primaryDark: '#b0005e',
  primaryLight: '#ff6ec7',
  primaryGradientStart: '#e91e8c',
  primaryGradientEnd: '#ff6ec7',

  // Secondary (purple)
  secondary: '#7c4dff',
  secondaryLight: '#b47cff',

  // Semantic
  success: '#00e676',
  successLight: 'rgba(0, 230, 118, 0.15)',
  error: '#ff5252',
  errorLight: 'rgba(255, 82, 82, 0.15)',
  warning: '#ffd600',
  warningLight: 'rgba(255, 214, 0, 0.15)',

  // Text
  text: '#ffffff',
  textSecondary: 'rgba(255, 255, 255, 0.6)',
  textMuted: 'rgba(255, 255, 255, 0.35)',

  // Borders & Glass
  border: 'rgba(255, 255, 255, 0.1)',
  borderActive: 'rgba(233, 30, 140, 0.3)',
  glass: 'rgba(255, 255, 255, 0.06)',
  glassHover: 'rgba(255, 255, 255, 0.1)',

  // Shadows (less visible on dark bg)
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowStrong: 'rgba(0, 0, 0, 0.5)',

  // Chart Colors
  chartBtc: '#f7931a',
  chartEth: '#627eea',
  chartSol: '#00e5a0',
  chartBnb: '#f3ba2f',

  // Tag Colors
  tagMarket: '#ffd600',
  tagTechnology: '#e91e63',
  tagRegulation: '#4caf50',
  tagDefi: '#42a5f5',
  tagCrypto: '#7c4dff',
  tagBtc: '#f7931a',
  tagEth: '#627eea',

  // Tab bar
  tabBarBg: 'rgba(26, 5, 51, 0.95)',
  tabBarBorder: 'rgba(255, 255, 255, 0.06)',
  tabBarActive: '#e91e8c',
  tabBarInactive: 'rgba(255, 255, 255, 0.35)',
} as const;
