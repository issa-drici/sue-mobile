#!/usr/bin/env node

/**
 * Script de test pour vérifier la connexion websocket et les événements de commentaires
 */

const { io } = require('socket.io-client');

// Configuration
const WEBSOCKET_URL = 'https://websocket.sue.alliance-tech.fr';
const API_BASE_URL = 'https://api.sue.alliance-tech.fr/api';

// Données de test
const testUser = {
  email: 'issa.drici@test.com',
  password: 'password123'
};

let authToken = null;
let sessionId = 'test-session-123';

// Fonction pour obtenir un token d'authentification
async function getAuthToken() {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      email: testUser.email,
      password: testUser.password,
      device_name: 'WebSocket Test Script'
    });

    const options = {
      hostname: 'api.sue.alliance-tech.fr',
      port: 443,
      path: '/api/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': data.length
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
          if (response.token) {
            resolve(response.token);
          } else {
            reject(new Error('Token non trouvé dans la réponse'));
          }
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Fonction pour créer un commentaire via API
async function createComment(token, sessionId, content) {
  const https = require('https');
  
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      content: content,
      mentions: []
    });

    const options = {
      hostname: 'api.sue.alliance-tech.fr',
      port: 443,
      path: `/api/sessions/${sessionId}/comments`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Content-Length': data.length
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
          resolve(response);
        } catch (error) {
          reject(new Error(`Erreur parsing JSON: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

// Test de la connexion websocket
async function testWebSocket() {
  console.log('🧪 Test WebSocket - Commentaires en temps réel');
  console.log('==============================================');
  console.log('');

  try {
    // 1. Obtenir un token d'authentification
    console.log('🔐 Étape 1: Authentification...');
    authToken = await getAuthToken();
    console.log('✅ Token obtenu:', authToken.substring(0, 20) + '...');
    console.log('');

    // 2. Connexion WebSocket
    console.log('🔌 Étape 2: Connexion WebSocket...');
    console.log(`URL: ${WEBSOCKET_URL}`);
    
    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: {
        token: authToken
      },
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    // Événements de connexion
    socket.on('connect', () => {
      console.log('✅ WebSocket connecté!');
      console.log(`Socket ID: ${socket.id}`);
      console.log('');

      // 3. Rejoindre une session
      console.log('🎯 Étape 3: Rejoindre la session...');
      socket.emit('join-session', {
        sessionId: sessionId,
        userId: 'test-user-id',
        user: {
          id: 'test-user-id',
          firstname: 'Test',
          lastname: 'User',
          avatar: null
        }
      });
      console.log(`Session rejointe: ${sessionId}`);
      console.log('');
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ WebSocket déconnecté:', reason);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Erreur de connexion WebSocket:', error.message);
    });

    // Événements de commentaires
    socket.on('laravel-broadcast', (data) => {
      console.log('📨 Événement laravel-broadcast reçu:', JSON.stringify(data, null, 2));
      
      if (data.event === 'comment.created') {
        console.log('✅ Événement comment.created reçu!');
        console.log('Commentaire:', JSON.stringify(data.data.comment, null, 2));
      } else if (data.event === 'comment.updated') {
        console.log('✅ Événement comment.updated reçu!');
      } else if (data.event === 'comment.deleted') {
        console.log('✅ Événement comment.deleted reçu!');
      }
    });

    // Événements de présence
    socket.on('online-users', (users) => {
      console.log('👥 Utilisateurs en ligne:', users.length);
      users.forEach(user => {
        console.log(`  - ${user.user.firstname} ${user.user.lastname} (${user.socketId})`);
      });
    });

    // Attendre la connexion avant de continuer
    await new Promise((resolve) => {
      socket.on('connect', resolve);
      socket.on('connect_error', resolve);
    });

    if (!socket.connected) {
      console.log('❌ Impossible de se connecter au WebSocket');
      return;
    }

    // 4. Créer un commentaire via API
    console.log('💬 Étape 4: Créer un commentaire via API...');
    const commentContent = `Test commentaire WebSocket - ${new Date().toISOString()}`;
    
    try {
      const comment = await createComment(authToken, sessionId, commentContent);
      console.log('✅ Commentaire créé via API:', comment.id);
      console.log('Contenu:', comment.content);
      console.log('');

      // 5. Attendre l'événement WebSocket
      console.log('⏳ Étape 5: Attendre l\'événement WebSocket...');
      console.log('Attendez 10 secondes pour voir si l\'événement comment.created arrive...');
      
      let eventReceived = false;
      
      const timeout = setTimeout(() => {
        if (!eventReceived) {
          console.log('');
          console.log('❌ TIMEOUT: Aucun événement comment.created reçu après 10 secondes');
          console.log('');
          console.log('🔍 Diagnostic:');
          console.log('  - La connexion WebSocket fonctionne');
          console.log('  - L\'API de création de commentaire fonctionne');
          console.log('  - ❌ Le backend ne déclenche pas l\'événement WebSocket');
          console.log('');
          console.log('💡 Solution:');
          console.log('  - Vérifier que le backend émet bien l\'événement comment.created');
          console.log('  - Vérifier la configuration Laravel Broadcasting');
          console.log('  - Vérifier les logs du serveur WebSocket');
        }
        socket.disconnect();
      }, 10000);

      socket.on('laravel-broadcast', (data) => {
        if (data.event === 'comment.created') {
          eventReceived = true;
          clearTimeout(timeout);
          console.log('');
          console.log('🎉 SUCCÈS: Événement comment.created reçu!');
          console.log('Le système de commentaires en temps réel fonctionne!');
          socket.disconnect();
        }
      });

    } catch (error) {
      console.log('❌ Erreur lors de la création du commentaire:', error.message);
      socket.disconnect();
    }

  } catch (error) {
    console.log('❌ Erreur générale:', error.message);
  }
}

// Exécuter le test
testWebSocket(); 