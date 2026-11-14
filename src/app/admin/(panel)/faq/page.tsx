import { deleteFaqAction, moveFaqAction } from "@/app/admin/_actions/faq";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { CreateFaqForm, EditFaqForm } from "@/components/admin/FaqForms";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";

export default async function AdminFaqPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("faq_items").select("id, question, answer, position").order("position");
  if (error) throw new Error(`Lecture des questions impossible : ${error.message}`);
  const items = data ?? [];

  return (
    <div className="adm-narrow">
      <h1 className="adm-h1">Questions fréquentes</h1>
      <p className="adm-hint">
        Ces questions s&rsquo;affichent sur le site, dans l&rsquo;ordre ci-dessous, sous le catalogue. Tant qu&rsquo;il n&rsquo;y en a aucune, la section n&rsquo;apparaît pas.
        Ne mettez que des réponses exactes : horaires, produits, services réellement proposés.
      </p>
      <CreateFaqForm />
      {items.length === 0 ? (
        <p className="adm-empty">Aucune question pour l&rsquo;instant.</p>
      ) : (
        <ul className="adm-list">
          {items.map((item, index) => (
            <li key={item.id} className="adm-row adm-row--faq">
              <div className="adm-row__main"><EditFaqForm id={item.id} question={item.question} answer={item.answer} /></div>
              <div className="adm-row__actions">
                <form action={moveFaqAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="up" />
                  <SubmitButton variant="ghost" pendingLabel="…">↑ Monter</SubmitButton>
                </form>
                <form action={moveFaqAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="direction" value="down" />
                  <SubmitButton variant="ghost" pendingLabel="…">↓ Descendre</SubmitButton>
                </form>
                <form action={deleteFaqAction}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmitButton message={`Supprimer la question « ${item.question} » ?`}>Supprimer</ConfirmSubmitButton>
                </form>
              </div>
              <span className="adm-sr">Position {index + 1} sur {items.length}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
