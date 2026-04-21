import type { UserSettings } from '../types'

export const FONT_STACKS: Record<UserSettings['fontFamily'], string> = {
  system: '',
  serif: "Georgia, 'Times New Roman', Cambria, serif",
  mono: "'JetBrains Mono', 'Fira Code', Consolas, ui-monospace, monospace",
  rounded: "'SF Pro Rounded', 'Nunito', system-ui, sans-serif",
}

export const CLOCK_SIZES: Record<UserSettings['clockSize'], string> = {
  small: 'text-[6rem]',
  medium: 'text-[9rem]',
  large: 'text-[12rem]',
}

export const DATE_SIZES: Record<UserSettings['dateSize'], string> = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-xl',
}

export const GREETING_SIZES: Record<UserSettings['greetingSize'], string> = {
  small: 'text-2xl',
  medium: 'text-3xl',
  large: 'text-4xl',
}
