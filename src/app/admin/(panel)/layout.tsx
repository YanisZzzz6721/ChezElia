import Link from "next/link";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/app/admin/_actions/auth";
import { requireAdmin } from "@/lib/admin/auth";

/** Cadre de l'admin : exige un administrateur connecté (en plus de proxy.ts), navigation et déconnexion. */
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="adm-header">
        <Link className="adm-brand" href="/admin/produits">Chez Elia · Admin</Link>
        <AdminNav />
        <form action={logoutAction}>
          <button className="adm-logout" type="submit">Se déconnecter</button>
        </form>
      </header>
      <main className="adm-main">{children}</main>
    </>
  );
}
