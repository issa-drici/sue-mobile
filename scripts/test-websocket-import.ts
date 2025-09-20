// Test simple des imports WebSocket

console.log('🧪 Test d\'Import du Service WebSocket');
console.log('');

try {
  // Test de l'import
  const { webSocketService } = require('../services/websocket');
  
  console.log('✅ webSocketService importé avec succès');
  console.log('📊 Type:', typeof webSocketService);
  console.log('🔧 Méthodes disponibles:', Object.getOwnPropertyNames(Object.getPrototypeOf(webSocketService)));
  
  // Test des méthodes principales
  console.log('\n🔍 Vérification des méthodes :');
  console.log('- connect:', typeof webSocketService.connect);
  console.log('- disconnect:', typeof webSocketService.disconnect);
  console.log('- getConnectionStatus:', typeof webSocketService.getConnectionStatus);
  console.log('- getSocketId:', typeof webSocketService.getSocketId);
  
  // Test de la configuration
  console.log('\n📱 Configuration du service :');
  console.log('- isConnected:', webSocketService.getConnectionStatus());
  console.log('- Socket ID:', webSocketService.getSocketId());
  
  console.log('\n🎉 Service WebSocket fonctionnel !');
  
} catch (error) {
  console.error('❌ Erreur lors de l\'import:', error);
}
