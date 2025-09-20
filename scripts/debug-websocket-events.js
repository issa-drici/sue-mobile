// Script de debug pour les événements WebSocket Soketi
console.log('🔍 Debug WebSocket Events - Soketi');

// Test de connexion basique
const testSoketiConnection = async () => {
  const https = require('https');
  
  console.log('\n1. 🌐 Test de connectivité Soketi...');
  
  const testUrl = 'https://websocket.sue.alliance-tech.fr/app/OVdER0JoREU2VnRaZnM4UUlpdGlobGFTa3JDSEt4eW93UFUzc2tPcnRrRHFxbDBiWjJ1MUkxYTB2OGVRRlJtTg==?protocol=7&client=js&version=8.0.0';
  
  try {
    const response = await new Promise((resolve, reject) => {
      https.get(testUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
      }).on('error', reject);
    });
    
    console.log('✅ Statut HTTP:', response.status);
    console.log('✅ Headers WebSocket:', {
      'access-control-allow-origin': response.headers['access-control-allow-origin'],
      'uwebsockets': response.headers['uwebsockets']
    });
    
    if (response.status === 200 || response.status === 404) {
      console.log('✅ Soketi répond correctement');
    } else {
      console.log('❌ Problème de connectivité:', response.status);
    }
    
  } catch (error) {
    console.log('❌ Erreur de connexion:', error.message);
  }
};

// Instructions pour debug mobile
const mobileDebugInstructions = () => {
  console.log('\n2. 📱 Instructions Debug Mobile:');
  console.log('');
  console.log('Dans les logs de votre app, cherchez ces messages:');
  console.log('');
  console.log('✅ SUCCÈS - Si vous voyez:');
  console.log('   🔌 Connexion à Soketi...');
  console.log('   ✅ Connecté à Soketi');
  console.log('   📡 Rejoindre le canal session.XXX');
  console.log('   📨 Nouveau commentaire reçu: {...} <- CE MESSAGE EST CRUCIAL');
  console.log('');
  console.log('❌ PROBLÈME - Si vous voyez seulement:');
  console.log('   🔌 Connexion à Soketi...');
  console.log('   ✅ Connecté à Soketi');
  console.log('   📡 Rejoindre le canal session.XXX');
  console.log('   (mais pas de "📨 Nouveau commentaire reçu")');
  console.log('');
  console.log('➡️ TEST À FAIRE:');
  console.log('   1. Ouvrez la même session sur 2 comptes différents');
  console.log('   2. Envoyez un commentaire depuis le compte A');
  console.log('   3. Vérifiez les logs du compte B');
  console.log('   4. Cherchez le message "📨 Nouveau commentaire reçu"');
};

// Test de canal et événements
const canalDebugInfo = () => {
  console.log('\n3. 📡 Configuration des canaux:');
  console.log('');
  console.log('Canal attendu: session.{sessionId}');
  console.log('Événements écoutés:');
  console.log('  - CommentCreated');
  console.log('  - CommentUpdated'); 
  console.log('  - CommentDeleted');
  console.log('');
  console.log('Format événement attendu du backend:');
  console.log(`{
    "event": "CommentCreated",
    "data": {
      "comment": {
        "id": "123",
        "content": "Test",
        "user": {
          "id": "456", 
          "firstname": "John",
          "lastname": "Doe"
        },
        "created_at": "2025-01-09T..."
      }
    }
  }`);
};

// Backend debug info
const backendDebugInfo = () => {
  console.log('\n4. 🔧 Vérifications Backend nécessaires:');
  console.log('');
  console.log('Le backend Laravel doit:');
  console.log('');
  console.log('1. Configurer broadcasting.php:');
  console.log(`   'default' => 'pusher',
   'connections' => [
     'pusher' => [
       'driver' => 'pusher',
       'key' => 'OVdER0JoREU2VnRaZnM4UUlpdGlobGFTa3JDSEt4eW93UFUzc2tPcnRrRHFxbDBiWjJ1MUkxYTB2OGVRRlJtTg==',
       'secret' => 'eHRNbVVleFVHajkyR0xYaks2ODZ6VTloRlkySUtZaFV6REtsQ1Y4ZnppakNiU2lVeEt4VDJ3UExpTnFXYlRyYg==',
       'app_id' => 'w4U6jzpva3qsixtl',
       'options' => [
         'host' => 'websocket.sue.alliance-tech.fr',
         'port' => 443,
         'scheme' => 'https',
         'encrypted' => true,
       ],
     ],
   ]`);
  console.log('');
  console.log('2. Créer un Event CommentCreated:');
  console.log(`   php artisan make:event CommentCreated`);
  console.log('');
  console.log('3. Dans CommentController@store:');
  console.log(`   broadcast(new CommentCreated($comment))->toOthers();`);
  console.log('');
  console.log('4. L\'événement doit implémenter ShouldBroadcast:');
  console.log(`   class CommentCreated implements ShouldBroadcast {
     public function broadcastOn() {
       return new Channel('session.'.$this->comment->session_id);
     }
   }`);
};

// Exécution
const runDebug = async () => {
  await testSoketiConnection();
  mobileDebugInstructions();
  canalDebugInfo();
  backendDebugInfo();
  
  console.log('\n5. 🎯 RÉSUMÉ:');
  console.log('✅ Frontend: Migration Soketi terminée');
  console.log('🔄 Backend: Configuration Laravel Broadcasting nécessaire');
  console.log('📱 Test: Vérifiez les logs mobiles pour "📨 Nouveau commentaire reçu"');
};

runDebug().catch(console.error);
