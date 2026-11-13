import { sortSports, matchesSearch, matchesSportSearch, normalizeForSearch } from '../search';

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

describe('sortSports', () => {
  it('trie en français : accents rangés avec leur lettre, sans tenir compte de la casse', () => {
    expect(sortSports(['équitation', 'pêche', 'aïkido', 'padel', 'pétanque', 'esport', 'escalade'])).toEqual([
      'aïkido', 'équitation', 'escalade', 'esport', 'padel', 'pêche', 'pétanque',
    ]);
  });

  it('ne modifie pas la liste reçue', () => {
    const list = ['b', 'a'];
    sortSports(list);
    expect(list).toEqual(['b', 'a']);
  });
});
