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
};

export function matchesSportSearch(sport: string, query: string): boolean {
  if (matchesSearch(sport, query)) return true;
  const synonyms = SPORT_SYNONYMS[normalizeForSearch(sport)] ?? [];
  return synonyms.some((term) => matchesSearch(term, query));
}
