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
    console.log('📡 [UsersApi] Envoi demande d\'ami pour userId:', userId);
    console.log('📡 [UsersApi] Endpoint:', USERS_ENDPOINTS.FRIEND_REQUESTS);
    
    // Vérifier que l'utilisateur n'essaie pas de s'ajouter lui-même
    if (!userId || userId.trim() === '') {
      throw new Error('ID utilisateur invalide');
    }
    
    const body = { userId };
    console.log('📡 [UsersApi] Body:', body);
    
    try {
      const response = await baseApiService.post<LaravelResponse<FriendRequest>>(USERS_ENDPOINTS.FRIEND_REQUESTS, body);
      console.log('✅ [UsersApi] Réponse reçue:', response);
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