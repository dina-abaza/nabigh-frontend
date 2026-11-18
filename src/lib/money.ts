export function piastresToEgp(piastres: number): string {
  return (piastres / 100).toFixed(2);
}

export function egpToPiastres(egp: string): number {
  return Math.round(parseFloat(egp) * 100);
}
