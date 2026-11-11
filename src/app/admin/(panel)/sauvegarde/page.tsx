import { RestoreForm } from "@/components/admin/RestoreForm";

export default function AdminBackupPage() {
  return (
    <>
      <h1 className="adm-h1">Sauvegarde</h1>
      <section className="adm-card adm-form">
        <h2 className="adm-h2">Télécharger une sauvegarde</h2>
        <p className="adm-hint">
          Le fichier contient les produits (corbeille comprise), les catégories, les textes et les horaires. Les photos restent
          dans le stockage : le fichier garde seulement leur emplacement. Faites une sauvegarde avant une grosse session de saisie.
        </p>
        <div className="adm-actions">
          <a className="b-btn b-btn--primary adm-btn" href="/admin/sauvegarde/export" download>
            <span className="b-btn__row">Télécharger la sauvegarde</span>
          </a>
        </div>
      </section>
      <RestoreForm />
    </>
  );
}
