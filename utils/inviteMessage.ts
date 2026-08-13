// Libellé "naturel" par sport pour les messages d'invitation partagés
// (ex: "Foot mardi à 18h30 ? Confirme ici"). Toujours écrit avec la
// casse correcte pour un DÉBUT de phrase ; cf. toMidSentenceLabel pour
// l'usage en milieu de phrase (après "Salut {prénom}, ").
const SPORT_SHARE_LABELS: Record<string, string> = {
  'aïkido': 'Aïkido',
  'aquafitness': 'Aquafitness',
  'athlétisme': 'Athlé',
  'aviron': 'Aviron',
  'badminton': 'Bad',
  'baseball': 'Baseball',
  'basketball': 'Basket',
  'bodyboard': 'Bodyboard',
  'bowling': 'Bowling',
  'boxe': 'Boxe',
  'course': 'On va courir',
  'cyclisme': 'On fait du vélo',
  'danse': 'On va danser',
  'équitation': 'On va monter à cheval',
  'escalade': 'On va grimper',
  'football': 'Foot',
  'golf': 'Golf',
  'gymnastique': 'Gym',
  'handball': 'Hand',
  'hockey': 'Hockey',
  'jiu-jitsu-brésilien': 'JJB',
  'judo': 'Judo',
  'karaté': 'Karaté',
  'kayak': 'Kayak',
  'marche-nordique': 'Marche nordique',
  'marche-sportive': 'Marche',
  'musculation': 'Muscu',
  'natation': 'On va nager',
  'padel': 'Padel',
  'pêche': 'On va pêcher',
  'pétanque': 'Pétanque',
  'pilates': 'Pilates',
  'ping-pong': 'Ping-pong',
  'planche-à-voile': 'Planche à voile',
  'randonnée': 'Rando',
  'rugby': 'Rugby',
  'sauvetage-sportif': 'Sauvetage sportif',
  'ski': 'Ski',
  'skateboard': 'Skate',
  'snowboard': 'Snow',
  'squash': 'Squash',
  'stand-up-paddle': 'SUP',
  'surf': 'Surf',
  'tennis': 'Tennis',
  'tir-à-l-arc': "Tir à l'arc",
  'triathlon': 'Triathlon',
  'volleyball': 'Volley',
  'yoga': 'Yoga',
};

function getSportShareLabel(sport: string): string {
  const key = (sport || '').toLowerCase().trim();
  return SPORT_SHARE_LABELS[key] || (sport ? sport.charAt(0).toUpperCase() + sport.slice(1) : 'Session');
}

// Passe un libellé en début-de-phrase ("Foot", "On va courir", "JJB") en
// milieu-de-phrase ("foot", "on va courir", "JJB" - inchangé pour les
// sigles courts tout en majuscules, qui ne se minusculisent pas en français).
function toMidSentenceLabel(label: string): string {
  const isShortAcronym = label === label.toUpperCase() && label.length <= 4;
  if (isShortAcronym) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

// "" si la session est aujourd'hui (l'heure seule suffit), "mardi" si elle a
// lieu dans moins de 7 jours, sinon date complète ("mardi 2 septembre") pour
// éviter l'ambiguïté sur la semaine.
function formatInviteDayLabel(dateStr: string): string {
  const sessionDate = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((sessionDate.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) {
    return '';
  }
  if (diffDays < 7) {
    return sessionDate.toLocaleDateString('fr-FR', { weekday: 'long' });
  }
  return sessionDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

// "18h30", ou "18h" si les minutes sont à 00.
function formatInviteTime(timeStr: string): string {
  const [h, m] = (timeStr || '00:00').split(':');
  const hours = parseInt(h, 10) || 0;
  const minutes = parseInt(m, 10) || 0;
  return minutes === 0 ? `${hours}h` : `${hours}h${String(minutes).padStart(2, '0')}`;
}

export function buildSessionInviteMessage(params: {
  sport: string;
  date: string;
  startTime: string;
  sessionUrl: string;
  contactName?: string;
}): string {
  const { sport, date, startTime, sessionUrl, contactName } = params;

  const label = getSportShareLabel(sport);
  const phrase = contactName ? toMidSentenceLabel(label) : label;
  const dayLabel = formatInviteDayLabel(date);
  const timeLabel = formatInviteTime(startTime);

  const intro = contactName ? `Salut ${contactName}, ${phrase}` : phrase;
  const whenLabel = dayLabel ? `${dayLabel} à ${timeLabel}` : `à ${timeLabel}`;

  return `${intro} ${whenLabel} ? Confirme ici\n${sessionUrl}`;
}
