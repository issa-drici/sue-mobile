import { ChatMember } from './types';

/**
 * Règles du chat sans interface (testées dans services/chat/__tests__) : libellés de mention,
 * découpage d'un message autour des @mentions, détection d'une mention en cours de saisie,
 * coches de lecture.
 */

/** Libellé de mention : prénom, ou prénom + initiale si deux membres ont le même prénom */
export function mentionLabels(members: ChatMember[]): Map<string, string> {
  const counts = new Map<string, number>();
  members.forEach((m) => counts.set(m.firstname, (counts.get(m.firstname) ?? 0) + 1));
  return new Map(members.map((m) => [
    m.id,
    (counts.get(m.firstname) ?? 0) > 1 && m.lastname ? `${m.firstname} ${m.lastname.charAt(0)}.` : m.firstname,
  ]));
}

export type MessagePart = { text: string; mentionId?: string };

/** Découpe le texte d'un message en morceaux, les « @Prénom » mentionnés étant isolés */
export function splitMentions(body: string, mentions: string[], labels: Map<string, string>): MessagePart[] {
  const tokens = mentions
    .map((id) => ({ id, token: `@${labels.get(id) ?? ''}` }))
    .filter((t) => t.token.length > 1)
    // Les plus longs d'abord : « @Paul D. » avant « @Paul »
    .sort((a, b) => b.token.length - a.token.length);

  if (!tokens.length) return [{ text: body }];

  const escaped = tokens.map((t) => t.token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return body
    .split(new RegExp(`(${escaped.join('|')})`, 'g'))
    .filter((part) => part !== '')
    .map((part) => {
      const match = tokens.find((t) => t.token === part);
      return match ? { text: part, mentionId: match.id } : { text: part };
    });
}

/** Mention en cours de saisie juste avant le curseur (« … @pa| » → « pa »), sinon null */
export function mentionQueryAt(text: string, cursor: number): string | null {
  const match = text.slice(0, cursor).match(/(?:^|\s)@([^\s@]*)$/);
  return match ? match[1].toLowerCase() : null;
}

/** Membres proposés pour une mention en cours de saisie (jamais soi-même) */
export function mentionSuggestions(
  query: string,
  members: ChatMember[],
  labels: Map<string, string>,
  meId: string | undefined,
  limit = 6
): ChatMember[] {
  return members
    .filter((m) => m.id !== meId)
    .filter((m) => `${m.firstname} ${m.lastname}`.toLowerCase().includes(query)
      || (labels.get(m.id) ?? '').toLowerCase().startsWith(query))
    .slice(0, limit);
}

/** Mentions à envoyer : seulement celles dont le « @libellé » est encore dans le texte */
export function mentionsStillInText(body: string, mentioned: Map<string, string>): string[] {
  return Array.from(mentioned.entries())
    .filter(([, label]) => body.includes(`@${label}`))
    .map(([id]) => id);
}

/**
 * Coches de mes messages : 🕓 pas encore parti · ✓ envoyé · ✓✓ bleues lu par tous ceux qui n'ont
 * pas refusé (ceux qui ont refusé ne lisent souvent plus le chat, ils ne bloquent pas le bleu).
 */
export type Ticks = 'clock' | 'sent' | 'seenAll';

export function seenBy(messageId: number, others: ChatMember[], reads: Record<string, number>): ChatMember[] {
  return others.filter((m) => (reads[m.id] ?? 0) >= messageId);
}

export function ticksFor(messageId: number | null, others: ChatMember[], reads: Record<string, number>): Ticks {
  if (messageId === null) return 'clock';
  const readers = seenBy(messageId, others, reads);
  const active = others.filter((m) => m.status !== 'declined');
  return active.length > 0 && active.every((m) => readers.includes(m)) ? 'seenAll' : 'sent';
}
