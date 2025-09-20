import {
    Comment,
    CommentsListResponse,
    CreateCommentData,
    PresenceResponse,
    TypingData,
    UpdateCommentData
} from '../../types/comment';
import { CreateSessionData, Session, UpdateSessionData } from '../types/sessions';
import { baseApiService } from './baseApi';
import { SESSIONS_ENDPOINTS } from './endpoints';
import { LaravelResponse } from './types';

// Service API des sessions
export class SessionsApi {
  // Récupérer toutes les sessions
  static async getAll(): Promise<Session[]> {
    const response = await baseApiService.get<LaravelResponse<Session[]>>(SESSIONS_ENDPOINTS.ALL);
    return response.data || [];
  }

  // Récupérer les sessions créées par l'utilisateur
  static async getMyCreated(): Promise<Session[]> {
    const response = await baseApiService.get<LaravelResponse<Session[]>>(SESSIONS_ENDPOINTS.MY_CREATED);
    return response.data || [];
  }

  // Récupérer les sessions où l'utilisateur participe
  static async getMyParticipations(): Promise<Session[]> {
    const response = await baseApiService.get<LaravelResponse<Session[]>>(SESSIONS_ENDPOINTS.MY_PARTICIPATIONS);
    return response.data || [];
  }

  // Récupérer une session par ID
  static async getById(id: string): Promise<Session> {
    const response = await baseApiService.get<LaravelResponse<Session>>(SESSIONS_ENDPOINTS.BY_ID(id));
    return response.data;
  }

  // Créer une nouvelle session
  static async create(sessionData: CreateSessionData): Promise<Session> {
    const response = await baseApiService.post<LaravelResponse<Session>>(SESSIONS_ENDPOINTS.ALL, sessionData);
    return response.data;
  }

  // Mettre à jour une session
  static async update(id: string, sessionData: UpdateSessionData): Promise<Session> {
    const response = await baseApiService.put<LaravelResponse<Session>>(SESSIONS_ENDPOINTS.BY_ID(id), sessionData);
    return response.data;
  }

  // Supprimer une session
  static async delete(id: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(SESSIONS_ENDPOINTS.BY_ID(id));
    return response.data;
  }

  // Accepter/refuser une invitation
  static async respondToInvitation(
    sessionId: string, 
    response: 'accept' | 'decline'
  ): Promise<Session> {
    const apiResponse = await baseApiService.patch<LaravelResponse<Session>>(
      SESSIONS_ENDPOINTS.RESPOND_TO_INVITATION(sessionId), 
      { response }
    );
    return apiResponse.data;
  }

  // Annuler sa participation à une session
  static async cancelParticipation(sessionId: string): Promise<Session> {
    const apiResponse = await baseApiService.patch<LaravelResponse<Session>>(
      SESSIONS_ENDPOINTS.CANCEL_PARTICIPATION(sessionId),
      { status: 'declined' }
    );
    return apiResponse.data;
  }

  static async cancelSession(sessionId: string): Promise<Session> {
    const apiResponse = await baseApiService.patch<LaravelResponse<Session>>(
      SESSIONS_ENDPOINTS.CANCEL_SESSION(sessionId),
      { status: 'cancelled' }
    );
    return apiResponse.data;
  }

  // Inviter des amis à une session
  static async inviteFriends(
    sessionId: string, 
    userIds: string[]
  ): Promise<any> {
    const response = await baseApiService.post<LaravelResponse<any>>(
      SESSIONS_ENDPOINTS.INVITE_FRIENDS(sessionId), 
      { userIds }
    );
    return response.data;
  }

  // Ajouter un commentaire
  static async addComment(sessionId: string, comment: string): Promise<Comment> {
    const response = await baseApiService.post<LaravelResponse<Comment>>(
      SESSIONS_ENDPOINTS.ADD_COMMENT(sessionId), 
      { content: comment }
    );
    return response.data;
  }

  // Commentaires
  static async getComments(sessionId: string, page: number = 1, limit: number = 20): Promise<CommentsListResponse> {
    const response = await baseApiService.get<LaravelResponse<CommentsListResponse>>(
      `${SESSIONS_ENDPOINTS.GET_COMMENTS(sessionId)}?page=${page}&limit=${limit}`
    );
    return response.data;
  }

  static async createComment(sessionId: string, commentData: CreateCommentData): Promise<Comment> {
    const response = await baseApiService.post<LaravelResponse<Comment>>(
      SESSIONS_ENDPOINTS.ADD_COMMENT(sessionId),
      commentData
    );
    return response.data;
  }

  static async updateComment(sessionId: string, commentId: string, commentData: UpdateCommentData): Promise<Comment> {
    const response = await baseApiService.put<LaravelResponse<Comment>>(
      SESSIONS_ENDPOINTS.UPDATE_COMMENT(sessionId, commentId),
      commentData
    );
    return response.data;
  }

  static async deleteComment(sessionId: string, commentId: string): Promise<void> {
    const response = await baseApiService.delete<LaravelResponse<void>>(
      SESSIONS_ENDPOINTS.DELETE_COMMENT(sessionId, commentId)
    );
    return response.data;
  }

  // Présence
  static async joinPresence(sessionId: string): Promise<any> {
    const response = await baseApiService.post<LaravelResponse<any>>(
      SESSIONS_ENDPOINTS.PRESENCE_JOIN(sessionId),
      {}
    );
    return response.data;
  }

  static async leavePresence(sessionId: string): Promise<any> {
    const response = await baseApiService.post<LaravelResponse<any>>(
      SESSIONS_ENDPOINTS.PRESENCE_LEAVE(sessionId),
      {}
    );
    return response.data;
  }

  static async sendTyping(sessionId: string, typingData: TypingData): Promise<any> {
    const response = await baseApiService.post<LaravelResponse<any>>(
      SESSIONS_ENDPOINTS.PRESENCE_TYPING(sessionId),
      typingData
    );
    return response.data;
  }

  static async getPresenceUsers(sessionId: string): Promise<PresenceResponse> {
    const response = await baseApiService.get<LaravelResponse<PresenceResponse>>(
      SESSIONS_ENDPOINTS.PRESENCE_USERS(sessionId)
    );
    return response.data;
  }
} 