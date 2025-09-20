const Pusher = require('pusher-js');

// Configuration
const config = {
  appKey: 'alarrache_app_key_2025_14f8f659',
  host: 'websocket.sue.alliance-tech.fr',
  port: 443,
  sessionId: '32f59ad1-ca3e-4082-bf81-5681a288e9d0'
};

console.log('🧪 Test TOUS les canaux possibles :');
console.log('📱 Session ID:', config.sessionId);
console.log('🔑 App Key:', config.appKey);
console.log('🌐 Host:', config.host);
console.log('');

// Configuration Pusher
const pusher = new Pusher(config.appKey, {
  cluster: 'mt1',
  wsHost: config.host,
  wsPort: config.port,
  wssPort: config.port,
  forceTLS: true,
  enabledTransports: ['ws', 'wss'],
  disableStats: true,
});

// Événements de connexion
pusher.connection.bind('connected', () => {
  console.log('✅ Connecté à Soketi');
  console.log('🔑 Socket ID:', pusher.connection.socket_id);
  
  // Test 1: Canal sport-session.{sessionId}
  console.log('\n📡 Test 1: Canal sport-session.{sessionId}');
  const channel1 = pusher.subscribe(`sport-session.${config.sessionId}`);
  channel1.bind_global((eventName, data) => {
    console.log(`🔔 [sport-session] ÉVÉNEMENT: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Test 2: Canal session.{sessionId} (ancien format)
  console.log('\n📡 Test 2: Canal session.{sessionId}');
  const channel2 = pusher.subscribe(`session.${config.sessionId}`);
  channel2.bind_global((eventName, data) => {
    console.log(`🔔 [session] ÉVÉNEMENT: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Test 3: Canal public (sans préfixe)
  console.log('\n📡 Test 3: Canal public (sans préfixe)');
  const channel3 = pusher.subscribe(config.sessionId);
  channel3.bind_global((eventName, data) => {
    console.log(`🔔 [public] ÉVÉNEMENT: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Test 4: Canal global (pour capturer tout)
  console.log('\n📡 Test 4: Canal global (pour capturer tout)');
  const channel4 = pusher.subscribe('global');
  channel4.bind_global((eventName, data) => {
    console.log(`🔔 [global] ÉVÉNEMENT: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Test 5: Canal test
  console.log('\n📡 Test 5: Canal test');
  const channel5 = pusher.subscribe('test');
  channel5.bind_global((eventName, data) => {
    console.log(`🔔 [test] ÉVÉNEMENT: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Écouter les événements de connexion sur tous les canaux
  [channel1, channel2, channel3, channel4, channel5].forEach((channel, index) => {
    const names = ['sport-session', 'session', 'public', 'global', 'test'];
    channel.bind('pusher:subscription_succeeded', () => {
      console.log(`✅ Canal ${names[index]} souscrit avec succès`);
    });
    channel.bind('pusher:subscription_error', (error) => {
      console.log(`❌ Erreur subscription canal ${names[index]}:`, error);
    });
  });
  
  console.log('\n🎧 En attente d\'événements sur TOUS les canaux...');
  console.log('📝 Créez un commentaire dans l\'app maintenant...');
  console.log('🔍 On va voir sur quel canal l\'événement arrive !');
});

pusher.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion:', error);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté de Soketi');
});

console.log('🚀 Démarrage du test multi-canaux...');
console.log('⏳ Connexion en cours...');
