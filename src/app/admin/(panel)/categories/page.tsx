import { deleteCategoryAction, moveCategoryAction } from "@/app/admin/_actions/categories";
import { CreateCategoryForm, RenameCategoryForm } from "@/components/admin/CategoryForms";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminCategoriesPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select("id, name, position").order("position");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  const categories = data ?? [];

  return (
    <div className="adm-narrow">
      <h1 className="adm-h1">Catégories</h1>
      <p className="adm-hint">L&rsquo;ordre ci-dessous est celui des onglets du catalogue. Supprimer une catégorie ne supprime pas ses produits : ils restent visibles dans « Tout ».</p>
      <CreateCategoryForm />
      {categories.length === 0 ? (
        <p className="adm-empty">Aucune catégorie pour l&rsquo;instant.</p>
      ) : (
        <ul className="adm-list">
          {categories.map((category, index) => (
            <li key={category.id} className="adm-row adm-row--category">
              <div className="adm-row__main"><RenameCategoryForm id={category.id} name={category.name} /></div>
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
                  <ConfirmSubmitButton message={`Supprimer la catégorie « ${category.name} » ? Ses produits restent visibles dans « Tout ».`}>Supprimer</ConfirmSubmitButton>
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
