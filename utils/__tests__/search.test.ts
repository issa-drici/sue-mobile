import { matchesSearch, matchesSportSearch, normalizeForSearch } from '../search';

describe('normalizeForSearch', () => {
  it('retire accents et majuscules', () => {
    expect(normalizeForSearch('Équitation')).toBe('equitation');
    expect(normalizeForSearch('PÉTANQUE à Noël')).toBe('petanque a noel');
  });
});

describe('matchesSearch', () => {
  it('compare sans accents ni casse, en sous-chaîne', () => {
    expect(matchesSearch('Équitation', 'equi')).toBe(true);
    expect(matchesSearch('equitation', 'ÉQUI')).toBe(true);
    expect(matchesSearch('Tennis', 'foot')).toBe(false);
    expect(matchesSearch('Tennis', '')).toBe(true);
  });
});

describe('matchesSportSearch', () => {
  it('trouve par le nom du sport', () => {
    expect(matchesSportSearch('musculation', 'muscu')).toBe(true);
  });

  it('trouve par synonyme', () => {
    expect(matchesSportSearch('musculation', 'Fitness')).toBe(true);
    expect(matchesSportSearch('musculation', 'salle')).toBe(true);
  });

  it('ne trouve pas sans nom ni synonyme correspondant', () => {
    expect(matchesSportSearch('musculation', 'natation')).toBe(false);
    expect(matchesSportSearch('tennis', 'fitness')).toBe(false);
  });
});
