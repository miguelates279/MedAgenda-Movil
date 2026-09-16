module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          unstable_transformProfile: "hermes-v0",
        },
      ],
      "nativewind/babel",
    ],
    plugins: [
      "@babel/plugin-transform-class-properties",
      "@babel/plugin-transform-private-methods",
      "@babel/plugin-transform-private-property-in-object",
      "react-native-reanimated/plugin",
    ],
  };
};
