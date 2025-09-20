console.log('🔍 DIAGNOSTIC FINAL - WebSocket Soketi');
console.log('');

const Pusher = require('pusher-js');

// Configuration exacte de l'app Expo
const config = {
  appKey: 'alarrache_app_key_2025_14f8f659',
  appId: 'w4U6jzpva3qsixtl',
  host: 'websocket.sue.alliance-tech.fr',
  port: 443,
  scheme: 'https',
  sessionId: 'fe47c78e-9abf-4c5e-a901-398be148fc93'
};

console.log('📱 Configuration Testée :');
console.log('🔑 App Key:', config.appKey);
console.log('🌍 Host:', config.host);
console.log('📱 Session ID:', config.sessionId);
console.log('');

// Test 1: Connexion basique
console.log('🧪 TEST 1: Connexion Basique');
const pusher1 = new Pusher(config.appKey, {
  cluster: 'mt1',
  wsHost: config.host,
  wsPort: config.port,
  wssPort: config.port,
  forceTLS: config.scheme === 'https',
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

pusher1.connection.bind('connected', () => {
  console.log('✅ Connexion réussie');
  console.log('🔑 Socket ID:', pusher1.connection.socket_id);
  
  // Test 2: Subscription au canal
  console.log('\n🧪 TEST 2: Subscription au Canal');
  const channel = pusher1.subscribe(`sport-session.${config.sessionId}`);
  
  channel.bind('pusher:subscription_succeeded', () => {
    console.log('✅ Subscription réussie au canal:', `sport-session.${config.sessionId}`);
    
    // Test 3: Écoute des événements
    console.log('\n🧪 TEST 3: Écoute des Événements');
    
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
    
    // Événements utilisateurs
    channel.bind('user.online', (data) => {
      console.log('👤 ÉVÉNEMENT REÇU ! user.online');
      console.log('📊 Données:', JSON.stringify(data, null, 2));
    });
    
    channel.bind('user.offline', (data) => {
      console.log('👋 ÉVÉNEMENT REÇU ! user.offline');
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

pusher1.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion:', error);
});

pusher1.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté');
});

// Test 4: Vérification des canaux disponibles
console.log('\n🧪 TEST 4: Vérification des Canaux');
setTimeout(() => {
  console.log('📡 Canaux souscrits:', Object.keys(pusher1.channels.all()));
  console.log('🔗 État de la connexion:', pusher1.connection.state);
}, 5000);

// Test 5: Test de connexion directe au serveur
console.log('\n🧪 TEST 5: Test de Connectivité Serveur');
const https = require('https');

const testServerConnectivity = () => {
  const req = https.request({
    hostname: config.host,
    port: config.port,
    path: '/',
    method: 'GET',
    timeout: 10000,
  }, (res) => {
    console.log('✅ Serveur WebSocket accessible');
    console.log('📊 Status:', res.statusCode);
    console.log('📋 Headers:', res.headers);
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur de connexion serveur:', error.message);
  });
  
  req.on('timeout', () => {
    console.error('⏰ Timeout de connexion serveur');
    req.destroy();
  });
  
  req.end();
};

testServerConnectivity();

// Nettoyage après 30 secondes
setTimeout(() => {
  console.log('\n🧹 Nettoyage...');
  pusher1.disconnect();
  process.exit(0);
}, 30000);
