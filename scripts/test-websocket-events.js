#!/usr/bin/env node

/**
 * 🧪 Test Réception Événements WebSocket
 * 
 * Test en temps réel pour diagnostiquer les events
 */

const WebSocket = require('ws');

// Configuration
const SOKETI_URL = 'wss://websocket.sue.alliance-tech.fr';
const APP_KEY = 'alarrache_app_key_2025_14f8f659';
const SESSION_ID = 'fe47c78e-9abf-4c5e-a901-398be148fc93';

console.log('🧪 Test Réception Événements WebSocket');
console.log('=====================================\n');

console.log('🔑 Configuration :');
console.log(`   URL: ${SOKETI_URL}`);
console.log(`   App Key: ${APP_KEY}`);
console.log(`   Session ID: ${SESSION_ID}`);
console.log(`   Canal: sport-session.${SESSION_ID}`);
console.log('');

function testEventReception() {
  return new Promise((resolve) => {
    try {
      console.log('📡 Connexion WebSocket...');
      const ws = new WebSocket(`${SOKETI_URL}/app/${APP_KEY}`);
      
      ws.on('open', () => {
        console.log('✅ Connexion établie');
        
        // Rejoindre le canal de session
        const subscribeMessage = {
          event: 'pusher:subscribe',
          data: {
            auth: '',
            channel: `sport-session.${SESSION_ID}`
          }
        };
        
        console.log('📤 Subscription au canal...');
        ws.send(JSON.stringify(subscribeMessage));
      });
      
      ws.on('message', (data) => {
        const message = data.toString();
        console.log('📨 Message reçu:', message);
        
        // Analyser le type de message
        try {
          const parsed = JSON.parse(message);
          
          if (parsed.event === 'pusher:connection_established') {
            console.log('🎉 Connexion établie avec Soketi');
          } else if (parsed.event === 'pusher_internal:subscription_succeeded') {
            console.log('🎧 Subscription au canal réussie !');
            console.log('⏳ En attente d\'événements...');
            console.log('');
            console.log('📋 Instructions de test :');
            console.log('1. Créez un commentaire dans l\'app sur un autre appareil');
            console.log('2. Ou demandez à quelqu\'un d\'en créer un');
            console.log('3. Vous devriez voir l\'événement arriver ici');
            console.log('');
          } else if (parsed.event === 'pusher:error') {
            console.log('❌ Erreur Pusher:', parsed.data);
          } else if (parsed.event && parsed.event !== 'pusher:connection_established') {
            console.log('🔔 ÉVÉNEMENT RECU !');
            console.log('   Type:', parsed.event);
            console.log('   Données:', JSON.stringify(parsed.data, null, 2));
            console.log('');
          }
        } catch (e) {
          console.log('📄 Message non-JSON:', message);
        }
      });
      
      ws.on('error', (error) => {
        console.log('❌ Erreur WebSocket:', error.message);
      });
      
      ws.on('close', () => {
        console.log('🔌 Connexion fermée');
        resolve();
      });
      
      // Garder la connexion ouverte pour recevoir les events
      console.log('⏰ Connexion maintenue ouverte pour recevoir les événements...');
      console.log('   Appuyez sur Ctrl+C pour arrêter');
      
    } catch (error) {
      console.log('❌ Erreur:', error.message);
      resolve();
    }
  });
}

console.log('🚀 Lancement du test...\n');

testEventReception().then(() => {
  console.log('\n📊 Test terminé');
});
