const Pusher = require('pusher-js');

// Configuration directe Pusher (sans Laravel Echo)
const config = {
  appKey: 'alarrache_app_key_2025_14f8f659',
  host: 'websocket.sue.alliance-tech.fr',
  port: 443,
  sessionId: '32f59ad1-ca3e-4082-bf81-5681a288e9d0'
};

console.log('🧪 Test DIRECT Pusher (sans Laravel Echo) :');
console.log('📱 Session ID:', config.sessionId);
console.log('🔑 App Key:', config.appKey);
console.log('🌐 Host:', config.host);
console.log('');

// Configuration Pusher directe
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
  console.log('✅ Connecté à Soketi (Pusher direct)');
  console.log('🔑 Socket ID:', pusher.connection.socket_id);
  
  // Rejoindre le canal
  const channelName = `sport-session.${config.sessionId}`;
  console.log('📡 Rejoindre le canal:', channelName);
  
  const channel = pusher.subscribe(channelName);
  
  // Écouter TOUS les événements
  channel.bind_global((eventName, data) => {
    console.log(`🔔 ÉVÉNEMENT RECU (Pusher direct): ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
    console.log('---');
  });
  
  // Événements spécifiques
  channel.bind('comment.created', (data) => {
    console.log('📨 NOUVEAU COMMENTAIRE RECU (Pusher direct) !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('comment.updated', (data) => {
    console.log('✏️ COMMENTAIRE MODIFIÉ (Pusher direct) !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('comment.deleted', (data) => {
    console.log('🗑️ COMMENTAIRE SUPPRIMÉ (Pusher direct) !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Événements de subscription
  channel.bind('pusher:subscription_succeeded', (data) => {
    console.log('🎉 Subscription réussie (Pusher direct)');
    console.log('📊 Données subscription:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('pusher:subscription_error', (data) => {
    console.log('❌ Erreur de subscription (Pusher direct):', JSON.stringify(data, null, 2));
  });
  
  console.log('🎧 En attente d\'événements sur le canal:', channelName);
  console.log('📝 Créez un commentaire dans l\'app maintenant...');
});

pusher.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion (Pusher direct):', error);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté de Soketi (Pusher direct)');
});

console.log('🚀 Démarrage du test Pusher direct...');
console.log('⏳ Connexion en cours...');
