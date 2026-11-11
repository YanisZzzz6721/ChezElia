"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV_ITEMS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/sauvegarde", label: "Sauvegarde" },
] as const;

/**
 * Quoi : menu principal de l'admin. Barre horizontale sur grand écran ; sur téléphone et petite tablette,
 *   un bouton « Menu » ouvre un panneau qui liste toutes les sections. La section en cours est repérée (aria-current).
 * Input : children — éléments placés en fin de menu (le bouton de déconnexion).
 * Output : le bouton, le panneau de navigation et un fond cliquable pour le refermer.
 * Effets de bord : état local ouvert/fermé ; se referme au changement de page, à la touche Échap et au clic à l'extérieur.
 */
export function AdminNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isOpen]);

  return (
    <div className="adm-navwrap">
      <button
        className="adm-burger"
        type="button"
        aria-expanded={isOpen}
        aria-controls="adm-menu"
        onClick={() => setIsOpen((current) => !current)}
      >
        <span className="adm-burger__bars" aria-hidden="true" />
        <span>Menu</span>
      </button>
      {isOpen ? <div className="adm-backdrop" onClick={() => setIsOpen(false)} aria-hidden="true" /> : null}
      <nav id="adm-menu" className="adm-nav" data-open={isOpen} aria-label="Administration">
        {NAV_ITEMS.map((item) => {
          const isCurrent = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href} aria-current={isCurrent ? "page" : undefined} onClick={() => setIsOpen(false)}>
              {item.label}
            </Link>
          );
        })}
        <Link href="/" target="_blank" rel="noopener">Voir le site ↗</Link>
        <div className="adm-nav__end">{children}</div>
      </nav>
    </div>
  );
}
