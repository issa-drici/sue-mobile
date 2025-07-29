#!/usr/bin/env node

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8000/api';

async function debugSessionsDB() {

  // 1. Se connecter
  const loginResponse = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstname: 'Debug',
      lastname: 'DB',
      email: `debug-db-${Date.now()}@test.com`,
      password: 'password123',
      password_confirmation: 'password123',
      device_name: 'test'
    })
  });

  if (!loginResponse.ok) {
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.token;

  // 2. Tester différents endpoints

  // Test GET /sessions
  const getSessionsResponse = await fetch(`${BASE_URL}/sessions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (getSessionsResponse.ok) {
    const data = await getSessionsResponse.json();
  }

  // Test GET /sessions avec query params
  const getSessionsWithIncludeResponse = await fetch(`${BASE_URL}/sessions?include=organizer,participants`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (getSessionsWithIncludeResponse.ok) {
    const data = await getSessionsWithIncludeResponse.json();
  }

  // Test GET /sessions/my
  const getMySessionsResponse = await fetch(`${BASE_URL}/sessions/my`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (getMySessionsResponse.ok) {
    const data = await getMySessionsResponse.json();
  } else {
    const errorText = await getMySessionsResponse.text();
  }

  // Test GET /sessions/created
  const getCreatedSessionsResponse = await fetch(`${BASE_URL}/sessions/created`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  if (getCreatedSessionsResponse.ok) {
    const data = await getCreatedSessionsResponse.json();
  } else {
    const errorText = await getCreatedSessionsResponse.text();
  }

  // 3. Créer une session et la récupérer
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const futureDate = tomorrow.toISOString().split('T')[0];

  const createResponse = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: 'Session Debug Test',
      date: futureDate,
      time: '14:00',
      location: 'Lieu Debug',
      sport: 'tennis',
      maxParticipants: 4,
    })
  });

  if (createResponse.ok) {
    const createdSession = await createResponse.json();
    
    // Récupérer cette session spécifique
    const sessionId = createdSession.data?.id;
    if (sessionId) {
      const getSpecificResponse = await fetch(`${BASE_URL}/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });
      
      if (getSpecificResponse.ok) {
        const specificData = await getSpecificResponse.json();
      }
    }
  }

}

