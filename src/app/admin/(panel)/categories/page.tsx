import Link from "next/link";
import { deleteCategoryAction, moveCategoryAction } from "@/app/admin/_actions/categories";
import { CategorySeoIntroForm, CreateCategoryForm, RenameCategoryForm } from "@/components/admin/CategoryForms";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";
import { mapCategoryRow, CATEGORY_COLUMNS, type CategoryRow } from "@/lib/siteData";

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select(CATEGORY_COLUMNS).order("position").returns<CategoryRow[]>();
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  const categories = (data ?? []).map(mapCategoryRow);

  return (
    <div className="adm-narrow">
      <h1 className="adm-h1">Catégories</h1>
      <p className="adm-hint">L&rsquo;ordre ci-dessous est celui des onglets du catalogue. Supprimer une catégorie ne supprime pas ses produits : ils restent visibles dans « Tout ».</p>
      <p className="adm-hint">Chaque catégorie a sa propre page sur le site (« Adresse de la page »). Cette adresse est fixée à la création et ne change pas quand vous renommez la catégorie : les liens déjà partagés continuent de fonctionner.</p>
      <CreateCategoryForm />
      {categories.length === 0 ? (
        <p className="adm-empty">Aucune catégorie pour l&rsquo;instant.</p>
      ) : (
        <ul className="adm-list">
          {categories.map((category, index) => (
            <li key={category.id} className="adm-row adm-row--category">
              <div className="adm-row__main">
                <div style={{ flex: "1 1 100%", minWidth: 0 }}><RenameCategoryForm id={category.id} name={category.label} /></div>
                <p className="adm-hint" style={{ flex: "1 1 100%" }}>
                  Adresse de la page : <Link className="adm-link" href={`/rayons/${category.slug}`}>/rayons/{category.slug}</Link>
                  {category.seoIntro === null ? <span className="adm-badge adm-badge--tbd">Texte à rédiger</span> : <span className="adm-badge adm-badge--on">Texte rédigé</span>}
                </p>
                <div style={{ flex: "1 1 100%", minWidth: 0 }}><CategorySeoIntroForm id={category.id} seoIntro={category.seoIntro} /></div>
              </div>
              <div className="adm-row__actions">
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton variant="ghost" pendingLabel="…">↑ Monter</SubmitButton>
                </form>
                <form action={moveCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton variant="ghost" pendingLabel="…">↓ Descendre</SubmitButton>
                </form>
                <form action={deleteCategoryAction}>
                  <input type="hidden" name="id" value={category.id} />
                  <ConfirmSubmitButton message={`Supprimer la catégorie « ${category.label} » ? Ses produits restent visibles dans « Tout ».`}>Supprimer</ConfirmSubmitButton>
                </form>
              </div>
              <span className="adm-sr">Position {index + 1} sur {categories.length}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
