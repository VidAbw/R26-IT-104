/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

export const ProtectivaTheme = {
  primary: '#0D9488', // Emerald/Teal Primary
  primaryDark: '#0F766E', // Darker Teal
  primaryLight: '#059669', // Bright Emerald
  mintBg: '#F0FDF4', // Very light mint background
  sidebarBg: '#F8FAFC', // Crisp grey-white sidebar
  cardBg: '#FFFFFF',
  textPrimary: '#0F172A', // Dark Slate
  textSecondary: '#64748B', // Slate grey
  border: '#E2E8F0',
  accentGreen: '#10B981',
  accentGreenBg: '#DCFCE7',
  accentOrange: '#F97316',
  accentOrangeBg: '#FFEDD5',
  quickEscapeRed: '#DC2626',
  quickEscapeRedHover: '#B91C1C',
  badgeGreen: '#16A34A',
  badgeGreenBg: '#DCFCE7',
  badgeOrange: '#EA580C',
  badgeOrangeBg: '#FFEDD5',
  cardShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
};

export const Colors = {
  light: {
    text: '#0F172A',
    background: '#F8FAFC',
    tint: '#0D9488',
    icon: '#64748B',
    tabIconDefault: '#64748B',
    tabIconSelected: '#0D9488',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: '#0D9488',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#0D9488',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
