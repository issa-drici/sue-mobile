#!/usr/bin/env node

/**
 * Vérification rapide des tokens push
 */

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000/api';

// Récupérer le token depuis les arguments
const AUTH_TOKEN = process.argv[2];

if (!AUTH_TOKEN) {
  process.exit(1);
}

async function quickCheck() {
  
  try {
    const response = await fetch(`${API_BASE_URL}/push-tokens`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${AUTH_TOKEN}`,
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      
      if (data.tokens && data.tokens.length > 0) {
        data.tokens.forEach((token, index) => {
        });
      } else {
      }
    } else {
    }
  } catch (error) {
  }
}

quickCheck(); 