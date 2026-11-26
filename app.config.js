const { expo } = require('./app.json');
const { colors } = require('./src/theme/design-tokens.js');

module.exports = {
  ...expo,
  splash: { ...expo.splash, backgroundColor: colors.bg },
  android: {
    ...expo.android,
    adaptiveIcon: { ...expo.android.adaptiveIcon, backgroundColor: colors.bg },
  },
};
