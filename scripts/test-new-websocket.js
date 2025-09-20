console.log('🧪 Test du Nouveau Service WebSocket (Pusher Direct)');
console.log('');

// Configuration exacte de l'app Expo
const config = {
  appKey: 'alarrache_app_key_2025_14f8f659',
  appId: 'w4U6jzpva3qsixtl',
  host: 'websocket.sue.alliance-tech.fr',
  port: 443,
  scheme: 'https',
  sessionId: 'fe47c78e-9abf-4c5e-a901-398be148fc93',
  token: 'test-token' // Token de test
};

console.log('📱 Configuration Testée :');
console.log('🔑 App Key:', config.appKey);
console.log('🌍 Host:', config.host);
console.log('📱 Session ID:', config.sessionId);
console.log('');

// Test du nouveau service
const Pusher = require('pusher-js');

console.log('🧪 TEST: Connexion et Subscription');
const pusher = new Pusher(config.appKey, {
  wsHost: config.host,
  wsPort: config.port,
  wssPort: config.port,
  forceTLS: config.scheme === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
  cluster: 'mt1',
  auth: {
    headers: {
      Authorization: `Bearer ${config.token}`,
    },
  },
});

pusher.connection.bind('connected', () => {
  console.log('✅ Connexion réussie');
  console.log('🔑 Socket ID:', pusher.connection.socket_id);
  
  // Subscription au canal
  console.log('\n📡 Subscription au canal...');
  const channel = pusher.subscribe(`sport-session.${config.sessionId}`);
  
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('✅ Subscription réussie au canal:', `sport-session.${config.sessionId}`);
    
    // Vérification du canal
    console.log('📊 Canaux souscrits:', Object.keys(pusher.channels.all()));
    console.log('🔍 Nom du canal:', channel.name);
    
    // Écoute des événements
    console.log('\n🎧 Écoute des événements...');
    
    // Événements commentaires
    channel.bind('comment.created', (data) => {
      console.log('🎉 ÉVÉNEMENT REÇU ! comment.created');
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    });
    
    channel.bind('comment.updated', (data) => {
      console.log('✏️ ÉVÉNEMENT REÇU ! comment.updated');
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    });
    
    channel.bind('comment.deleted', (data) => {
      console.log('🗑️ ÉVÉNEMENT REÇU ! comment.deleted');
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    });
    
    // Écoute globale
    channel.bind_global((eventName, data) => {
      if (eventName !== 'pusher:subscription_succeeded') {
        console.log(`🔔 ÉVÉNEMENT GLOBAL: ${eventName}`);
        console.log('📊 Données:', JSON.stringify(data, null, 2));
      }
    });
    
    console.log('\n🎯 MAINTENANT :');
    console.log('1. Créez un commentaire dans l\'app Expo');
    console.log('2. Ou depuis un autre appareil');
    console.log('3. On va voir si l\'événement arrive ici');
    console.log('');
    console.log('⏳ En attente d\'événements...');
  });
  
  channel.bind('pusher:subscription_error', (error) => {
    console.log('❌ Erreur de subscription:', error);
  });
});

pusher.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion:', error);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté');
});

// Nettoyage après 30 secondes
setTimeout(() => {
  console.log('\n🧹 Nettoyage...');
  pusher.disconnect();
  process.exit(0);
}, 30000);
