#!/usr/bin/env node

// Script pour vérifier la configuration de production
console.log('🔍 Vérification de la configuration de production...\n');

// Simuler l'environnement de production
process.env.NODE_ENV = 'production';

// Importer la configuration
const { ENV, getApiConfig, buildApiUrl } = require('../config/env.ts');

console.log('📱 Configuration de production :');
console.log(`   API_BASE_URL: ${ENV.API_BASE_URL}`);
console.log(`   WEBSOCKET_URL: ${ENV.WEBSOCKET_URL}`);
console.log(`   PUSHER_SCHEME: ${ENV.PUSHER_SCHEME}`);
console.log(`   ENVIRONMENT: ${ENV.ENVIRONMENT}`);
console.log('');

// Vérifier la configuration de production
const prodConfig = getApiConfig();
console.log('⚙️  Configuration API de production :');
console.log(`   Base URL: ${prodConfig.baseURL}`);
console.log(`   Environment: ${prodConfig.environment}`);
console.log(`   Use Mocks: ${prodConfig.useMocks}`);
console.log('');

// Tester buildApiUrl
const testEndpoint = '/auth/login';
const testUrl = buildApiUrl(testEndpoint);
console.log('🔗 Test buildApiUrl :');
console.log(`   Endpoint: ${testEndpoint}`);
console.log(`   URL complète: ${testUrl}`);
console.log('');

// Vérifications de sécurité
console.log('🔒 Vérifications de sécurité :');

if (prodConfig.baseURL.startsWith('https://')) {
  console.log('   ✅ API utilise HTTPS en production');
} else {
  console.log('   ❌ PROBLÈME : API n\'utilise pas HTTPS en production');
}

if (ENV.WEBSOCKET_URL.startsWith('wss://')) {
  console.log('   ✅ WebSocket utilise WSS en production');
} else {
  console.log('   ❌ PROBLÈME : WebSocket n\'utilise pas WSS en production');
}

if (ENV.PUSHER_SCHEME === 'https') {
  console.log('   ✅ Pusher utilise HTTPS en production');
} else {
  console.log('   ❌ PROBLÈME : Pusher n\'utilise pas HTTPS en production');
}

console.log('');
console.log('📋 Résumé :');
if (prodConfig.baseURL.startsWith('https://') && 
    ENV.WEBSOCKET_URL.startsWith('wss://') && 
    ENV.PUSHER_SCHEME === 'https') {
  console.log('   🎉 Configuration de production sécurisée !');
  console.log('   L\'app devrait fonctionner sur TestFlight');
} else {
  console.log('   ⚠️  Configuration de production non sécurisée');
  console.log('   L\'app aura des problèmes sur TestFlight');
}
