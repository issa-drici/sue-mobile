#!/usr/bin/env node

const fs = require('fs');
const path = require('path');


// Structure attendue selon la documentation
const expectedStructure = {
  auth: {
    endpoints: ['/register', '/login', '/logout', '/refresh'],
    responseFormat: {
      success: true,
      data: {},
      message: 'string (optionnel)'
    }
  },
  sessions: {
    endpoints: [
      '/sessions',
      '/sessions/{id}',
      '/sessions/{id}/respond',
      '/sessions/{id}/comments'
    ],
    responseFormat: {
      success: true,
      data: {},
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      }
    }
  },
  notifications: {
    endpoints: [
      '/notifications',
      '/notifications/{id}/read',
      '/notifications/read-all',
      '/notifications/{id}',
      '/notifications/unread-count'
    ],
    responseFormat: {
      success: true,
      data: {},
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      }
    }
  },
  users: {
    endpoints: [
      '/users/profile',
      '/users/friends',
      '/users/friend-requests',
      '/users/search',
      '/users/update-email',
      '/users/update-password',
      '/users/delete-account'
    ],
    responseFormat: {
      success: true,
      data: {},
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 1
      }
    }
  }
};

// Vérifier les endpoints dans nos services
function validateEndpoints() {

  const endpointsFile = path.join(__dirname, '../services/api/endpoints.ts');
  if (!fs.existsSync(endpointsFile)) {
    return false;
  }

  const endpointsContent = fs.readFileSync(endpointsFile, 'utf8');
  
  // Vérifier les endpoints d'authentification
  const authEndpoints = [
    '/register',
    '/login',
    '/logout',
    '/refresh'
  ];
  
  authEndpoints.forEach(endpoint => {
    if (endpointsContent.includes(endpoint)) {
    } else {
    }
  });

  // Vérifier les endpoints de sessions
  const sessionEndpoints = [
    '/sessions',
    '/sessions/',
    'BY_ID',
    'RESPOND_TO_INVITATION',
    'ADD_COMMENT'
  ];
  
  sessionEndpoints.forEach(endpoint => {
    if (endpointsContent.includes(endpoint)) {
    } else {
    }
  });

  // Vérifier les endpoints de notifications
  const notificationEndpoints = [
    '/notifications',
    'MARK_AS_READ',
    'MARK_ALL_AS_READ',
    'UNREAD_COUNT'
  ];
  
  notificationEndpoints.forEach(endpoint => {
    if (endpointsContent.includes(endpoint)) {
    } else {
    }
  });

  // Vérifier les endpoints d'utilisateurs
  const userEndpoints = [
    '/users/profile',
    '/users/friends',
    '/users/friend-requests',
    '/users/search',
    'UPDATE_EMAIL',
    'UPDATE_PASSWORD',
    'DELETE_ACCOUNT'
  ];
  
  userEndpoints.forEach(endpoint => {
    if (endpointsContent.includes(endpoint)) {
    } else {
    }
  });

  return true;
}

// Vérifier la structure des réponses
function validateResponseStructure() {

  const services = [
    'services/api/notificationsApi.ts',
    'services/api/sessionsApi.ts',
    'services/api/usersApi.ts'
  ];

  services.forEach(servicePath => {
    const fullPath = path.join(__dirname, '..', servicePath);
    if (!fs.existsSync(fullPath)) {
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const serviceName = path.basename(servicePath, '.ts');
    
    
    // Vérifier l'utilisation de LaravelResponse
    if (content.includes('LaravelResponse')) {
    } else {
    }
    
    // Vérifier l'extraction de response.data
    if (content.includes('response.data')) {
    } else {
    }
    
    // Vérifier la gestion des tableaux vides
    if (content.includes('|| []')) {
    } else {
    }
  });
}

// Vérifier les types TypeScript
function validateTypes() {

  const typesFile = path.join(__dirname, '../services/api/types.ts');
  if (!fs.existsSync(typesFile)) {
    return false;
  }

  const typesContent = fs.readFileSync(typesFile, 'utf8');
  
  
  if (typesContent.includes('LaravelResponse')) {
  } else {
  }
  
  if (typesContent.includes('LaravelError')) {
  } else {
  }
  
  if (typesContent.includes('pagination')) {
  } else {
  }

  return true;
}

// Vérifier la documentation
function validateDocumentation() {

  const docsDir = path.join(__dirname, '../docs/api');
  const expectedDocs = [
    'README.md',
    'auth.md',
    'sessions.md',
    'notifications.md',
    'users.md'
  ];

  expectedDocs.forEach(doc => {
    const docPath = path.join(docsDir, doc);
    if (fs.existsSync(docPath)) {
      const stats = fs.statSync(docPath);
    } else {
    }
  });
}

// Exécuter toutes les validations
function runValidation() {
  
  validateEndpoints();
  validateResponseStructure();
  validateTypes();
  validateDocumentation();
  
}

runValidation(); 