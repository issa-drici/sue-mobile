// Endpoints de l'API organisés par domaine

// Endpoints d'authentification
export const AUTH_ENDPOINTS = {
  LOGIN: '/login',
  REGISTER: '/register',
  LOGOUT: '/logout',
  REFRESH_TOKEN: '/refresh',
  FORGOT_PASSWORD: '/forgot-password',
  // Auth par téléphone + OTP SMS
  PHONE_SEND_OTP: '/auth/phone/send-otp',
  PHONE_VERIFY: '/auth/phone/verify',
  PHONE_REGISTER: '/auth/phone/register',
} as const;

// Endpoints des sports
export const SPORTS_ENDPOINTS = {
  ALL: '/sports',
  PLAYED_BY_USER: '/users/played-sports',
} as const;

// Endpoints des sessions
export const SESSIONS_ENDPOINTS = {
  ALL: '/sessions',
  MY_CREATED: '/sessions/my-created',
  MY_PARTICIPATIONS: '/sessions/my-participations',
  BY_ID: (id: string) => `/sessions/${id}`,
  RESPOND_TO_INVITATION: (sessionId: string) => `/sessions/${sessionId}/respond`,
  CANCEL_PARTICIPATION: (sessionId: string) => `/sessions/${sessionId}/cancel-participation`,
  CANCEL_SESSION: (sessionId: string) => `/sessions/${sessionId}/cancel`,
  ADD_COMMENT: (sessionId: string) => `/sessions/${sessionId}/comments`,
  INVITE_FRIENDS: (sessionId: string) => `/sessions/${sessionId}/invite`,
  // Nouveaux endpoints pour les commentaires
  GET_COMMENTS: (sessionId: string) => `/sessions/${sessionId}/comments`,
  UPDATE_COMMENT: (sessionId: string, commentId: string) => `/sessions/${sessionId}/comments/${commentId}`,
  DELETE_COMMENT: (sessionId: string, commentId: string) => `/sessions/${sessionId}/comments/${commentId}`,
  // Endpoints de présence
  PRESENCE_JOIN: (sessionId: string) => `/sessions/${sessionId}/presence/join`,
  PRESENCE_LEAVE: (sessionId: string) => `/sessions/${sessionId}/presence/leave`,
  PRESENCE_TYPING: (sessionId: string) => `/sessions/${sessionId}/presence/typing`,
  PRESENCE_USERS: (sessionId: string) => `/sessions/${sessionId}/presence/users`,
  CHANGE_ORGANIZER: (sessionId: string) => `/sessions/${sessionId}/change-organizer`,
} as const;

// Endpoints de partage / Universal Links (/join/{token})
export const SHARE_ENDPOINTS = {
  // Aperçu public d'une session à partir du token (sans authentification)
  RESOLVE_TOKEN: (token: string) => `/join/${token}`,
  // Rejoindre une session à partir du token (nécessite d'être authentifié)
  JOIN_BY_TOKEN: (token: string) => `/join/${token}`,
} as const;

// Endpoints des utilisateurs
export const USERS_ENDPOINTS = {
  PROFILE: '/users/profile',
  PROFILE_AVATAR: '/profile/avatar',
  GET_USER_BY_ID: (userId: string) => `/users/${userId}`,
  FRIENDS: '/users/friends',
  FRIEND_REQUESTS: '/users/friend-requests',
  SEARCH: (query: string) => `/users/search?q=${encodeURIComponent(query)}`,
  UPDATE_EMAIL: '/users/update-email',
  UPDATE_PASSWORD: '/users/update-password',
  DELETE_ACCOUNT: '/users',
  REMOVE_FRIEND: (friendId: string) => `/users/friends/${friendId}`,
  SPORTS_PREFERENCES: '/users/sports-preferences',
  CHECK_CONTACTS: '/users/check-contacts',
} as const;

// Endpoints des demandes d'amis
export const FRIEND_REQUESTS_ENDPOINTS = {
  RESPOND: (requestId: string) => `/users/friend-requests/${requestId}`,
  CANCEL: '/users/friend-requests',
  COUNT: '/users/friend-requests/count',
} as const;

// Endpoints des notifications
export const NOTIFICATIONS_ENDPOINTS = {
  ALL: '/notifications',
  MARK_AS_READ: (notificationId: string) => `/notifications/${notificationId}/read`,
  MARK_ALL_AS_READ: '/notifications/read-all',
  UNREAD_COUNT: '/notifications/unread-count',
  DELETE: (notificationId: string) => `/notifications/${notificationId}`,
  PUSH_TOKENS: '/push-tokens',
} as const; 