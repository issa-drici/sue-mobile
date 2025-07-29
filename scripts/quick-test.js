#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000/api';

async function quickTest() {

  // Test 1: Endpoint d'inscription
  try {
    const response = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstname: 'Test',
        lastname: 'User',
        email: 'test@example.com',
        password: 'password123',
        password_confirmation: 'password123',
        device_name: 'Sue Mobile App'
      })
    });

    const data = await response.text();
  } catch (error) {
  }

  // Test 2: Endpoint de connexion
  try {
    const response = await fetch(`${BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123',
        device_name: 'Sue Mobile App'
      })
    });

    const data = await response.text();
  } catch (error) {
  }

  // Test 3: Endpoint de sessions (sans auth)
  try {
    const response = await fetch(`${BASE_URL}/sessions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const data = await response.text();
  } catch (error) {
  }

}

