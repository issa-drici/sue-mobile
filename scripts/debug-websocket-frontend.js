#!/usr/bin/env node

/**
 * 🔍 Script de Debug WebSocket Frontend - Soketi
 * 
 * Ce script teste la connexion WebSocket avec Soketi
 * pour identifier les problèmes côté frontend.
 */

const WebSocket = require('ws');

// Configuration Soketi - Test avec clé par défaut
const SOKETI_URL = 'wss://websocket.sue.alliance-tech.fr';
const APP_KEY_DEFAULT = 'app-key'; // Clé par défaut Soketi
const APP_KEY_CUSTOM = 'w4U6jzpva3qsixtl'; // Clé personnalisée

console.log('🔍 Debug WebSocket Frontend - Soketi');
console.log('=====================================\n');

// Test 1: Connexion WebSocket avec clé par défaut
console.log('📡 Test 1: Connexion WebSocket avec clé par défaut');
console.log(`URL: ${SOKETI_URL}`);
console.log(`App Key: ${APP_KEY_DEFAULT}\n`);

function testWebSocketConnection(appKey, testName) {
  return new Promise((resolve) => {
    try {
      const ws = new WebSocket(`${SOKETI_URL}/app/${appKey}`);
      
      ws.on('open', () => {
        console.log(`✅ ${testName}: Connexion WebSocket établie`);
        
        // Envoyer un message de test
        const testMessage = {
          event: 'pusher:subscribe',
          data: {
            auth: '',
            channel: 'sport-session.test'
          }
        };
        
        console.log(`📤 ${testName}: Envoi message de test:`, JSON.stringify(testMessage, null, 2));
        ws.send(JSON.stringify(testMessage));
      });
      
      ws.on('message', (data) => {
        console.log(`📨 ${testName}: Message reçu:`, data.toString());
        
        // Si c'est un succès, on a trouvé la bonne clé
        if (data.toString().includes('pusher:connection_established')) {
          console.log(`🎉 ${testName}: SUCCÈS - Connexion établie avec la clé ${appKey}`);
        }
      });
      
      ws.on('error', (error) => {
        console.log(`❌ ${testName}: Erreur WebSocket:`, error.message);
      });
      
      ws.on('close', () => {
        console.log(`🔌 ${testName}: Connexion WebSocket fermée`);
        resolve();
      });
      
      // Timeout après 5 secondes
      setTimeout(() => {
        console.log(`⏰ ${testName}: Timeout - Fermeture de la connexion`);
        ws.close();
      }, 5000);
      
    } catch (error) {
      console.log(`❌ ${testName}: Erreur lors de la création de la connexion:`, error.message);
      resolve();
    }
  });
}

// Test séquentiel des deux clés
async function runTests() {
  console.log('🧪 Test avec clé par défaut Soketi...');
  await testWebSocketConnection(APP_KEY_DEFAULT, 'Clé par défaut');
  
  console.log('\n🧪 Test avec clé personnalisée...');
  await testWebSocketConnection(APP_KEY_CUSTOM, 'Clé personnalisée');
  
  console.log('\n📊 Résumé des tests terminé');
}

runTests();

// Test 2: Test HTTP pour vérifier l'accessibilité
console.log('\n🌐 Test 2: Test HTTP Soketi');
const https = require('https');

const options = {
  hostname: 'websocket.sue.alliance-tech.fr',
  port: 443,
  path: '/',
  method: 'GET',
  timeout: 5000
};

const req = https.request(options, (res) => {
  console.log(`✅ HTTP Status: ${res.statusCode}`);
  console.log(`📊 Headers:`, res.headers);
  
  res.on('data', (chunk) => {
    console.log(`📄 Réponse: ${chunk.toString().substring(0, 200)}...`);
  });
});

req.on('error', (error) => {
  console.log('❌ Erreur HTTP:', error.message);
});

req.on('timeout', () => {
  console.log('⏰ Timeout HTTP');
  req.destroy();
});

req.end();

console.log('\n🚀 Tests lancés. Attendez les résultats...\n');
