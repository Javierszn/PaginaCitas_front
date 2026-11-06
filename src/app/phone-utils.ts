export const PHONE_COUNTRY_CODES = [
  { pais: 'México', codigo: '52' }, { pais: 'Estados Unidos', codigo: '1' }, { pais: 'Canadá', codigo: '1' },
  { pais: 'Argentina', codigo: '54' }, { pais: 'Bolivia', codigo: '591' }, { pais: 'Brasil', codigo: '55' },
  { pais: 'Chile', codigo: '56' }, { pais: 'Colombia', codigo: '57' }, { pais: 'Costa Rica', codigo: '506' },
  { pais: 'Cuba', codigo: '53' }, { pais: 'Ecuador', codigo: '593' }, { pais: 'El Salvador', codigo: '503' },
  { pais: 'Guatemala', codigo: '502' }, { pais: 'Honduras', codigo: '504' }, { pais: 'Nicaragua', codigo: '505' },
  { pais: 'Panamá', codigo: '507' }, { pais: 'Paraguay', codigo: '595' }, { pais: 'Perú', codigo: '51' },
  { pais: 'Puerto Rico', codigo: '1' }, { pais: 'República Dominicana', codigo: '1' }, { pais: 'Uruguay', codigo: '598' },
  { pais: 'Venezuela', codigo: '58' }, { pais: 'España', codigo: '34' }, { pais: 'Reino Unido', codigo: '44' },
  { pais: 'Francia', codigo: '33' }, { pais: 'Alemania', codigo: '49' }, { pais: 'Italia', codigo: '39' },
  { pais: 'Portugal', codigo: '351' }, { pais: 'Países Bajos', codigo: '31' }, { pais: 'Bélgica', codigo: '32' },
  { pais: 'Suiza', codigo: '41' }, { pais: 'Suecia', codigo: '46' }, { pais: 'Noruega', codigo: '47' },
  { pais: 'Dinamarca', codigo: '45' }, { pais: 'Irlanda', codigo: '353' }, { pais: 'Polonia', codigo: '48' },
  { pais: 'Rusia', codigo: '7' }, { pais: 'Turquía', codigo: '90' }, { pais: 'Israel', codigo: '972' },
  { pais: 'Arabia Saudita', codigo: '966' }, { pais: 'Emiratos Árabes Unidos', codigo: '971' }, { pais: 'India', codigo: '91' },
  { pais: 'China', codigo: '86' }, { pais: 'Japón', codigo: '81' }, { pais: 'Corea del Sur', codigo: '82' },
  { pais: 'Filipinas', codigo: '63' }, { pais: 'Australia', codigo: '61' }, { pais: 'Nueva Zelanda', codigo: '64' },
  { pais: 'Sudáfrica', codigo: '27' }, { pais: 'Egipto', codigo: '20' }, { pais: 'Marruecos', codigo: '212' }
];

export function parsePhoneForEditor(value: string | null | undefined): { codigo: string; numero: string } {
  const original = (value || '').trim();
  const digits = original.replace(/\D/g, '');
  const sortedCodes = [...new Set(PHONE_COUNTRY_CODES.map(item => item.codigo))].sort((a, b) => b.length - a.length);
  const countryCode = sortedCodes.find(code => digits.startsWith(code) && digits.length - code.length >= 7);
  if (countryCode && (original.startsWith('+') || countryCode === '52' || digits.length > 10)) {
    return { codigo: countryCode, numero: digits.slice(countryCode.length) };
  }
  return { codigo: '52', numero: digits };
}

export function formatPhoneForApi(countryCode: string, nationalNumber: string): string {
  return `+${countryCode}${(nationalNumber || '').replace(/\D/g, '')}`;
}

/** Máximo de dígitos nacionales permitido sin exceder E.164; México usa 10. */
export function maxNationalPhoneDigits(countryCode: string): number {
  return countryCode === '52' ? 10 : Math.max(7, 15 - (countryCode || '').length);
}
