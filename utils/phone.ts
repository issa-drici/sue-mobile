/**
 * Numéros de téléphone : stockés en E.164 (+33612345678), affichés à la française (06 12 34 56 78).
 */

/** "+33612345678" -> "06 12 34 56 78" (espaces insécables : le numéro ne se coupe pas en fin de ligne) */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return '';
  const match = phone.match(/^\+33(\d{9})$/);
  if (!match) return phone;
  return `0${match[1]}`.replace(/(\d{2})(?=\d)/g, '$1\u00A0');
}

/** Saisie libre ("06 12…", "+33 6…", "612…") -> "+33612345678", ou null si ce n'est pas un numéro français */
export function normalizeFrenchPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+33')) digits = digits.slice(3);
  else if (digits.startsWith('0033')) digits = digits.slice(4);
  else if (digits.startsWith('33') && digits.length === 11) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^[1-9]\d{8}$/.test(digits) ? `+33${digits}` : null;
}
