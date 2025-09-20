#!/usr/bin/env node

/**
 * 🧪 Test Clé Par Défaut Soketi
 * 
 * Test avec la clé par défaut pour vérifier si Soketi fonctionne
 */

const WebSocket = require('ws');

// Test avec clé par défaut Soketi
const SOKETI_URL = 'wss://websocket.sue.alliance-tech.fr';
const DEFAULT_APP_KEY = 'app-key';

console.log('🧪 Test Clé Par Défaut Soketi');
console.log('==============================\n');

console.log('🔑 Test avec clé par défaut :');
console.log(`   URL: ${SOKETI_URL}`);
console.log(`   App Key: ${DEFAULT_APP_KEY}`);
console.log('');

function testDefaultKey() {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(`${SOKETI_URL}/app/${DEFAULT_APP_KEY}`);
      
      ws.on('open', () => {
        console.log('✅ Connexion WebSocket établie');
        
        const subscribeMessage = {
          event: 'pusher:subscribe',
          data: {
            auth: '',
            channel: 'test-channel'
          }
        };
        
        console.log('📤 Test subscription avec clé par défaut...');
        ws.send(JSON.stringify(subscribeMessage));
      });
      
      ws.on('message', (data) => {
        const message = data.toString();
        console.log('📨 Message reçu:', message);
        
        if (message.includes('pusher:connection_established')) {
          console.log('🎉 SUCCÈS: Clé par défaut fonctionne !');
        } else if (message.includes('pusher:error')) {
          console.log('❌ ERREUR: Clé par défaut ne fonctionne pas');
        }
      });
      
      ws.on('error', (error) => {
        console.log('❌ Erreur WebSocket:', error.message);
      });
      
      ws.on('close', () => {
        console.log('🔌 Connexion fermée');
        resolve();
      });
      
      setTimeout(() => {
        console.log('⏰ Timeout');
        ws.close();
      }, 5000);
      
    } catch (error) {
      console.log('❌ Erreur:', error.message);
      resolve();
    }
  });
}

console.log('🚀 Test en cours...\n');

testDefaultKey().then(() => {
  console.log('\n📊 Résumé :');
  console.log('===========');
  console.log('Si la clé par défaut ne fonctionne pas,');
  console.log('Soketi n\'est pas configuré correctement.');
  console.log('');
  console.log('🔧 Actions requises côté backend :');
  console.log('1. Vérifier la configuration Soketi');
  console.log('2. Redémarrer le container');
  console.log('3. Vérifier les variables d\'environnement');
});
