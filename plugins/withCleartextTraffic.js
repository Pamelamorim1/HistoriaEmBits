const { withAndroidManifest } = require('expo/config-plugins');

/**
 * Habilita tráfego HTTP local (cleartext) no AndroidManifest.xml
 * para permitir conexão Socket.io com o servidor na rede Wi-Fi local no APK.
 */
module.exports = function withCleartextTraffic(config) {
  return withAndroidManifest(config, (config) => {
    const mainApplication = config.modResults.manifest.application?.[0];
    if (mainApplication) {
      mainApplication.$['android:usesCleartextTraffic'] = 'true';
    }
    return config;
  });
};
