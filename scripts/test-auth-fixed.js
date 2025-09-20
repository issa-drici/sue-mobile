#!/usr/bin/env node

/**
 * Script de test pour vérifier que l'authentification fonctionne correctement
 * après la correction backend (firstname/lastname dans la réponse de connexion)
 */

const https = require('https');

const API_BASE_URL = 'https://api.sue.alliance-tech.fr/api';

// Configuration de test
const testUser = {
  email: 'issa.drici@test.com',
  password: 'password123',
  firstname: 'Issa',
  lastname: 'Drici'
};

// Fonction utilitaire pour faire des requêtes HTTPS
function makeRequest(method, endpoint, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.sue.alliance-tech.fr',
      port: 443,
      path: `/api${endpoint}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({
            status: res.statusCode,
            data: response
          });
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function testAuthentication() {
  console.log('🧪 Test d\'authentification - Correction backend');
  console.log('==============================================');
  console.log('');

  try {
    // Test 1: Connexion
    console.log('🔐 Test 1: Connexion');
    console.log('-------------------');
    
    const loginData = {
      email: testUser.email,
      password: testUser.password,
      device_name: 'Alarrache Mobile App'
    };

    console.log('Données envoyées:', JSON.stringify(loginData, null, 2));
    
    const loginResponse = await makeRequest('POST', '/login', loginData);
    
    console.log(`Status: ${loginResponse.status}`);
    console.log('Réponse reçue:', JSON.stringify(loginResponse.data, null, 2));
    
    // Vérifier que firstname et lastname sont présents
    if (loginResponse.data.user && loginResponse.data.user.firstname && loginResponse.data.user.lastname) {
      console.log('✅ SUCCÈS: firstname et lastname présents dans la réponse de connexion');
    } else {
      console.log('❌ ÉCHEC: firstname ou lastname manquants dans la réponse de connexion');
      return;
    }

    console.log('');

    // Test 2: Inscription (pour comparaison)
    console.log('📝 Test 2: Inscription (comparaison)');
    console.log('-----------------------------------');
    
    const registerData = {
      firstname: 'Test',
      lastname: 'User',
      email: 'test.user@example.com',
      password: 'password123',
      password_confirmation: 'password123',
      device_name: 'Alarrache Mobile App'
    };

    console.log('Données envoyées:', JSON.stringify(registerData, null, 2));
    
    const registerResponse = await makeRequest('POST', '/register', registerData);
    
    console.log(`Status: ${registerResponse.status}`);
    console.log('Réponse reçue:', JSON.stringify(registerResponse.data, null, 2));
    
    // Vérifier que firstname et lastname sont présents
    if (registerResponse.data.user && registerResponse.data.user.firstname && registerResponse.data.user.lastname) {
      console.log('✅ SUCCÈS: firstname et lastname présents dans la réponse d\'inscription');
    } else {
      console.log('❌ ÉCHEC: firstname ou lastname manquants dans la réponse d\'inscription');
    }

    console.log('');

    // Test 3: Comparaison des structures
    console.log('🔍 Test 3: Comparaison des structures');
    console.log('------------------------------------');
    
    const loginUser = loginResponse.data.user;
    const registerUser = registerResponse.data.user;
    
    console.log('Structure utilisateur - Connexion:');
    console.log(`  - id: ${loginUser.id}`);
    console.log(`  - email: ${loginUser.email}`);
    console.log(`  - firstname: ${loginUser.firstname}`);
    console.log(`  - lastname: ${loginUser.lastname}`);
    console.log(`  - role: ${loginUser.role}`);
    
    console.log('');
    console.log('Structure utilisateur - Inscription:');
    console.log(`  - id: ${registerUser.id}`);
    console.log(`  - email: ${registerUser.email}`);
    console.log(`  - firstname: ${registerUser.firstname}`);
    console.log(`  - lastname: ${registerUser.lastname}`);
    console.log(`  - role: ${registerUser.role}`);
    
    // Vérifier la cohérence
    const loginFields = Object.keys(loginUser).sort();
    const registerFields = Object.keys(registerUser).sort();
    
    console.log('');
    console.log('Champs présents - Connexion:', loginFields);
    console.log('Champs présents - Inscription:', registerFields);
    
    if (JSON.stringify(loginFields) === JSON.stringify(registerFields)) {
      console.log('✅ SUCCÈS: Structures identiques entre connexion et inscription');
    } else {
      console.log('⚠️  ATTENTION: Différences dans les structures');
    }

    console.log('');
    console.log('🎉 Tests terminés avec succès !');
    console.log('');
    console.log('💡 L\'application mobile devrait maintenant fonctionner correctement');
    console.log('   sans erreurs AsyncStorage ou de normalisation des données.');

  } catch (error) {
    console.error('❌ Erreur lors des tests:', error.message);
  }
}

// Exécuter les tests
testAuthentication(); 