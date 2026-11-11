"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/sauvegarde", label: "Sauvegarde" },
] as const;

/**
 * Quoi : menu principal de l'admin ; met en évidence la section en cours (aria-current).
 * Input : aucun (lit l'adresse courante).
 * Output : la barre de navigation (défile horizontalement si l'écran est trop étroit).
 * Effets de bord : aucun (composant d'affichage).
 */
export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="adm-nav" aria-label="Administration">
      {NAV_ITEMS.map((item) => {
        const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined}>
            {item.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" rel="noopener">Voir le site ↗</Link>
    </nav>
  );
}
