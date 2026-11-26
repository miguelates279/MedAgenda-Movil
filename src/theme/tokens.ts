import definitions from './design-tokens.js';

export const tokens = {
  ...definitions,
  statusBarStyle: definitions.statusBarStyle as 'dark',
  borderRadius: {
    ...definitions.radius,
    sm: definitions.radius['med-sm'],
    md: definitions.radius['med-md'],
    lg: definitions.radius['med-lg'],
  },
  indicator: definitions.indicator as { sm: 'small'; lg: 'large' },
  layout: {
    ...definitions.layout,
    selectHeight: definitions.layout.selectHeight as `${number}%`,
    filterHeight: definitions.layout.filterHeight as `${number}%`,
    full: definitions.layout.full as `${number}%`,
  },
  shadows: { sm: definitions.legacyShadow, md: definitions.legacyShadow },
} as const;

export type AppTokens = typeof tokens;
export default tokens;
