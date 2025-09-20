console.log('🔍 Debug Configuration Frontend');
console.log('');

// Simuler la configuration de l'app
const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://api.sue.alliance-tech.fr/api',
  WEBSOCKET_URL: process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'ws://localhost:6001',
  PUSHER_APP_ID: process.env.EXPO_PUBLIC_PUSHER_APP_ID || 'w4U6jzpva3qsixtl',
  PUSHER_APP_KEY: process.env.EXPO_PUBLIC_PUSHER_APP_KEY || 'alarrache_app_key_2025_14f8f659',
  PUSHER_HOST: process.env.EXPO_PUBLIC_PUSHER_HOST || 'websocket.sue.alliance-tech.fr',
  PUSHER_PORT: process.env.EXPO_PUBLIC_PUSHER_PORT || '443',
  PUSHER_SCHEME: process.env.EXPO_PUBLIC_PUSHER_SCHEME || 'https',
  IS_DEV: process.env.NODE_ENV === 'development',
  SERVER_HOST: process.env.EXPO_PUBLIC_SERVER_HOST || 'localhost',
  SERVER_PORT: process.env.EXPO_PUBLIC_SERVER_PORT || '8000',
};

console.log('📱 Configuration Frontend Actuelle :');
console.log('🌐 API_BASE_URL:', ENV.API_BASE_URL);
console.log('🔌 WEBSOCKET_URL:', ENV.WEBSOCKET_URL);
console.log('🔑 PUSHER_APP_KEY:', ENV.PUSHER_APP_KEY);
console.log('🌍 PUSHER_HOST:', ENV.PUSHER_HOST);
console.log('🔌 PUSHER_PORT:', ENV.PUSHER_PORT);
console.log('🔒 PUSHER_SCHEME:', ENV.PUSHER_SCHEME);
console.log('🖥️  SERVER_HOST:', ENV.SERVER_HOST);
console.log('🔌 SERVER_PORT:', ENV.SERVER_PORT);
console.log('🚀 IS_DEV:', ENV.IS_DEV);
console.log('');

// Vérifier les variables d'environnement
console.log('🔍 Variables d\'Environnement :');
console.log('EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL || 'NON DÉFINI');
console.log('EXPO_PUBLIC_WEBSOCKET_URL:', process.env.EXPO_PUBLIC_WEBSOCKET_URL || 'NON DÉFINI');
console.log('EXPO_PUBLIC_PUSHER_APP_KEY:', process.env.EXPO_PUBLIC_PUSHER_APP_KEY || 'NON DÉFINI');
console.log('EXPO_PUBLIC_PUSHER_HOST:', process.env.EXPO_PUBLIC_PUSHER_HOST || 'NON DÉFINI');
console.log('NODE_ENV:', process.env.NODE_ENV || 'NON DÉFINI');
console.log('');

// Analyse de la configuration
console.log('🔍 Analyse de la Configuration :');

if (ENV.API_BASE_URL.includes('localhost') || ENV.API_BASE_URL.includes('127.0.0.1')) {
  console.log('❌ PROBLÈME : API_BASE_URL pointe vers localhost');
  console.log('   L\'app essaie de se connecter à un serveur local inexistant');
} else if (ENV.API_BASE_URL.includes('api.sue.alliance-tech.fr')) {
  console.log('✅ API_BASE_URL pointe vers la production');
} else {
  console.log('⚠️  API_BASE_URL pointe vers une URL inconnue');
}

if (ENV.WEBSOCKET_URL.includes('localhost') || ENV.WEBSOCKET_URL.includes('127.0.0.1')) {
  console.log('❌ PROBLÈME : WEBSOCKET_URL pointe vers localhost');
} else if (ENV.PUSHER_HOST === 'websocket.sue.alliance-tech.fr') {
  console.log('✅ PUSHER_HOST pointe vers la production');
} else {
  console.log('⚠️  PUSHER_HOST pointe vers une URL inconnue');
}

console.log('');

// Recommandations
console.log('💡 Recommandations :');
console.log('1. Vérifiez que l\'app Expo utilise bien la configuration de production');
console.log('2. Assurez-vous que les variables d\'environnement sont correctes');
console.log('3. Testez la création de commentaires via l\'API de production');
console.log('4. Vérifiez les logs de l\'app pendant la création de commentaires');

console.log('');
console.log('🎯 Prochaines étapes :');
console.log('- Relancer l\'app Expo');
console.log('- Créer un commentaire');
console.log('- Vérifier les logs de l\'app');
console.log('- Vérifier que l\'API de production est appelée');
