import {
  Friend,
  FriendRequest,
  SearchUserResult,
  UpdateProfileData,
  UserProfile
} from '../types/users';
import { baseApiService } from './baseApi';
import { FRIEND_REQUESTS_ENDPOINTS, USERS_ENDPOINTS } from './endpoints';
import { LaravelResponse } from './types';

// Service API des utilisateurs
export class UsersApi {
  // Upload de la photo de profil (multipart). Renvoie l'URL publique du nouvel avatar.
  static async updateAvatar(uri: string): Promise<{ avatar_url: string }> {
    const filename = uri.split('/').pop() || `avatar_${Date.now()}.jpg`;
    const extMatch = /\.(\w+)$/.exec(filename);
    const ext = (extMatch ? extMatch[1] : 'jpg').toLowerCase();
    const type =
      ext === 'png' ? 'image/png' : ext === 'gif' ? 'image/gif' : 'image/jpeg';

    const formData = new FormData();
    // React Native attend un objet { uri, name, type } pour un fichier
    formData.append('avatar', { uri, name: filename, type } as any);

    return baseApiService.upload<{ avatar_url: string }>(
      USERS_ENDPOINTS.PROFILE_AVATAR,
      formData,
      'POST'
    );
  }

  // Vérifier quels contacts sont sur Sue
  static async checkContacts(phoneNumbers: string[]): Promise<any> {
    console.log('🌐 [UsersApi.checkContacts] Appel API avec', phoneNumbers.length, 'numéros');
    console.log('🌐 [UsersApi.checkContacts] Numéros:', phoneNumbers.slice(0, 5), '...');
    
    try {
      const response = await baseApiService.post<LaravelResponse<any>>(USERS_ENDPOINTS.CHECK_CONTACTS, { phoneNumbers });
      console.log('✅ [UsersApi.checkContacts] Réponse reçue:', JSON.stringify(response, null, 2));
      
      // La réponse Laravel est généralement { data: {...} }
      // Mais la réponse peut aussi être directement dans response.data.data si c'est un LaravelResponse
      if (response?.data) {
        return response.data;
      }
      
      return response;
    } catch (error: any) {
      console.error('❌ [UsersApi.checkContacts] Erreur:', error);
      console.error('❌ [UsersApi.checkContacts] Message:', error.message);
      console.error('❌ [UsersApi.checkContacts] Response:', error.response?.data);
      throw error;
    }
  }

  // Récupérer le profil utilisateur
  static async getProfile(): Promise<UserProfile> {
    const response = await baseApiService.get<LaravelResponse<UserProfile>>(USERS_ENDPOINTS.PROFILE);
    return response.data;
  }

  // Mettre à jour le profil
  static async updateProfile(profileData: UpdateProfileData): Promise<UserProfile> {
    const response = await baseApiService.put<LaravelResponse<UserProfile>>(USERS_ENDPOINTS.PROFILE, profileData);
    return response.data;
  }

  // Récupérer la liste d'amis
  static async getFriends(): Promise<Friend[]> {
    const response = await baseApiService.get<LaravelResponse<Friend[]>>(USERS_ENDPOINTS.FRIENDS);
    return response.data || [];
  }

  // Récupérer les demandes d'amis
  static async getFriendRequests(): Promise<FriendRequest[]> {
    const response = await baseApiService.get<LaravelResponse<FriendRequest[]>>(USERS_ENDPOINTS.FRIEND_REQUESTS);
    return response.data || [];
  }

  // Envoyer une demande d'ami
  static async sendFriendRequest(userId: string): Promise<FriendRequest> {
    // Vérifier que l'utilisateur n'essaie pas de s'ajouter lui-même
    if (!userId || userId.trim() === '') {
      throw new Error('ID utilisateur invalide');
    }
    
    // Structure du corps de la requête attendue par le backend
    // Selon la documentation API, le backend attend "userId" (camelCase)
    const body = { userId: userId };
    
    try {
      const response = await baseApiService.post<LaravelResponse<FriendRequest>>(USERS_ENDPOINTS.FRIEND_REQUESTS, body);
      return response.data;
    } catch (error) {
      console.error('❌ [UsersApi] Erreur lors de l\'envoi de demande d\'ami:', error);
      throw error;
    }
  }

  // Accepter/refuser une demande d'ami
  static async respondToFriendRequest(
    requestId: string, 
    response: 'accept' | 'decline'
  ): Promise<FriendRequest> {
    const apiResponse = await baseApiService.patch<LaravelResponse<FriendRequest>>(
      FRIEND_REQUESTS_ENDPOINTS.RESPOND(requestId), 
      { response }
    );
    return apiResponse.data;
  }

  // Annuler une demande d'ami envoyée
  static async cancelFriendRequest(userId: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(
      FRIEND_REQUESTS_ENDPOINTS.CANCEL,
      { target_user_id: userId }
    );
    return response.data;
  }

  // Supprimer un ami
  static async removeFriend(friendId: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(
      USERS_ENDPOINTS.REMOVE_FRIEND(friendId)
    );
    return response.data;
  }

  // Rechercher des utilisateurs
  static async searchUsers(query: string): Promise<SearchUserResult[]> {
    const response = await baseApiService.get<LaravelResponse<SearchUserResult[]>>(USERS_ENDPOINTS.SEARCH(query));
    return response.data || [];
  }

  // Mettre à jour l'email
  static async updateEmail(newEmail: string, currentEmail: string): Promise<void> {
    const response = await baseApiService.post<LaravelResponse<void>>(USERS_ENDPOINTS.UPDATE_EMAIL, { newEmail, currentEmail });
    return response.data;
  }

  // Mettre à jour le mot de passe
  static async updatePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await baseApiService.post<LaravelResponse<void>>(USERS_ENDPOINTS.UPDATE_PASSWORD, { currentPassword, newPassword });
    return response.data;
  }

  // Supprimer le compte
  static async deleteAccount(): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(USERS_ENDPOINTS.DELETE_ACCOUNT);
    return response.data;
  }

  // Récupérer le nombre de demandes d'amis non traitées
  static async getFriendRequestsCount(): Promise<number> {
    const response = await baseApiService.get<LaravelResponse<{ count: number }>>(
      FRIEND_REQUESTS_ENDPOINTS.COUNT
    );
    return response.data.count || 0;
  }
} 