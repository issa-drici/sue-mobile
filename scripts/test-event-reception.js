const Pusher = require('pusher-js');

// Configuration avec les vrais IDs de l'app
const config = {
  appKey: 'alarrache_app_key_2025_14f8f659',
  host: 'websocket.sue.alliance-tech.fr',
  port: 443,
  sessionId: '32f59ad1-ca3e-4082-bf81-5681a288e9d0', // Vrai Session ID de l'app
  socketId: '8817678332.4230421560' // Vrai Socket ID de l'app
};

console.log('🧪 Test WebSocket avec les VRAIS IDs de l\'app :');
console.log('📱 Session ID:', config.sessionId);
console.log('🔑 Socket ID:', config.socketId);
console.log('🔑 App Key:', config.appKey);
console.log('🌐 Host:', config.host);
console.log('');

// Configuration Pusher
const pusher = new Pusher(config.appKey, {
  cluster: 'mt1', // Cluster requis par Pusher
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
  console.log('🔑 Socket ID actuel:', pusher.connection.socket_id);
  
  // Rejoindre le canal avec le VRAI Session ID
  const channelName = `sport-session.${config.sessionId}`;
  console.log('📡 Rejoindre le canal:', channelName);
  
  const channel = pusher.subscribe(channelName);
  
  // Écouter TOUS les événements
  channel.bind_global((eventName, data) => {
    console.log(`🔔 ÉVÉNEMENT RECU: ${eventName}`);
    console.log('📊 Données:', JSON.stringify(data, null, 2));
    console.log('---');
  });
  
  // Événements spécifiques
  channel.bind('comment.created', (data) => {
    console.log('📨 NOUVEAU COMMENTAIRE RECU !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('comment.updated', (data) => {
    console.log('✏️ COMMENTAIRE MODIFIÉ !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('comment.deleted', (data) => {
    console.log('🗑️ COMMENTAIRE SUPPRIMÉ !');
    console.log('📊 Données:', JSON.stringify(data, null, 2));
  });
  
  // Événements de subscription
  channel.bind('pusher:subscription_succeeded', (data) => {
    console.log('🎉 Subscription réussie au canal');
    console.log('📊 Données subscription:', JSON.stringify(data, null, 2));
  });
  
  channel.bind('pusher:subscription_error', (data) => {
    console.log('❌ Erreur de subscription:', JSON.stringify(data, null, 2));
  });
  
  console.log('🎧 En attente d\'événements sur le canal:', channelName);
  console.log('📝 Créez un commentaire dans l\'app maintenant...');
});

pusher.connection.bind('error', (error) => {
  console.error('❌ Erreur de connexion:', error);
});

pusher.connection.bind('disconnected', () => {
  console.log('❌ Déconnecté de Soketi');
});

console.log('🚀 Démarrage du test...');
console.log('⏳ Connexion en cours...');
