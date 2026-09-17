module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#259487',
          hover: '#4682B4',
          light: '#e6f4f2',
          dark: '#1d7369',
        },
      },
    },
  },
  plugins: [],
};
