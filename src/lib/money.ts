export function piastresToEgp(piastres: number): string {
  return (piastres / 100).toFixed(2);
}

export function egpToPiastres(egp: string): number {
  return Math.round(parseFloat(egp) * 100);
}

export function usdCentsToUsd(cents: number): string {
  return (cents / 100).toFixed(2);
}

export function usdToUsdCents(usd: string): number {
  return Math.round(parseFloat(usd) * 100);
}
