import Link from "next/link";
import { logoutAction } from "@/app/admin/_actions/auth";
import { requireAdmin } from "@/lib/admin/auth";

const NAV_ITEMS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/categories", label: "Catégories" },
  { href: "/admin/site", label: "Site" },
  { href: "/admin/sauvegarde", label: "Sauvegarde" },
] as const;

/** Cadre de l'admin : exige un administrateur connecté (en plus de proxy.ts), navigation et déconnexion. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="adm-header">
        <Link className="adm-brand" href="/admin/produits">Chez Elia · Admin</Link>
        <nav className="adm-nav" aria-label="Administration">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href}>{item.label}</Link>
          ))}
          <Link href="/" target="_blank" rel="noopener">Voir le site ↗</Link>
        </nav>
        <form action={logoutAction}>
          <button className="adm-logout" type="submit">Se déconnecter</button>
        </form>
      </header>
      <main className="adm-main">{children}</main>
    </>
  );
}
