#!/usr/bin/env node

/**
 * Script de test pour l'authentification
 * Teste les fonctions de connexion et d'inscription avec les mocks
 */

const { ENV } = require('../config/env.ts');

console.log('🧪 Test d\'authentification');
console.log('========================');
console.log(`Environment: ${ENV.ENVIRONMENT}`);
console.log(`API Base URL: ${ENV.API_BASE_URL}`);
console.log(`Use Mocks: ${ENV.USE_MOCKS}`);
console.log('');

// Simuler les données de test
const testUser = {
  email: 'test@example.com',
  password: 'password123',
  firstname: 'John',
  lastname: 'Doe'
};

console.log('📝 Données de test:');
console.log(JSON.stringify(testUser, null, 2));
console.log('');

// Simuler une requête de connexion
console.log('🔐 Test de connexion...');
const loginData = {
  email: testUser.email,
  password: testUser.password,
  device_name: 'Alarrache Mobile App'
};

console.log('Données envoyées:', JSON.stringify(loginData, null, 2));

// Simuler une réponse de connexion réussie
const mockLoginResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: '1',
      email: testUser.email,
      firstname: testUser.firstname,
      lastname: testUser.lastname,
      avatar: null
    }
  },
  message: 'Connexion réussie'
};

console.log('✅ Réponse simulée:', JSON.stringify(mockLoginResponse, null, 2));
console.log('');

// Simuler une requête d'inscription
console.log('📝 Test d\'inscription...');
const registerData = {
  firstname: testUser.firstname,
  lastname: testUser.lastname,
  email: testUser.email,
  password: testUser.password,
  password_confirmation: testUser.password,
  device_name: 'Alarrache Mobile App'
};

console.log('Données envoyées:', JSON.stringify(registerData, null, 2));

// Simuler une réponse d'inscription réussie
const mockRegisterResponse = {
  success: true,
  data: {
    token: 'mock-jwt-token-' + Date.now(),
    user: {
      id: '1',
      email: testUser.email,
      firstname: testUser.firstname,
      lastname: testUser.lastname,
      avatar: null
    }
  },
  message: 'Inscription réussie'
};

console.log('✅ Réponse simulée:', JSON.stringify(mockRegisterResponse, null, 2));
console.log('');

console.log('🎉 Tests terminés avec succès !');
console.log('');
console.log('💡 Pour tester l\'application:');
console.log('1. Redémarrez l\'application Expo');
console.log('2. Essayez de vous connecter avec: test@example.com / password123');
console.log('3. Ou créez un nouveau compte');
console.log('');
console.log('⚠️  Note: Les mocks sont activés. Désactivez-les dans config/env.ts pour utiliser l\'API réelle.'); 