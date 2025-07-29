import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ENV, isDevelopment, isMockMode } from '../config/env';
import { baseApiService } from '../services/api/baseApi';

interface DebugConfigProps {
  visible?: boolean;
}

export const DebugConfig: React.FC<DebugConfigProps> = ({ visible = false }) => {
  if (!visible || !isDevelopment()) {
    return null;
  }

  const config = baseApiService.getConfig();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 Configuration de Débogage</Text>
      <ScrollView style={styles.scrollView}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🌐 API Configuration</Text>
          <Text style={styles.configItem}>Base URL: {config.baseURL}</Text>
          <Text style={styles.configItem}>Mocks: {config.useMocks ? '✅ Activé' : '❌ Désactivé'}</Text>
          <Text style={styles.configItem}>Environment: {config.environment}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚙️ Variables d'Environnement</Text>
          <Text style={styles.configItem}>API Base URL: {ENV.API_BASE_URL}</Text>
          <Text style={styles.configItem}>Use Mocks: {ENV.USE_MOCKS ? 'true' : 'false'}</Text>
          <Text style={styles.configItem}>Server Host: {ENV.SERVER_HOST}</Text>
          <Text style={styles.configItem}>Server Port: {ENV.SERVER_PORT}</Text>
          <Text style={styles.configItem}>API Version: {ENV.API_VERSION}</Text>
          <Text style={styles.configItem}>App Name: {ENV.APP_NAME}</Text>
          <Text style={styles.configItem}>App Version: {ENV.APP_VERSION}</Text>
          <Text style={styles.configItem}>Request Timeout: {ENV.REQUEST_TIMEOUT}ms</Text>
          <Text style={styles.configItem}>Max Retries: {ENV.MAX_RETRIES}</Text>
          <Text style={styles.configItem}>Environment: {ENV.ENVIRONMENT}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 État Actuel</Text>
          <Text style={styles.configItem}>Mode Développement: {isDevelopment() ? '✅ Oui' : '❌ Non'}</Text>
          <Text style={styles.configItem}>Mode Mock: {isMockMode() ? '✅ Oui' : '❌ Non'}</Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    maxHeight: 400,
    zIndex: 1000,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  configItem: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
}); 