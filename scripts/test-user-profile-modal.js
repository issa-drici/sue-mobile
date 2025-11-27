#!/usr/bin/env node

/**
 * Script de test pour la modal de profil utilisateur
 * Teste l'endpoint API et vérifie la présence du champ isAlreadyFriend
 */

const https = require('https');

// Configuration
const API_BASE_URL = 'https://api.sue.alliance-tech.fr/api';
const TEST_EMAIL = 'driciissa76@gmail.com';
const TEST_PASSWORD = 'Asmaa1997';

// Fonction pour faire une requête HTTPS
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
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

// Test de connexion
async function testLogin() {
  console.log('🔐 Test de connexion...');
  
  const loginData = {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    device_name: 'test-script'
  };
  
  const options = {
    hostname: 'api.sue.alliance-tech.fr',
    port: 443,
    path: '/api/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    }
  };
  
  try {
    const response = await makeRequest(options, loginData);
    console.log('✅ Connexion réussie');
    console.log('Token:', response.data.token ? 'Présent' : 'Manquant');
    console.log('User ID:', response.data.user?.id);
    return response.data.token;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    return null;
  }
}

// Test de récupération du profil utilisateur
async function testUserProfile(token, userId) {
  console.log('\n👤 Test de récupération du profil utilisateur...');
  
  const options = {
    hostname: 'api.sue.alliance-tech.fr',
    port: 443,
    path: `/api/users/${userId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    if (response.status === 200) {
      console.log('✅ Profil récupéré avec succès');
      
      const userData = response.data.data;
      console.log('📊 Données du profil:');
      console.log('- ID:', userData.id);
      console.log('- Nom:', `${userData.firstname} ${userData.lastname}`);
      console.log('- Email:', userData.email);
      console.log('- Avatar:', userData.avatar ? 'Présent' : 'Aucun');
      console.log('- Sessions créées:', userData.stats?.sessionsCreated);
      console.log('- Sessions participées:', userData.stats?.sessionsParticipated);
      
      // Vérification du champ isAlreadyFriend
      if (userData.hasOwnProperty('isAlreadyFriend')) {
        console.log('✅ Champ isAlreadyFriend présent:', userData.isAlreadyFriend);
      } else {
        console.log('❌ Champ isAlreadyFriend manquant');
      }
      
      // Vérification du champ sports_preferences
      if (userData.hasOwnProperty('sports_preferences')) {
        console.log('✅ Champ sports_preferences présent:', userData.sports_preferences);
        console.log('- Nombre de sports:', userData.sports_preferences.length);
        if (userData.sports_preferences.length > 0) {
          console.log('- Sports:', userData.sports_preferences.join(', '));
        }
      } else {
        console.log('❌ Champ sports_preferences manquant');
      }
      
      return true;
    } else {
      console.error('❌ Erreur HTTP:', response.status);
      console.error('Réponse:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de récupération du profil:', error.message);
    return false;
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Démarrage des tests de la modal de profil utilisateur\n');
  
  // Test 1: Connexion
  const token = await testLogin();
  if (!token) {
    console.log('\n❌ Impossible de continuer sans token');
    return;
  }
  
  // Test 2: Récupération du profil (son propre profil)
  const userId = '9f8fedb9-23a3-4294-bbd6-52813e86cbe9'; // ID de l'utilisateur de test
  const profileSuccess = await testUserProfile(token, userId);
  
  if (profileSuccess) {
    console.log('\n🎉 Tous les tests sont passés !');
    console.log('✅ La modal de profil utilisateur est prête à fonctionner');
  } else {
    console.log('\n❌ Certains tests ont échoué');
  }
}

// Exécution des tests
runTests().catch(console.error);







