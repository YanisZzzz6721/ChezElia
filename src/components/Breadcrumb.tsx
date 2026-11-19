import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/shelfSeo";

/**
 * Quoi : fil d'Ariane visible (« Accueil › Rayons › Confiserie »).
 * Input : items — les étapes, de l'accueil à la page courante (la dernière n'est pas un lien).
 * Output : la navigation. Les noms sont échappés par React.
 * Effets de bord : aucun (composant pur).
 */
export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  const lastIndex = items.length - 1;
  return (
    <nav className="r-crumbs" aria-label="Fil d'Ariane">
      <ol>
        {items.map((item, index) => (
          <li key={item.path}>
            {index === lastIndex ? <span aria-current="page">{item.label}</span> : <Link href={item.path}>{item.label}</Link>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
