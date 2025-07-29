#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Simulation du stockage SecureStore pour debug
class MockSecureStore {
  constructor() {
    this.storage = {};
  }

  async setItemAsync(key, value) {
    this.storage[key] = value;
    return Promise.resolve();
  }

  async getItemAsync(key) {
    const value = this.storage[key];
    if (value) {
    } else {
    }
    return Promise.resolve(value);
  }

  async deleteItemAsync(key) {
    delete this.storage[key];
    return Promise.resolve();
  }
}

// Simulation du contexte d'authentification
async function simulateAuthContext() {

  const SecureStore = new MockSecureStore();

  // 1. Simuler une connexion
  const mockUser = {
    id: '9f6fcbd6-a157-4909-b961-2f7f5505977e',
    firstname: 'Test',
    lastname: 'Persist',
    email: 'test-persist@test.com',
    token: '25|teEREzV7OvFptMA1iSCtR4qVc9HALh9cC...',
    avatar: null
  };

  await SecureStore.setItemAsync('user', JSON.stringify(mockUser));

  // 2. Simuler un redémarrage de l'app
  const userJson = await SecureStore.getItemAsync('user');
  
  if (userJson) {
    const userData = JSON.parse(userJson);
  } else {
  }

  // 3. Simuler une déconnexion
  await SecureStore.deleteItemAsync('user');
  
  const userAfterLogout = await SecureStore.getItemAsync('user');
  if (!userAfterLogout) {
  } else {
  }

}

