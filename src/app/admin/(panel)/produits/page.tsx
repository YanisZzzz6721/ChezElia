import Link from "next/link";
import {
  deleteProductForeverAction,
  restoreProductAction,
  setProductVisibilityAction,
  trashProductAction,
} from "@/app/admin/_actions/products";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";
import { FLASH_MESSAGES, type FlashKey } from "@/lib/admin/result";
import { formatPrice } from "@/lib/price";

interface ProductListRow {
  id: string;
  title: string;
  price_cents: number | null;
  photo_path: string | null;
  visible: boolean;
  deleted_at: string | null;
  categories: { name: string } | null;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ vue?: string; flash?: string }> }) {
  const { vue, flash } = await searchParams;
  const { supabase } = await requireAdmin();
  const inTrash = vue === "corbeille";
  const flashMessage = flash && flash in FLASH_MESSAGES ? FLASH_MESSAGES[flash as FlashKey] : null;

  const { data, error } = await supabase
    .from("products")
    .select("id, title, price_cents, photo_path, visible, deleted_at, categories(name)")
    .order("created_at", { ascending: false })
    .returns<ProductListRow[]>();
  if (error) throw new Error(`Lecture des produits impossible : ${error.message}`);
  const all = data ?? [];
  const products = all.filter((product) => (product.deleted_at !== null) === inTrash);
  const trashCount = all.filter((product) => product.deleted_at !== null).length;
  const photoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;

  return (
    <>
      <div className="adm-titlebar">
        <h1 className="adm-h1">{inTrash ? "Corbeille" : "Produits"}</h1>
        {!inTrash ? <Link className="b-btn b-btn--primary adm-btn" href="/admin/produits/nouveau"><span className="b-btn__row">+ Nouveau produit</span></Link> : null}
      </div>
      <div className="adm-tabs" role="group" aria-label="Affichage">
        <Link href="/admin/produits" aria-current={!inTrash ? "page" : undefined}>Actifs ({all.length - trashCount})</Link>
        <Link href="/admin/produits?vue=corbeille" aria-current={inTrash ? "page" : undefined}>Corbeille ({trashCount})</Link>
      </div>
      {flashMessage ? <p className="adm-msg adm-msg--ok" role="status">{flashMessage}</p> : null}

      {products.length === 0 ? (
        <p className="adm-empty">{inTrash ? "La corbeille est vide." : "Aucun produit pour l'instant. Ajoutez le premier avec « + Nouveau produit »."}</p>
      ) : (
        <ul className="adm-list">
          {products.map((product) => (
            <li key={product.id} className="adm-row">
              <div className="adm-row__pic">
                {product.photo_path ? <img src={photoUrl(product.photo_path)} alt="" /> : <span>Pas de photo</span>}
              </div>
              <div className="adm-row__main">
                <b className="adm-row__title">{product.title}</b>
                <span className="adm-row__meta">{product.categories?.name ?? "Sans catégorie"}</span>
                <span className={product.price_cents === null ? "adm-badge adm-badge--tbd" : "adm-badge"}>{formatPrice(product.price_cents)}</span>
                {!inTrash && !product.visible ? <span className="adm-badge adm-badge--off">Masqué</span> : null}
              </div>
              <div className="adm-row__actions">
                {inTrash ? (
                  <>
                    <form action={restoreProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <SubmitButton variant="ghost">Restaurer</SubmitButton>
                    </form>
                    <form action={deleteProductForeverAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmitButton message={`Supprimer définitivement « ${product.title} » ? Cette action est irréversible.`}>Supprimer</ConfirmSubmitButton>
                    </form>
                  </>
                ) : (
                  <>
                    <Link className="b-btn b-btn--ghost adm-btn" href={`/admin/produits/${product.id}`}><span className="b-btn__row">Modifier</span></Link>
                    <form action={setProductVisibilityAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <input type="hidden" name="visible" value={String(!product.visible)} />
                      <SubmitButton variant="ghost">{product.visible ? "Masquer" : "Afficher"}</SubmitButton>
                    </form>
                    <form action={trashProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <ConfirmSubmitButton message={`Mettre « ${product.title} » à la corbeille ? Vous pourrez le restaurer.`}>Corbeille</ConfirmSubmitButton>
                    </form>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
