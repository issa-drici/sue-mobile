import { BrandColors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../app/context/auth';
import { ENV } from '../config/env';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function DebugConfig() {
  const { user, isAuthenticated, signOut, checkTokenValidity, refreshAuth } = useAuth();
  const [storageData, setStorageData] = useState<any>(null);
  const [tokenStatus, setTokenStatus] = useState<string>('Non vérifié');
  const { token: expoPushToken, initialize: initPush, isInitializing: isInitPush, isInitialized: pushReady, sendTestNotification } = usePushNotifications();

  const loadStorageData = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('authToken');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      setStorageData({
        user: userData ? JSON.parse(userData) : null,
        token: token ? `${token.substring(0, 20)}...` : null,
        refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : null,
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données de stockage:', error);
    }
  };

  const testTokenValidity = async () => {
    try {
      setTokenStatus('Vérification en cours...');
      const isValid = await checkTokenValidity();
      setTokenStatus(isValid ? '✅ Valide' : '❌ Invalide');
    } catch (error) {
      setTokenStatus('❌ Erreur');
      console.error('Erreur lors de la vérification:', error);
    }
  };

  const testRefreshToken = async () => {
    try {
      const success = await refreshAuth();
      if (success) {
        Alert.alert('Succès', 'Token rafraîchi avec succès !');
        loadStorageData(); // Recharger les données
      } else {
        Alert.alert('Échec', 'Impossible de rafraîchir le token');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Erreur lors du rafraîchissement du token');
      console.error('Erreur lors du refresh:', error);
    }
  };

  const clearStorage = async () => {
    try {
      await AsyncStorage.multiRemove(['user', 'authToken', 'refreshToken']);
      Alert.alert('Succès', 'Stockage nettoyé !');
      loadStorageData();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de nettoyer le stockage');
    }
  };

  useEffect(() => {
    loadStorageData();
  }, []);

  if (!ENV.IS_DEV) {
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🔧 Configuration de Debug</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>État de l'authentification</Text>
        <Text style={styles.text}>Connecté: {isAuthenticated ? '✅ Oui' : '❌ Non'}</Text>
        {user && (
          <>
            <Text style={styles.text}>ID: {user.id}</Text>
            <Text style={styles.text}>Nom: {user.firstname} {user.lastname}</Text>
            <Text style={styles.text}>Email: {user.email}</Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Données du stockage</Text>
        {storageData ? (
          <>
            <Text style={styles.text}>Utilisateur: {storageData.user ? '✅ Présent' : '❌ Absent'}</Text>
            <Text style={styles.text}>Token: {storageData.token || '❌ Absent'}</Text>
            <Text style={styles.text}>Refresh Token: {storageData.refreshToken || '❌ Absent'}</Text>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Statut du token</Text>
        <Text style={styles.text}>État: {tokenStatus}</Text>
        <TouchableOpacity style={styles.button} onPress={testTokenValidity}>
          <Text style={styles.buttonText}>Tester la validité du token</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        <TouchableOpacity style={styles.button} onPress={testRefreshToken}>
          <Text style={styles.buttonText}>Rafraîchir le token</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={initPush}>
          <Text style={styles.buttonText}>{isInitPush ? 'Initialisation push…' : 'Initialiser notifications push'}</Text>
        </TouchableOpacity>
        <Text style={styles.text}>Push prêt: {pushReady ? '✅ Oui' : '❌ Non'}</Text>
        <Text style={styles.text}>Expo Push Token: {expoPushToken ? expoPushToken : '❌ Indisponible'}</Text>
        
        <TouchableOpacity 
          style={[styles.button, !pushReady && styles.disabledButton]} 
          onPress={() => sendTestNotification(user?.id)}
          disabled={!pushReady}
        >
          <Text style={styles.buttonText}>Envoyer notification de test</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={loadStorageData}>
          <Text style={styles.buttonText}>Recharger les données</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearStorage}>
          <Text style={styles.buttonText}>Nettoyer le stockage</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={signOut}>
          <Text style={styles.buttonText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Configuration</Text>
        <Text style={styles.text}>API URL: {ENV.API_BASE_URL}</Text>
        <Text style={styles.text}>Environnement: {ENV.ENVIRONMENT}</Text>
        <Text style={styles.text}>Mocks activés: {ENV.USE_MOCKS ? '✅ Oui' : '❌ Non'}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  button: {
    backgroundColor: BrandColors.primary,
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  disabledButton: {
    backgroundColor: '#CCCCCC',
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 