/**
 * Matériaux exempts du RRR : consommés en totalité quel que soit le taux
 * (Énergie Avalonienne, runes, âmes, reliques, sceaux, artefacts)
 */
export function isRRRExempt(materialId: string): boolean {
  const id = materialId.toUpperCase();
  return (
    id.includes("TOKEN_AVALON") ||
    id.includes("ESSENCE_AVALON") ||
    id.includes("RUNE") ||
    id.includes("SOUL") ||
    id.includes("RELIC") ||
    id.includes("SHARD_AVALON") ||
    id.includes("ARTEFACT") ||
    id.includes("ARTIFACT")
  );
}

/**
 * Calcule la quantité effective d'un matériau après RRR (arrondie au supérieur).
 * Si le matériau est exempt du RRR, retourne la quantité brute.
 */
export function computeRRRQuantity(
  materialId: string,
  rawQuantity: number,
  rrrRate: number // 0 à 1 (ex: 0.18 pour 18%)
): number {
  if (isRRRExempt(materialId)) return rawQuantity;
  return Math.ceil(rawQuantity * (1 - rrrRate));
}
