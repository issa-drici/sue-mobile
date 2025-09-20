console.log('🧪 Test Final - Configuration Complète');
console.log('');

// Configuration de l'app Expo (d'après config/env.ts)
const ENV = {
  API_BASE_URL: 'http://api.sue.alliance-tech.fr/api',
  PUSHER_APP_ID: 'w4U6jzpva3qsixtl',
  PUSHER_APP_KEY: 'alarrache_app_key_2025_14f8f659',
  PUSHER_HOST: 'websocket.sue.alliance-tech.fr',
  PUSHER_PORT: '443',
  PUSHER_SCHEME: 'https',
};

console.log('📱 Configuration Expo Actuelle :');
console.log('🌐 API_BASE_URL:', ENV.API_BASE_URL);
console.log('🔑 PUSHER_APP_KEY:', ENV.PUSHER_APP_KEY);
console.log('🌍 PUSHER_HOST:', ENV.PUSHER_HOST);
console.log('🔌 PUSHER_PORT:', ENV.PUSHER_PORT);
console.log('🔒 PUSHER_SCHEME:', ENV.PUSHER_SCHEME);
console.log('');

// Test de configuration
console.log('🔍 Analyse de la Configuration :');

if (ENV.API_BASE_URL.includes('localhost') || ENV.API_BASE_URL.includes('127.0.0.1')) {
  console.log('❌ PROBLÈME : API_BASE_URL pointe vers localhost');
  console.log('   L\'app essaie de se connecter à un serveur local inexistant');
} else if (ENV.API_BASE_URL.includes('api.sue.alliance-tech.fr')) {
  console.log('✅ API_BASE_URL pointe vers la production');
} else {
  console.log('⚠️  API_BASE_URL pointe vers une URL inconnue');
}

if (ENV.PUSHER_HOST === 'websocket.sue.alliance-tech.fr') {
  console.log('✅ PUSHER_HOST pointe vers la production');
} else {
  console.log('⚠️  PUSHER_HOST pointe vers une URL inconnue');
}

console.log('');

// Test de connectivité API
console.log('🌐 Test de Connectivité API...');
const https = require('https');

const testApiConnection = () => {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sue.alliance-tech.fr',
      port: 443,
      path: '/api',
      method: 'GET',
      timeout: 10000,
    }, (res) => {
      console.log('✅ API Production accessible');
      console.log('📊 Status:', res.statusCode);
      resolve();
    });
    
    req.on('error', (error) => {
      console.error('❌ Erreur de connexion API:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('⏰ Timeout de connexion API');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

// Test de connectivité WebSocket
console.log('🔌 Test de Connectivité WebSocket...');
const Pusher = require('pusher-js');

const testWebSocketConnection = () => {
  return new Promise((resolve, reject) => {
    const pusher = new Pusher(ENV.PUSHER_APP_KEY, {
      cluster: 'mt1',
      wsHost: ENV.PUSHER_HOST,
      wsPort: parseInt(ENV.PUSHER_PORT),
      wssPort: parseInt(ENV.PUSHER_PORT),
      forceTLS: ENV.PUSHER_SCHEME === 'https',
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
    });

    pusher.connection.bind('connected', () => {
      console.log('✅ WebSocket Production accessible');
      console.log('🔑 Socket ID:', pusher.connection.socket_id);
      pusher.disconnect();
      resolve();
    });

    pusher.connection.bind('error', (error) => {
      console.error('❌ Erreur de connexion WebSocket:', error);
      reject(error);
    });

    setTimeout(() => {
      reject(new Error('Timeout WebSocket'));
    }, 10000);
  });
};

// Exécution des tests
const runTests = async () => {
  try {
    await testApiConnection();
    await testWebSocketConnection();
    
    console.log('\n🎯 Résumé des Tests :');
    console.log('✅ API Production : Accessible');
    console.log('✅ WebSocket Production : Accessible');
    console.log('✅ Configuration : Correcte');
    console.log('');
    console.log('💡 Maintenant :');
    console.log('1. Redémarrez complètement l\'app Expo');
    console.log('2. Créez un commentaire');
    console.log('3. Vérifiez que l\'événement arrive');
    console.log('');
    console.log('🚀 Le WebSocket devrait maintenant fonctionner !');
    
  } catch (error) {
    console.error('\n❌ Tests échoués:', error.message);
    console.log('');
    console.log('💡 Vérifiez :');
    console.log('1. La configuration des variables d\'environnement');
    console.log('2. La connectivité réseau');
    console.log('3. Les pare-feu/proxy');
  }
};

runTests();
