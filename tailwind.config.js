const definitions = require('./src/theme/design-tokens.js');
const plugin = require('tailwindcss/plugin');

const pixels = (value) => (typeof value === 'number' ? `${value}px` : value);
const pixelScale = (scale) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [key, pixels(value)]),
  );
const kebab = (key) =>
  key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
const colorScale = (scale) =>
  Object.fromEntries(
    Object.entries(scale).map(([key, value]) => [
      kebab(key),
      typeof value === 'object' ? colorScale(value) : value,
    ]),
  );
const brand = {
  DEFAULT: definitions.colors.primary,
  hover: definitions.colors.primaryHover,
  light: definitions.colors.primaryLight,
  dark: definitions.colors.primaryDark,
  surface: definitions.colors.primarySurface,
  border: definitions.colors.primaryBorder,
  'border-strong': definitions.colors.primaryBorderStrong,
};
const med = {
  ...colorScale(definitions.colors),
  primary: brand,
  badge: {
    cyan: definitions.colors.badgeCyan,
    purple: definitions.colors.badgePurple,
  },
};

module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    colors: {
      primary: brand,
      med,
      transparent: definitions.colors.transparent,
    },
    spacing: pixelScale(definitions.spacingScale),
    fontSize: Object.fromEntries(
      Object.entries(definitions.fontSize).map(([key, value]) => [
        key,
        [pixels(value), { lineHeight: pixels(definitions.lineHeight[key]) }],
      ]),
    ),
    fontWeight: definitions.fontWeight,
    lineHeight: Object.fromEntries(
      Object.entries(definitions.lineHeightScale).map(([key, value]) => [
        key,
        Number.isInteger(value) && value > 2 ? pixels(value) : String(value),
      ]),
    ),
    letterSpacing: definitions.letterSpacing,
    borderRadius: pixelScale(definitions.radius),
    borderWidth: pixelScale(definitions.borderWidth),
    boxShadow: {
      ...definitions.legacyCssShadow,
      ...Object.fromEntries(
        Object.entries(definitions.boxShadow).map(([key, value]) => [
          `clay-${key}`,
          value,
        ]),
      ),
    },
    opacity: definitions.opacity,
    zIndex: definitions.zIndex,
    maxWidth: pixelScale(definitions.maxWidth),
    minWidth: pixelScale(definitions.minWidth),
    extend: {
      height: { select: definitions.layout.selectHeight },
      maxHeight: { filter: definitions.layout.filterHeight },
    },
  },
  plugins: [
    plugin(({ addUtilities }) =>
      addUtilities(
        Object.fromEntries(
          Object.entries(definitions.boxShadow).map(([key, value]) => [
            `.clay-${key}`,
            { '-rn-box-shadow': JSON.stringify(value) },
          ]),
        ),
      ),
    ),
  ],
};
