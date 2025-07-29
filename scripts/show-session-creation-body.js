#!/usr/bin/env node

/**
 * Affichage du body envoyé à l'API lors de la création d'une session
 * 
 * Ce script simule exactement ce qui est envoyé à l'API
 * lors de la création d'une session avec participants.
 */


// Simuler les données comme elles viennent de l'API
const friends = [
  {
    id: '1',
    firstname: 'Jean',
    lastname: 'Dupont',
    avatar: 'https://i.pravatar.cc/150?img=1',
    email: 'jean.dupont@example.com'
  },
  {
    id: '2',
    firstname: 'Marie',
    lastname: 'Martin',
    avatar: null,
    email: 'marie.martin@example.com'
  },
  {
    id: '3',
    firstname: 'Pierre',
    lastname: 'Durand',
    avatar: 'https://i.pravatar.cc/150?img=3',
    email: 'pierre.durand@example.com'
  }
];

// Simuler la sélection de participants
const selectedFriends = ['1', '3']; // Jean et Pierre sélectionnés

// Simuler les données de session
const sessionFormData = {
  selectedSport: 'tennis',
  date: new Date('2024-12-25'),
  time: new Date('2024-12-25T18:00:00'),
  location: 'Tennis Club de Paris',
  maxParticipants: '8'
};

// 1. Données préparées dans create-session.tsx

const selectedFriendsData = friends
  .filter(friend => selectedFriends.includes(friend.id))
  .map(friend => ({
    id: friend.id,
    firstname: friend.firstname, // ✅ Conversion vers camelCase
    lastname: friend.lastname,   // ✅ Conversion vers camelCase
    status: 'pending',
  }));

const sessionData = {
  sport: sessionFormData.selectedSport,
  date: sessionFormData.date.toISOString().split('T')[0], // Format YYYY-MM-DD
  time: sessionFormData.time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
  location: sessionFormData.location,
  participants: selectedFriendsData,
};


// 2. Conversion dans convertToCreateSessionData

function convertToCreateSessionData(sessionData) {
  return {
    title: sessionData.sport, // Utiliser le sport comme titre
    date: sessionData.date || new Date().toISOString().split('T')[0],
    time: sessionData.time || '18:00',
    location: sessionData.location || 'Lieu par défaut',
    sport: sessionData.sport || 'tennis',
    maxParticipants: 10, // Valeur par défaut
  };
}

const createData = convertToCreateSessionData(sessionData);


// 3. Body final envoyé à l'API


// 4. Analyse des données



// 5. Flux complet



// 6. Problème potentiel identifié



// 7. Recommandations


