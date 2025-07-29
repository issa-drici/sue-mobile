#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000/api';

async function debugProfileResponse() {

  // Générer un email unique
  const timestamp = Date.now();
  const email = `debug${timestamp}@test.com`;

  // 1. Créer un nouvel utilisateur
  const registerResponse = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstname: 'Debug',
      lastname: 'Test',
      email: email,
      password: 'password123',
      password_confirmation: 'password123',
      device_name: 'test-device'
    })
  });

  if (!registerResponse.ok) {
    const errorData = await registerResponse.text();
    return;
  }

  const registerData = await registerResponse.json();
  const token = registerData.token;

  // 2. Test du profil utilisateur
  const profileResponse = await fetch(`${BASE_URL}/users/profile`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  });

  const profileData = await profileResponse.text();
  
  
  try {
    const parsed = JSON.parse(profileData);
    
    if (parsed.data) {
      if (parsed.data.firstname) {
      }
      if (parsed.data.firstname) {
      }
    }
  } catch (e) {
  }
}

