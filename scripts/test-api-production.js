const https = require('https');

console.log('🧪 Test de connectivité API Production');
console.log('🌐 URL:', 'https://api.sue.alliance-tech.fr/api');
console.log('');

// Test de connectivité basique
const testApiConnection = () => {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.sue.alliance-tech.fr',
      port: 443,
      path: '/api',
      method: 'GET',
      timeout: 10000,
    }, (res) => {
      console.log('✅ API Production accessible');
      console.log('📊 Status:', res.statusCode);
      console.log('📋 Headers:', res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📄 Réponse:', data.substring(0, 200) + '...');
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Erreur de connexion API:', error.message);
      reject(error);
    });
    
    req.on('timeout', () => {
      console.error('⏰ Timeout de connexion API');
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
};

// Test de création de commentaire (si possible)
const testCommentCreation = async () => {
  console.log('\n📝 Test de création de commentaire...');
  console.log('⚠️  Ce test nécessite un token d\'authentification valide');
  console.log('💡 Vérifiez que l\'app utilise bien l\'URL de production');
};

// Exécution des tests
const runTests = async () => {
  try {
    await testApiConnection();
    await testCommentCreation();
    
    console.log('\n🎯 Résumé des tests :');
    console.log('✅ API Production : Accessible');
    console.log('⚠️  Commentaires : Nécessite authentification');
    console.log('');
    console.log('💡 Si l\'API est accessible, le problème WebSocket');
    console.log('   peut venir de la configuration frontend...');
    
  } catch (error) {
    console.error('\n❌ Tests échoués:', error.message);
  }
};

runTests();
