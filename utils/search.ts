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
