import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../app/context/auth';
import { ProtectedScreen } from '../components/ProtectedScreen';

/**
 * Exemple d'utilisation du système de protection d'authentification
 * 
 * Ce composant montre comment :
 * 1. Protéger un écran avec ProtectedScreen
 * 2. Utiliser les hooks d'authentification
 * 3. Gérer la déconnexion automatique
 */
export function AuthProtectionExample() {
  const router = useRouter();
  const { user, signOut, forceLogout } = useAuth();

  const handleManualLogout = async () => {
    try {
      await signOut();
    } catch (error) {
    }
  };

  const handleForceLogout = async () => {
    try {
      await forceLogout();
    } catch (error) {
    }
  };

  const testUnauthorizedRequest = async () => {
    try {
      // Simuler une requête qui retourne 401
      const response = await fetch('http://localhost:8000/api/users/profile', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer invalid-token',
        }
      });

      if (response.status === 401) {
      }
    } catch (error) {
    }
  };

  return (
    <ProtectedScreen
      fallback={
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            🔒 Cet écran nécessite une authentification
          </Text>
          <Text style={styles.fallbackSubtext}>
            Redirection automatique vers la connexion...
          </Text>
        </View>
      }
    >
      <View style={styles.container}>
        <Text style={styles.title}>🔐 Exemple de Protection d'Authentification</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Utilisateur Connecté</Text>
          <Text style={styles.userInfo}>
            👤 {user?.firstname} {user?.lastname}
          </Text>
          <Text style={styles.userInfo}>
            📧 {user?.email}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions de Test</Text>
          
          <TouchableOpacity
            style={styles.button}
            onPress={handleManualLogout}
          >
            <Text style={styles.buttonText}>🚪 Déconnexion Manuelle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleForceLogout}
          >
            <Text style={styles.buttonText}>⚠️ Déconnexion Forcée</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={testUnauthorizedRequest}
          >
            <Text style={styles.buttonText}>🧪 Tester Requête 401</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comment ça marche</Text>
          <Text style={styles.explanation}>
            1️⃣ <Text style={styles.bold}>ProtectedScreen</Text> vérifie l'authentification
          </Text>
          <Text style={styles.explanation}>
            2️⃣ Si non connecté → redirection automatique vers /login
          </Text>
          <Text style={styles.explanation}>
            3️⃣ Si requête API retourne 401/403 → déconnexion automatique
          </Text>
          <Text style={styles.explanation}>
            4️⃣ Nettoyage du localStorage et redirection
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hooks Disponibles</Text>
          <Text style={styles.hookInfo}>
            • <Text style={styles.bold}>useProtectedRoute()</Text> - Pour les écrans protégés
          </Text>
          <Text style={styles.hookInfo}>
            • <Text style={styles.bold}>useAuthScreen()</Text> - Pour les écrans de connexion
          </Text>
          <Text style={styles.hookInfo}>
            • <Text style={styles.bold}>useAuthRedirect()</Text> - Redirection générale
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, styles.navigationButton]}
          onPress={() => router.back()}
        >
          <Text style={styles.buttonText}>← Retour</Text>
        </TouchableOpacity>
      </View>
    </ProtectedScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  userInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  testButton: {
    backgroundColor: '#FF9500',
  },
  navigationButton: {
    backgroundColor: '#34C759',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  explanation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 6,
    lineHeight: 20,
  },
  hookInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  bold: {
    fontWeight: 'bold',
    color: '#333',
  },
}); 