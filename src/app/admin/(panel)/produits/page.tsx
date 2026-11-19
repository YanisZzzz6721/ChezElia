import Link from "next/link";
import {
  deleteProductForeverAction,
  restoreProductAction,
  setProductVisibilityAction,
  trashProductAction,
} from "@/app/admin/_actions/products";
import { ConfirmSubmitButton } from "@/components/admin/ConfirmSubmitButton";
import { QuickEditForm } from "@/components/admin/QuickEditForm";
import { SubmitButton } from "@/components/admin/SubmitButton";
import { requireAdmin } from "@/lib/admin/auth";
import { FLASH_MESSAGES, type FlashKey } from "@/lib/admin/result";
import { PAGE_SIZE, buildPageRange, parseListQuery, type ProductListQuery, type StateFilter } from "@/lib/adminList";
import { centsToPriceInput } from "@/lib/priceInput";

interface ProductListRow {
  id: string;
  title: string;
  price_cents: number | null;
  photo_path: string | null;
  visible: boolean;
  deleted_at: string | null;
  is_us_import: boolean;
  categories: { name: string } | null;
}

type SearchParams = Record<string, string | undefined>;
const STATE_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "sans-prix", label: "Sans prix" },
  { value: "masques", label: "Masqués" },
  { value: "visibles", label: "Visibles" },
  { value: "import-usa", label: "Import USA" },
] as const;

/** Valeur du paramètre d'adresse « etat » pour chaque filtre d'état. */
const STATE_PARAM: Record<StateFilter, string> = { all: "", "no-price": "sans-prix", hidden: "masques", visible: "visibles", "us-import": "import-usa" };

/** Adresse de la liste avec les filtres donnés (les valeurs vides sont omises). */
function buildListHref(query: ProductListQuery, overrides: Partial<Record<"q" | "cat" | "etat" | "page" | "vue", string>>): string {
  const stateParam = STATE_PARAM[query.state];
  const params = new URLSearchParams();
  const merged = { q: query.search, cat: query.categoryId ?? "", etat: stateParam, page: String(query.page), vue: query.view === "trash" ? "corbeille" : "", ...overrides };
  for (const [key, value] of Object.entries(merged)) if (value && !(key === "page" && value === "1")) params.set(key, value);
  const text = params.toString();
  return text ? `/admin/produits?${text}` : "/admin/produits";
}

/** Compte les produits actifs ou en corbeille, avec un filtre facultatif. */
async function countProducts(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"], inTrash: boolean, onlyWithoutPrice: boolean): Promise<number> {
  let query = supabase.from("products").select("id", { count: "exact", head: true });
  query = inTrash ? query.not("deleted_at", "is", null) : query.is("deleted_at", null);
  if (onlyWithoutPrice) query = query.is("price_cents", null);
  const { count, error } = await query;
  if (error) throw new Error(`Comptage des produits impossible : ${error.message}`);
  return count ?? 0;
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const query = parseListQuery(params);
  const { supabase } = await requireAdmin();
  const inTrash = query.view === "trash";
  const flashMessage = params.flash && params.flash in FLASH_MESSAGES ? FLASH_MESSAGES[params.flash as FlashKey] : null;

  /** Applique à une requête de lecture la vue (actifs / corbeille) et les filtres demandés. */
  const withFilters = <Builder extends { not: Function; is: Function; ilike: Function; eq: Function }>(builder: Builder): Builder => {
    let filtered = inTrash ? builder.not("deleted_at", "is", null) : builder.is("deleted_at", null);
    if (query.search) filtered = filtered.ilike("title", `%${query.search}%`);
    if (query.categoryId) filtered = filtered.eq("category_id", query.categoryId);
    if (query.state === "no-price") filtered = filtered.is("price_cents", null);
    if (query.state === "hidden") filtered = filtered.eq("visible", false);
    if (query.state === "visible") filtered = filtered.eq("visible", true);
    if (query.state === "us-import") filtered = filtered.eq("is_us_import", true);
    return filtered;
  };

  // Le total est connu d'abord : une page hors limites est ramenée à la dernière page (sinon la base répond « range not satisfiable »).
  const [matchingResult, categoriesResult, activeCount, trashCount, withoutPriceCount] = await Promise.all([
    withFilters(supabase.from("products").select("id", { count: "exact", head: true })),
    supabase.from("categories").select("id, name").order("position"),
    countProducts(supabase, false, false),
    countProducts(supabase, true, false),
    countProducts(supabase, false, true),
  ]);
  if (matchingResult.error) throw new Error(`Comptage des produits impossible : ${matchingResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Lecture des catégories impossible : ${categoriesResult.error.message}`);
  const matchingCount = matchingResult.count ?? 0;
  const pageCount = Math.max(1, Math.ceil(matchingCount / PAGE_SIZE));
  const currentPage = Math.min(query.page, pageCount);
  const { from, to } = buildPageRange(currentPage);
  const listResult = await withFilters(
    supabase.from("products").select("id, title, price_cents, photo_path, visible, deleted_at, is_us_import, categories(name)").order("title", { ascending: true }),
  ).range(from, to).returns<ProductListRow[]>();
  if (listResult.error) throw new Error(`Lecture des produits impossible : ${listResult.error.message}`);
  const products = listResult.data ?? [];
  const photoUrl = (path: string) => supabase.storage.from("photos").getPublicUrl(path).data.publicUrl;
  const hasFilters = query.search !== "" || query.categoryId !== null || query.state !== "all";

  return (
    <>
      <div className="adm-titlebar">
        <h1 className="adm-h1">{inTrash ? "Corbeille" : "Produits"}</h1>
        {!inTrash ? <Link className="b-btn b-btn--primary adm-btn" href="/admin/produits/nouveau"><span className="b-btn__row">+ Nouveau produit</span></Link> : null}
      </div>
      <div className="adm-tabs" role="group" aria-label="Affichage">
        <Link href="/admin/produits" aria-current={!inTrash && query.state !== "no-price" ? "page" : undefined}>Actifs ({activeCount})</Link>
        <Link href="/admin/produits?vue=corbeille" aria-current={inTrash ? "page" : undefined}>Corbeille ({trashCount})</Link>
        {!inTrash ? <Link href="/admin/produits?etat=sans-prix" aria-current={query.state === "no-price" ? "page" : undefined}>Sans prix ({withoutPriceCount})</Link> : null}
      </div>
      {flashMessage ? <p className="adm-msg adm-msg--ok" role="status">{flashMessage}</p> : null}

      <form className="adm-filters" method="get" action="/admin/produits">
        {inTrash ? <input type="hidden" name="vue" value="corbeille" /> : null}
        <label className="adm-sr" htmlFor="filter-q">Rechercher un produit</label>
        <input className="adm-input" id="filter-q" name="q" type="search" defaultValue={query.search} placeholder="Rechercher un produit…" maxLength={60} />
        <label className="adm-sr" htmlFor="filter-cat">Catégorie</label>
        <select className="adm-input" id="filter-cat" name="cat" defaultValue={query.categoryId ?? ""}>
          <option value="">Toutes les catégories</option>
          {(categoriesResult.data ?? []).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        {!inTrash ? (
          <>
            <label className="adm-sr" htmlFor="filter-etat">État</label>
            <select className="adm-input" id="filter-etat" name="etat" defaultValue={STATE_PARAM[query.state]}>
              {STATE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </>
        ) : null}
        <SubmitButton variant="ghost" pendingLabel="…">Filtrer</SubmitButton>
        {hasFilters ? <Link className="adm-link" href={inTrash ? "/admin/produits?vue=corbeille" : "/admin/produits"}>Effacer les filtres</Link> : null}
      </form>
      <p className="adm-count" aria-live="polite">{matchingCount} produit{matchingCount > 1 ? "s" : ""}{hasFilters ? " correspondent aux filtres" : ""} · page {currentPage} sur {pageCount}</p>

      {products.length === 0 ? (
        <p className="adm-empty">{inTrash ? "La corbeille est vide." : hasFilters ? "Aucun produit ne correspond à ces filtres." : "Aucun produit pour l'instant. Ajoutez le premier avec « + Nouveau produit »."}</p>
      ) : (
        <ul className="adm-list">
          {products.map((product) => (
            <li key={product.id} className="adm-row adm-row--quick">
              <div className="adm-row__pic">
                {product.photo_path ? <img src={photoUrl(product.photo_path)} alt="" loading="lazy" /> : <span>Pas de photo</span>}
              </div>
              <div className="adm-row__main adm-row__main--stack">
                {inTrash ? <b className="adm-row__title">{product.title}</b> : <QuickEditForm id={product.id} title={product.title} price={centsToPriceInput(product.price_cents)} />}
                <span className="adm-row__meta">{product.categories?.name ?? "Sans catégorie"}</span>
                {product.price_cents === null ? <span className="adm-badge adm-badge--tbd">Prix à confirmer</span> : null}
                {product.is_us_import ? <span className="adm-badge">Import USA</span> : null}
                {!inTrash ? <span className={product.visible ? "adm-badge adm-badge--on" : "adm-badge adm-badge--off"}>{product.visible ? "Visible" : "Masqué"}</span> : null}
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
                      <SubmitButton variant={product.visible ? "ghost" : "primary"}>{product.visible ? "Masquer" : "Afficher"}</SubmitButton>
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

      {pageCount > 1 ? (
        <nav className="adm-pager" aria-label="Pages">
          {currentPage > 1 ? <Link className="adm-link" href={buildListHref(query, { page: String(currentPage - 1) })}>← Précédente</Link> : <span />}
          <span>Page {currentPage} / {pageCount}</span>
          {currentPage < pageCount ? <Link className="adm-link" href={buildListHref(query, { page: String(currentPage + 1) })}>Suivante →</Link> : <span />}
        </nav>
      ) : null}
    </>
  );
}
