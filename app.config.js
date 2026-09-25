// Dynamic Expo config: google-services.json is gitignored (it holds API
// keys), so on EAS builders it arrives via a FILE secret instead:
//
//   eas secret:create --scope project --name GOOGLE_SERVICES_JSON \
//     --type file --value ./google-services.json
//
// EAS exposes file secrets as env vars containing the file PATH.
// Locally it falls back to ./google-services.json.
const base = require("./app.json").expo;

module.exports = () => {
  const googleServicesFile =
    process.env.GOOGLE_SERVICES_JSON || "./google-services.json";

  return {
    expo: {
      ...base,
      android: {
        ...base.android,
        googleServicesFile,
      },
    },
  };
};
