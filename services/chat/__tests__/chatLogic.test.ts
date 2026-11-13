import {
  mentionLabels,
  mentionQueryAt,
  mentionSuggestions,
  mentionsStillInText,
  splitMentions,
  ticksFor,
} from '../chatLogic';
import { ChatMember } from '../types';

const member = (id: string, firstname: string, lastname: string, status: ChatMember['status'] = 'accepted'): ChatMember => ({
  id, firstname, lastname, avatarUrl: null, status, isOrganizer: false,
});

const alex = member('me', 'Alex', 'Roux');
const paulD = member('p1', 'Paul', 'Durand');
const paulM = member('p2', 'Paul', 'Martin');
const lea = member('l1', 'Léa', 'Petit');
const lucas = member('lu', 'Lucas', 'Blanc', 'declined');

describe('mentionLabels', () => {
  it('utilise le prénom, et ajoute l’initiale du nom quand deux membres ont le même prénom', () => {
    const labels = mentionLabels([alex, paulD, paulM, lea]);
    expect(labels.get('me')).toBe('Alex');
    expect(labels.get('p1')).toBe('Paul D.');
    expect(labels.get('p2')).toBe('Paul M.');
    expect(labels.get('l1')).toBe('Léa');
  });
});

describe('splitMentions', () => {
  const labels = mentionLabels([alex, paulD, paulM, lea]);

  it('isole les mentions et garde le reste du texte', () => {
    expect(splitMentions('Salut @Léa, tu viens ?', ['l1'], labels)).toEqual([
      { text: 'Salut ' },
      { text: '@Léa', mentionId: 'l1' },
      { text: ', tu viens ?' },
    ]);
  });

  it('ne confond pas deux homonymes (libellé le plus long d’abord)', () => {
    const parts = splitMentions('@Paul D. et @Paul M.', ['p2', 'p1'], labels);
    expect(parts.filter((p) => p.mentionId).map((p) => p.mentionId)).toEqual(['p1', 'p2']);
  });

  it('ne met pas en avant un « @Prénom » qui n’est pas une vraie mention', () => {
    expect(splitMentions('Écris à @Léa', [], labels)).toEqual([{ text: 'Écris à @Léa' }]);
  });

  it('résiste aux caractères spéciaux des expressions régulières', () => {
    const odd = mentionLabels([member('x', 'J.(P)', 'Z')]);
    expect(splitMentions('Yo @J.(P) !', ['x'], odd)).toEqual([
      { text: 'Yo ' },
      { text: '@J.(P)', mentionId: 'x' },
      { text: ' !' },
    ]);
  });
});

describe('mentionQueryAt', () => {
  it('détecte une mention en cours juste avant le curseur', () => {
    expect(mentionQueryAt('On joue @Pa', 11)).toBe('pa');
    expect(mentionQueryAt('@', 1)).toBe('');
  });

  it('ignore un @ au milieu d’un mot (adresse e-mail) ou une mention terminée par un espace', () => {
    expect(mentionQueryAt('alex@gmail', 10)).toBeNull();
    expect(mentionQueryAt('@Paul ', 6)).toBeNull();
  });

  it('se base sur la position du curseur, pas sur la fin du texte', () => {
    expect(mentionQueryAt('@Le salut', 3)).toBe('le');
  });
});

describe('mentionSuggestions', () => {
  const members = [alex, paulD, paulM, lea, lucas];
  const labels = mentionLabels(members);

  it('ne se propose jamais soi-même', () => {
    expect(mentionSuggestions('', members, labels, 'me').map((m) => m.id)).not.toContain('me');
  });

  it('filtre sur le prénom ou le nom, sans tenir compte des majuscules', () => {
    expect(mentionSuggestions('paul', members, labels, 'me').map((m) => m.id)).toEqual(['p1', 'p2']);
    expect(mentionSuggestions('martin', members, labels, 'me').map((m) => m.id)).toEqual(['p2']);
  });

  it('propose aussi ceux qui ont refusé (ils restent dans le chat)', () => {
    expect(mentionSuggestions('luc', members, labels, 'me').map((m) => m.id)).toEqual(['lu']);
  });
});

describe('mentionsStillInText', () => {
  it('n’envoie que les mentions encore présentes dans le message', () => {
    const mentioned = new Map([['p1', 'Paul D.'], ['l1', 'Léa']]);
    expect(mentionsStillInText('Go @Léa', mentioned)).toEqual(['l1']);
  });
});

describe('ticksFor', () => {
  const others = [paulD, lea, lucas];

  it('horloge tant que le message n’est pas confirmé par le serveur', () => {
    expect(ticksFor(null, others, {})).toBe('clock');
  });

  it('une coche tant que tout le monde n’a pas lu, même si certains ont lu', () => {
    expect(ticksFor(10, others, {})).toBe('sent');
    expect(ticksFor(10, others, { p1: 10 })).toBe('sent');
  });

  it('coches bleues quand tous ceux qui n’ont pas refusé ont lu', () => {
    expect(ticksFor(10, others, { p1: 12, l1: 10 })).toBe('seenAll');
  });

  it('un lecteur arrêté avant ce message ne compte pas', () => {
    expect(ticksFor(10, others, { p1: 12, l1: 9 })).toBe('sent');
  });

  it('reste à une coche si personne d’autre n’est actif dans la session', () => {
    expect(ticksFor(10, [lucas], { lu: 10 })).toBe('sent');
  });
});
