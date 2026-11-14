export type MoveDirection = "up" | "down";

/**
 * Quoi : déplace un élément d'un cran dans une liste ordonnée d'identifiants.
 * Input : ids — identifiants dans l'ordre actuel ; id — celui à déplacer ; direction — « up » (vers le début) ou « down ».
 * Output : une nouvelle liste ; identique à l'ancienne si l'identifiant est inconnu ou déjà en bout de liste.
 * Effets de bord : aucun (fonction pure, la liste d'origine n'est pas modifiée).
 */
export function moveItem(ids: readonly string[], id: string, direction: MoveDirection): string[] {
  const reordered = [...ids];
  const index = reordered.indexOf(id);
  const neighbourIndex = direction === "up" ? index - 1 : index + 1;
  if (index === -1 || neighbourIndex < 0 || neighbourIndex >= reordered.length) return reordered;
  [reordered[index], reordered[neighbourIndex]] = [reordered[neighbourIndex]!, reordered[index]!];
  return reordered;
}
