#!/usr/bin/env node

/**
 * Script pour nettoyer le stockage d'authentification
 * Utile en cas de problèmes d'authentification
 */

const AsyncStorage = require('@react-native-async-storage/async-storage');

async function clearAuthStorage() {
  console.log('🧹 Nettoyage du stockage d\'authentification...');
  
  try {
    // Supprimer les données d'authentification
    await AsyncStorage.multiRemove(['user', 'authToken']);
    
    console.log('✅ Stockage d\'authentification nettoyé avec succès !');
    console.log('');
    console.log('🗑️  Données supprimées:');
    console.log('   - user');
    console.log('   - authToken');
    console.log('');
    console.log('💡 Redémarrez l\'application pour voir les changements.');
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  }
}

// Exécuter le script
clearAuthStorage(); 