// Services API
export * from './api/authApi';
export * from './api/notificationsApi';
export * from './api/sessionsApi';
export * from './api/usersApi';

// Hooks des sessions
export {
    useCancelParticipation,
    useCancelSession,
    useCreateSession,
    useDeleteSession,
    useGetSessionById,
    useGetSessions,
    useInviteFriends,
    useRespondToInvitation,
    useUpdateSession
} from './sessions';

// Hooks des commentaires
export {
    useCreateComment,
    useGetComments
} from './comments';

// Hook de l'historique
export { useGetHistory } from './sessions/getHistory';

// Hooks des utilisateurs
export * from './users/deleteAccount';
export * from './users/getUserById';
export * from './users/getUserProfile';
export * from './users/getUsers';
export * from './users/searchUsers';
export * from './users/updateEmail';
export * from './users/updatePassword';
export * from './users/updateUser';

// Hooks des amis
export {
    useCancelFriendRequest, useGetFriendRequests, useGetFriendRequestsCount, useGetFriends, useRemoveFriend, useRespondToFriendRequest, useSendFriendRequest
} from './friends';

// Hooks des notifications
export * from './notifications/deleteNotification';
export * from './notifications/getNotifications';
export * from './notifications/markAllNotificationsAsRead';
export * from './notifications/markNotificationAsRead';

// Service WebSocket
export { webSocketService } from './websocket';
export type { CommentEvent, PresenceEvent, WebSocketConfig } from './websocket';

