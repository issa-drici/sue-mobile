import * as utils from '..';
import { convertApiSessionToFrontend } from '..';

describe('convertApiSessionToFrontend', () => {
  it('découpe les noms complets (le dernier mot est le nom)', () => {
    const result = convertApiSessionToFrontend({
      id: 's1', sport: 'tennis', date: '2026-01-01', startTime: '10:00', endTime: '11:00', location: 'Club', status: 'active',
      organizer: { id: 'o', fullName: 'Jean Pierre Dupont' },
      participants: [{ id: 'p', fullName: 'Léa Martin', status: 'accepted' }, { id: 'q', fullName: null as any, status: 'pending' }],
      comments: [{ id: 'c', userId: 'p', fullName: 'Solo', content: 'Yo', createdAt: 'd' }],
    });
    expect(result).toEqual({
      id: 's1', sport: 'tennis', date: '2026-01-01', startTime: '10:00', endTime: '11:00', location: 'Club', status: 'active',
      organizer: { id: 'o', firstname: 'Jean Pierre', lastname: 'Dupont' },
      participants: [
        { id: 'p', status: 'accepted', firstname: 'Léa', lastname: 'Martin' },
        { id: 'q', status: 'pending', firstname: 'Utilisateur', lastname: '' },
      ],
      comments: [{ id: 'c', userId: 'p', content: 'Yo', createdAt: 'd', firstname: '', lastname: 'Solo' }],
    });
  });
});

it('réexporte les utilitaires', () => {
  ['formatCommentDate', 'formatDate', 'formatDateTime', 'formatRelativeDate', 'formatShortDate', 'formatTime', 'addOneHour',
    'endsNextDay', 'formatTimeString', 'getDefaultEndTime', 'isValidEndTime', 'roundToNearestHalfHour', 'roundToNextHalfHour',
    'getSportEmoji', 'formatAvatarUrl'].forEach((name) => expect(typeof (utils as any)[name]).toBe('function'));
  expect(utils.SPORT_EMOJIS.tennis).toBe('🎾');
  expect(utils.SPORTS_LIST.length).toBeGreaterThan(0);
});
