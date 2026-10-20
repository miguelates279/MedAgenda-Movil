module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Mantener compatibilidad existente
        primary: {
          DEFAULT: '#259487',
          hover: '#4682B4',
          light: '#e6f4f2',
          dark: '#1d7369',
        },
        // Tokens de diseño MedAgenda (dict_styles.md)
        med: {
          // Marca
          primary: {
            DEFAULT: '#259487',
            hover: '#4682B4',
            light: '#e6f4f2',
            dark: '#1d7369',
          },
          secondary: '#4682B4',

          // Neutros y Superficies
          bg: '#ffffff',
          surface: '#f9fafb',
          'surface-muted': '#f3f4f6',
          border: '#d1d5db',
          'border-light': '#e5e7eb',

          // Tipografía
          'text-main': '#171717',
          'text-muted': '#4b5563',
          'text-light': '#9ca3af',

          // Semánticos / Feedback
          success: {
            bg: '#ecfdf5',
            border: '#a7f3d0',
            text: '#065f46',
            'badge-bg': '#d1fae5',
            'badge-text': '#047857',
          },
          error: {
            bg: '#fef2f2',
            border: '#fecaca',
            text: '#991b1b',
            'badge-bg': '#fee2e2',
            'badge-text': '#b91c1c',
          },
          warning: {
            bg: '#fffbeb',
            border: '#fde68a',
            text: '#92400e',
            'badge-bg': '#fef3c7',
            'badge-text': '#b45309',
          },
          info: {
            bg: '#eff6ff',
            border: '#bfdbfe',
            text: '#1e40af',
            'badge-bg': '#dbeafe',
            'badge-text': '#1d4ed8',
          },

          // Badges especiales
          badge: {
            cyan: {
              bg: '#cffafe',
              text: '#0e7490',
            },
            purple: {
              bg: '#f3e8ff',
              text: '#7e22ce',
            },
          },
        },
      },
      borderRadius: {
        'med-sm': '4px',
        'med-md': '6px',
        'med-lg': '8px',
      },
      boxShadow: {
        'med-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'med-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

