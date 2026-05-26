export function formatCurrency(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';

  const padded = digits.padStart(3, '0');
  const reais = padded.slice(0, -2).replace(/^0+/, '') || '0';
  const cents = padded.slice(-2);
  const formatted = reais.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  return formatted + ',' + cents;
}

export function parseCurrency(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

export function centsFromReais(value: number): string {
  return Math.round(value * 100).toString();
}

export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 11) {
    return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  }
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}
