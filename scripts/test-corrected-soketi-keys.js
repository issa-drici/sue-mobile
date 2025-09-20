#!/usr/bin/env node

/**
 * 🧪 Test Clés Soketi Corrigées
 * 
 * Test avec la configuration corrigée
 */

const WebSocket = require('ws');

// Configuration corrigée
const SOKETI_URL = 'wss://websocket.sue.alliance-tech.fr';
const APP_ID = 'w4U6jzpva3qsixtl';

// Option 1 : Nouvelles clés textuelles
const APP_KEY_NEW = 'alarrache_app_key_2025_14f8f659';
const APP_SECRET_NEW = 'alarrache_secret_2025_d1e588d17618';

// Option 2 : Anciennes clés base64
const APP_KEY_BASE64 = 'OVdER0JoREU2VnRaZnM4UUlpdGliTGFTa3JDSEt4eW93UFUzc2tPcnRrRHFxbDBiWjJ1MUkxYTB2OGVRRlJtTg==';
const APP_SECRET_BASE64 = 'eHRNbVVleFVHajkyR0xYaks2ODZ6VTloRlkySUtZaFV6REtsQ1Y4ZnppakNiU2lVeEt4VDJ3UExpTnFXYlRyYg==';

console.log('🧪 Test Clés Soketi Corrigées');
console.log('==============================\n');

console.log('🔑 Configuration Testée :');
console.log(`   URL: ${SOKETI_URL}`);
console.log(`   App ID: ${APP_ID}`);
console.log('');

async function testWebSocketConnection(appKey, description) {
  return new Promise((resolve) => {
    console.log(`\n📡 Test avec ${description}...`);
    console.log(`   App Key: ${appKey}`);
    
    try {
      const ws = new WebSocket(`${SOKETI_URL}/app/${appKey}`);
      
      ws.on('open', () => {
        console.log('   ✅ Connexion WebSocket établie');
        
        const subscribeMessage = {
          event: 'pusher:subscribe',
          data: {
            auth: '',
            channel: 'test-channel'
          }
        };
        
        console.log('   📤 Test subscription...');
        ws.send(JSON.stringify(subscribeMessage));
      });
      
      ws.on('message', (data) => {
        const message = data.toString();
        
        if (message.includes('pusher:connection_established')) {
          console.log('   🎉 SUCCÈS: Connexion établie !');
        } else if (message.includes('pusher:subscription_succeeded')) {
          console.log('   🎉 SUCCÈS: Subscription réussie !');
        } else if (message.includes('pusher:error')) {
          console.log('   ❌ ERREUR:', message);
        }
      });
      
      ws.on('error', (error) => {
        console.log(`   ❌ Erreur: ${error.message}`);
      });
      
      ws.on('close', () => {
        console.log('   🔌 Connexion fermée');
        resolve();
      });
      
      setTimeout(() => {
        console.log('   ⏰ Timeout');
        ws.close();
      }, 5000);
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      resolve();
    }
  });
}

async function runAllTests() {
  console.log('🚀 Lancement des tests...\n');
  
  // Test Option 1 : Nouvelles clés
  await testWebSocketConnection(APP_KEY_NEW, 'Nouvelles Clés Textuelles');
  
  // Test Option 2 : Anciennes clés base64
  await testWebSocketConnection(APP_KEY_BASE64, 'Anciennes Clés Base64');
  
  console.log('\n📊 Résumé des Tests :');
  console.log('=====================');
  console.log('✅ Tests terminés');
  console.log('');
  console.log('🎯 Configuration Recommandée :');
  console.log('=============================');
  console.log('Option 1 (Recommandée) :');
  console.log(`   SOKETI_DEFAULT_APP_KEY: ${APP_KEY_NEW}`);
  console.log(`   SOKETI_DEFAULT_APP_SECRET: ${APP_SECRET_NEW}`);
  console.log('');
  console.log('Option 2 (Alternative) :');
  console.log(`   SOKETI_DEFAULT_APP_KEY: ${APP_KEY_BASE64}`);
  console.log(`   SOKETI_DEFAULT_APP_SECRET: ${APP_SECRET_BASE64}`);
  console.log('');
  console.log('🔧 Actions requises :');
  console.log('1. Choisir une option dans Coolify');
  console.log('2. Mettre à jour les variables');
  console.log('3. Redémarrer le container Soketi');
}

runAllTests();
