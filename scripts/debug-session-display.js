#!/usr/bin/env node

/**
 * Debug de l'affichage maxParticipants dans l'application
 * 
 * Ce script aide à diagnostiquer pourquoi l'affichage du nombre
 * maximum de participants ne s'affiche pas dans l'application.
 */


// Simuler les données comme elles arrivent dans l'application
const debugScenarios = [
  {
    name: 'Données API réelles (curl)',
    session: {
      id: "a039a533-1540-4832-870d-660cad250d22",
      sport: "tennis",
      date: "2025-07-29",
      time: "19:00:00",
      location: "Tennis Club de Paris",
      maxParticipants: 5,
      organizer: {
        id: "9f73f831-fc88-43e3-9af5-1b0369007941",
        fullName: "Details Test"
      },
      participants: [
        {
          id: "9f73f831-fc88-43e3-9af5-1b0369007941",
          fullName: "Details Test",
          status: "accepted"
        }
      ],
      comments: []
    },
    expected: '1/5'
  },
  {
    name: 'Données avec maxParticipants null',
    session: {
      id: "1",
      sport: "golf",
      date: "2025-07-30",
      time: "14:00:00",
      location: "Golf Club",
      maxParticipants: null,
      organizer: {
        id: "1",
        fullName: "Organisateur"
      },
      participants: [
        {
          id: "1",
          fullName: "Organisateur",
          status: "accepted"
        }
      ],
      comments: []
    },
    expected: 'Pas d\'affichage'
  },
  {
    name: 'Données sans maxParticipants',
    session: {
      id: "2",
      sport: "musculation",
      date: "2025-07-31",
      time: "16:00:00",
      location: "Salle de sport",
      organizer: {
        id: "1",
        fullName: "Organisateur"
      },
      participants: [
        {
          id: "1",
          fullName: "Organisateur",
          status: "accepted"
        }
      ],
      comments: []
    },
    expected: 'Pas d\'affichage'
  },
  {
    name: 'Données avec participants multiples',
    session: {
      id: "3",
      sport: "football",
      date: "2025-08-01",
      time: "20:00:00",
      location: "Stade",
      maxParticipants: 10,
      organizer: {
        id: "1",
        fullName: "Organisateur"
      },
      participants: [
        {
          id: "1",
          fullName: "Organisateur",
          status: "accepted"
        },
        {
          id: "2",
          fullName: "Joueur 1",
          status: "accepted"
        },
        {
          id: "3",
          fullName: "Joueur 2",
          status: "pending"
        },
        {
          id: "4",
          fullName: "Joueur 3",
          status: "accepted"
        }
      ],
      comments: []
    },
    expected: '3/10'
  }
];

// Fonction pour tester l'affichage (comme dans le frontend)
function testDisplayLogic(session) {
  
  const acceptedCount = session.participants.filter(p => p.status === 'accepted').length;
  
  // Logique du frontend
  const shouldDisplay = session.maxParticipants && session.maxParticipants > 0;
  const displayText = shouldDisplay ? `${acceptedCount}/${session.maxParticipants}` : null;
  
  
  return displayText;
}

// Test de la condition d'affichage
function testDisplayCondition() {
  
  const testCases = [
    { maxParticipants: 5, expected: true },
    { maxParticipants: 0, expected: false },
    { maxParticipants: null, expected: false },
    { maxParticipants: undefined, expected: false },
    { maxParticipants: 1, expected: true },
    { maxParticipants: -1, expected: true } // Devrait être false mais la condition actuelle l'accepte
  ];
  
  testCases.forEach((testCase, index) => {
    const shouldDisplay = testCase.maxParticipants && testCase.maxParticipants > 0;
  });
}

// Test des scénarios
function testScenarios() {
  
  debugScenarios.forEach((scenario, index) => {
    const result = testDisplayLogic(scenario.session);
    const expected = scenario.expected;
    
    if (result === expected || (result === null && expected === 'Pas d\'affichage')) {
    } else {
    }
  });
}

// Debug des logs de l'application
function debugAppLogs() {
  
  
}

// Fonction principale
async function runDebug() {
  
  testDisplayCondition();
  testScenarios();
  debugAppLogs();
  
  
}

// Exécuter le debug si le script est appelé directement
if (require.main === module) {
}

module.exports = {
  testDisplayLogic,
  testDisplayCondition,
  testScenarios,
  debugAppLogs,
  runDebug
}; 