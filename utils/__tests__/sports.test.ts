import { formatSportName, getSportEmoji, SPORT_EMOJIS } from '../sportEmojis';
import { SPORTS_LIST } from '../sportsList';

describe('getSportEmoji', () => {
  it('renvoie l’emoji du sport', () => {
    expect(getSportEmoji('tennis')).toBe('🎾');
    expect(getSportEmoji('jiu-jitsu-brésilien')).toBe('🥋');
  });

  it.each([undefined, '', 'cricket'])('emoji par défaut pour %p', (sport) => {
    expect(getSportEmoji(sport as any)).toBe('🏃');
  });
});

describe('formatSportName', () => {
  it.each([
    ['', ''],
    ['tennis', 'Tennis'],
    ['ping-pong', 'Ping Pong'],
    ['STAND-UP-PADDLE', 'Stand Up Paddle'],
  ])('« %s » → « %s »', (input, expected) => {
    expect(formatSportName(input)).toBe(expected);
  });
});

describe('SPORTS_LIST', () => {
  it('contient chaque sport une fois, chacun avec un emoji', () => {
    expect(new Set(SPORTS_LIST).size).toBe(SPORTS_LIST.length);
    SPORTS_LIST.forEach((sport) => expect(SPORT_EMOJIS[sport]).toBeTruthy());
    expect(Object.keys(SPORT_EMOJIS).sort()).toEqual([...SPORTS_LIST].sort());
  });
});
