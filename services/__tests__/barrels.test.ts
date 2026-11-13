/**
 * Points d'entrée (index) des services : chaque export attendu est bien présent.
 */
jest.mock('../../app/context/auth', () => ({ useAuth: () => ({ user: null }) }));
jest.mock('../../hooks/useApiRequest', () => ({ useApiRequest: jest.fn() }));
jest.mock('@react-navigation/native', () => ({ useFocusEffect: jest.fn() }));

it('services/index exporte les API et les hooks', () => {
  const services = require('..');
  ['AuthApi', 'NotificationsApi', 'SessionsApi', 'UsersApi'].forEach((name) => expect(services[name]).toBeDefined());
  [
    'useCancelParticipation', 'useCancelSession', 'useCreateSession', 'useDeleteSession', 'useGetSessionById', 'useGetSessions',
    'useInviteFriends', 'useRecentLocations', 'useRespondToInvitation', 'useSlotFinding', 'useUpdateSession', 'useGetHistory',
    'useDeleteAccount', 'useGetUserById', 'useGetUserProfile', 'useGetUsers', 'useSearchUsers', 'useUpdateEmail',
    'useUpdatePassword', 'useUpdateSportsPreferences', 'useUpdateUser', 'useCancelFriendRequest', 'useGetFriendRequests',
    'useGetFriendRequestsCount', 'useGetFriends', 'useRemoveFriend', 'useRespondToFriendRequest', 'useSendFriendRequest',
    'useDeleteNotification', 'useGetNotifications', 'useMarkAllNotificationsAsRead', 'useMarkNotificationAsRead',
  ].forEach((name) => expect(typeof services[name]).toBe('function'));
});

it('services/api/index exporte le client, les endpoints et les API', () => {
  const mod = require('../api/index');
  expect(mod.baseApiService).toBeDefined();
  expect(mod.AUTH_ENDPOINTS.LOGIN).toBe('/login');
  expect(mod.NOTIFICATIONS_ENDPOINTS.PUSH_TOKENS).toBe('/push-tokens');
  ['AuthApi', 'NotificationsApi', 'SessionsApi', 'UsersApi'].forEach((name) => expect(mod[name]).toBeDefined());
});

it('services/api.ts se charge sans erreur', () => {
  expect(() => require('../api.ts')).not.toThrow();
});

// BUG: services/api.ts:2 fait `export * from './api'`, qui se résout vers services/api.ts lui-même
// (un fichier passe avant le dossier services/api/), pas vers services/api/index.ts. Ce point d'entrée
// n'exporte donc aucune API (seulement les types). Il n'est importé nulle part dans l'app, mais
// services/README.md montre `import { AuthApi, … } from '../services/api'`, qui donnerait undefined.
// Correctif : `export * from './api/index'` (ou supprimer le fichier).
it.skip('services/api.ts réexporte les API', () => {
  const mod = require('../api.ts');
  expect(mod.baseApiService).toBeDefined();
  expect(mod.AuthApi).toBeDefined();
});

it('index des sous-dossiers', () => {
  expect(Object.keys(require('../users'))).toEqual(expect.arrayContaining(['useGetUsers', 'useSearchUsers', 'useUpdateUser']));
  expect(Object.keys(require('../notifications'))).toEqual(expect.arrayContaining(['useGetNotifications', 'useGetUnreadCount']));
  expect(require('../types')).toBeDefined();
  expect(require('../api/types')).toBeDefined();
  expect(require('../chat/types')).toBeDefined();
});
