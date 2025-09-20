const Pusher = require('pusher-js');

console.log('🧪 Test Configuration Expo - Simulation Complète');
console.log('');

// Configuration exacte de l'app Expo (d'après config/env.ts)
const ENV = {
  API_BASE_URL: 'http://api.sue.alliance-tech.fr/api',
  PUSHER_APP_ID: 'w4U6jzpva3qsixtl',
  PUSHER_APP_KEY: 'alarrache_app_key_2025_14f8f659',
  PUSHER_HOST: 'websocket.sue.alliance-tech.fr',
  PUSHER_PORT: '443',
  PUSHER_SCHEME: 'https',
};

console.log('📱 Configuration Expo Simulée :');
console.log('🌐 API_BASE_URL:', ENV.API_BASE_URL);
console.log('🔑 PUSHER_APP_KEY:', ENV.PUSHER_APP_KEY);
console.log('🌍 PUSHER_HOST:', ENV.PUSHER_HOST);
console.log('🔌 PUSHER_PORT:', ENV.PUSHER_PORT);
console.log('🔒 PUSHER_SCHEME:', ENV.PUSHER_SCHEME);
console.log('');

// Test 1: Configuration Pusher (comme dans l'app Expo)
console.log('🔧 Test 1: Configuration Pusher...');
const pusher = new Pusher(ENV.PUSHER_APP_KEY, {
  cluster: 'mt1',
  wsHost: ENV.PUSHER_HOST,
  wsPort: parseInt(ENV.PUSHER_PORT),
  wssPort: parseInt(ENV.PUSHER_PORT),
  forceTLS: ENV.PUSHER_SCHEME === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

console.log('✅ Pusher configuré avec succès');
console.log('');

// Test 2: Connexion et subscription (comme dans l'app Expo)
console.log('🔌 Test 2: Connexion et Subscription...');

pusher.connection.bind('connected', () => {
  console.log('✅ Connecté à Soketi (comme l\'app Expo)');
  console.log('🔑 Socket ID:', pusher.connection.socket_id);
  console.log('🌐 Host utilisé:', ENV.PUSHER_HOST);
  console.log('🔑 App Key utilisé:', ENV.PUSHER_APP_KEY);
  console.log('');
  
  // Test de subscription au canal (comme dans l'app Expo)
  const sessionId = '32f59ad1-ca3e-4082-bf81-5681a288e9d0';
  console.log(`📡 Test de subscription au canal: sport-session.${sessionId}`);
  
  const channel = pusher.subscribe(`sport-session.${sessionId}`);
  
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('✅ Subscription réussie (comme l\'app Expo)');
    console.log('🎧 En attente d\'événements...');
    console.log('');
    console.log('📝 MAINTENANT : Créez un commentaire dans l\'app Expo');
    console.log('🔍 On va voir si l\'événement arrive ici aussi !');
  });
  
  channel.bind('pusher:subscription_error', (error) => {
    console.log('❌ Erreur de subscription:', error);
  });
  
  // Écouter les événements commentaires (comme dans l'app Expo)
  channel.bind('comment.created', (data) => {
    console.log('🎉 ÉVÉNEMENT REÇU ! (comme l\'app Expo devrait le recevoir)');
    console.log('📨 Commentaire créé:', data);
    console.log('');
    console.log('✅ Si vous voyez ce message, le WebSocket fonctionne !');
    console.log('❌ Si l\'app Expo ne le reçoit pas, le problème est ailleurs...');
  });
  
  // Écouter tous les événements pour debug
  channel.bind_global((eventName, data) => {
    console.log(`🔔 Événement global reçu: ${eventName}`);
    if (eventName !== 'pusher:subscription_succeeded') {
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    }
  });
});

pusher.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion:', error);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté de Soketi');
});

console.log('🚀 Démarrage du test Expo...');
console.log('⏳ Connexion en cours...');
console.log('');
console.log('💡 Ce test simule EXACTEMENT ce que fait l\'app Expo');
console.log('🎯 Si ce test reçoit des événements mais pas l\'app,');
console.log('   le problème est dans l\'app Expo elle-même');
