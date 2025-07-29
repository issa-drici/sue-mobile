const { ExpoSecureStoreAdapter } = require('expo-secure-store');


async function clearAuthStorage() {
  try {
    
    // Supprimer le token stocké
    await ExpoSecureStoreAdapter.deleteItemAsync('user');
    
    
  } catch (error) {
  }
}

clearAuthStorage(); 