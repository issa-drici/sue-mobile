import React from 'react';
import { StyleSheet, View } from 'react-native';
import InfoMessage from './InfoMessage';

/**
 * Exemples d'utilisation du composant InfoMessage
 * 
 * Ce fichier montre comment utiliser le composant InfoMessage
 * dans différents contextes de l'application.
 */

const InfoMessageExamples: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Message d'information générale */}
      <InfoMessage
        type="info"
        message="Bienvenue dans l'application Sue !"
        icon="information-circle"
      />

      {/* Message de succès */}
      <InfoMessage
        type="success"
        message="Votre invitation a été acceptée avec succès !"
        icon="checkmark-circle"
      />

      {/* Message d'avertissement */}
      <InfoMessage
        type="warning"
        message="La limite de participants a été atteinte. Vous ne pouvez plus accepter cette invitation."
        icon="warning"
      />

      {/* Message d'erreur */}
      <InfoMessage
        type="error"
        message="Une erreur s'est produite lors de l'envoi de votre invitation."
        icon="close-circle"
      />

      {/* Message avec icône par défaut */}
      <InfoMessage
        type="info"
        message="Ce message utilise l'icône par défaut du type 'info'"
      />

      {/* Message avec style personnalisé */}
      <InfoMessage
        type="success"
        message="Session créée avec succès !"
        style={{ marginTop: 20, marginBottom: 10 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
});

export default InfoMessageExamples;

/**
 * GUIDE D'UTILISATION
 * 
 * Le composant InfoMessage accepte les props suivantes :
 * 
 * - type: 'info' | 'warning' | 'success' | 'error'
 *   Détermine la couleur et le style du message
 * 
 * - message: string
 *   Le texte à afficher
 * 
 * - icon?: string
 *   Nom de l'icône Ionicons (optionnel, utilise l'icône par défaut si non fourni)
 * 
 * - style?: any
 *   Styles supplémentaires à appliquer au conteneur
 * 
 * EXEMPLES D'UTILISATION DANS L'APPLICATION :
 * 
 * 1. Messages de statut utilisateur :
 *    - Accepté : type="success", icon="checkmark-circle"
 *    - Refusé : type="error", icon="close-circle"
 *    - Organisateur : type="info", icon="person-circle"
 *    - Non invité : type="warning", icon="information-circle"
 * 
 * 2. Messages de limite :
 *    - Limite atteinte : type="warning", icon="warning"
 * 
 * 3. Messages d'erreur API :
 *    - Erreur réseau : type="error", icon="wifi-outline"
 *    - Erreur serveur : type="error", icon="server-outline"
 * 
 * 4. Messages de succès :
 *    - Invitation envoyée : type="success", icon="checkmark-circle"
 *    - Session créée : type="success", icon="checkmark-circle"
 * 
 * 5. Messages informatifs :
 *    - Instructions : type="info", icon="information-circle"
 *    - Conseils : type="info", icon="bulb-outline"
 */ 