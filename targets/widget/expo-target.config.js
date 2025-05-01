/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (_config) => ({
  type: "widget",
  icon: "https://github.com/expo.png",
  frameworks: ["SwiftUI", "ActivityKit", "AppIntents"],
  entitlements: {
    // "com.apple.security.application-groups": ["group.com.expo.dev"],
  },
  deploymentTarget: "17.0",
});
