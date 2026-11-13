/**
 * Normalise une chaîne pour une comparaison de recherche insensible aux
 * accents et à la casse (ex: "Équitation" et "equitation" doivent matcher).
 */
export function normalizeForSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function matchesSearch(candidate: string, query: string): boolean {
  return normalizeForSearch(candidate).includes(normalizeForSearch(query));
}

// Termes que les gens tapent sans penser au nom du sport dans la liste
const SPORT_SYNONYMS: Record<string, string[]> = {
  musculation: ['fitness', 'salle de sport'],
  esport: ['jeux video', 'jeu video', 'gaming', 'console', 'manette', 'fifa', 'fc 25', 'rocket league', 'lan'],
};

export function matchesSportSearch(sport: string, query: string): boolean {
  if (matchesSearch(sport, query)) return true;
  const synonyms = SPORT_SYNONYMS[normalizeForSearch(sport)] ?? [];
  return synonyms.some((term) => matchesSearch(term, query));
}

/** Tri alphabétique français des sports (« Équitation » avec les E, « Pêche » après « Padel ») */
export function sortSports<T extends string>(sports: readonly T[]): T[] {
  return [...sports].sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
}
