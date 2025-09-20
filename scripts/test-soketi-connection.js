// Test de connexion à Soketi
const { ENV } = require('../config/env');

console.log('🔍 Configuration Soketi:');
console.log('Host:', ENV.PUSHER_HOST);
console.log('Port:', ENV.PUSHER_PORT);
console.log('Key:', ENV.PUSHER_APP_KEY);
console.log('Scheme:', ENV.PUSHER_SCHEME);

// Test de la connexion HTTP basique
const https = require('https');
const http = require('http');

const protocol = ENV.PUSHER_SCHEME === 'https' ? https : http;
const url = `${ENV.PUSHER_SCHEME}://${ENV.PUSHER_HOST}/app/${ENV.PUSHER_APP_KEY}?protocol=7&client=js&version=8.0.0`;

console.log('\n🚀 Test de connexion à:', url);

protocol.get(url, (res) => {
  console.log('✅ Statut:', res.statusCode);
  console.log('✅ Headers:', res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('✅ Réponse:', data);
    console.log('\n🎉 Soketi semble accessible !');
  });
}).on('error', (err) => {
  console.error('❌ Erreur de connexion:', err.message);
});
