"use client";

import { useState } from "react";
import type { Category, Product } from "@/content/products";
import {
  ALL_CATEGORIES_ID,
  INITIAL_VISIBLE_COUNT,
  ALCOHOL_NOTICE,
  LOAD_MORE_STEP,
  isAlcoholCategorySelected,
  filterProducts,
  limitVisible,
  listCategoriesWithProducts,
  searchProducts,
} from "@/lib/catalogue";
import { staggerStyle } from "@/lib/motion";
import { runWithViewTransition } from "@/lib/viewTransition";
import { NeonShape } from "./NeonShape";
import { ProductCard } from "./ProductCard";

/**
 * Quoi : onglets « Tout » + une catégorie par onglet.
 * Input : categories — les catégories ; selectedId — onglet actif ; onSelect — appelé avec l'identifiant de l'onglet cliqué.
 * Output : le groupe de boutons.
 * Effets de bord : appelle onSelect au clic.
 */
function CategoryTabs({ categories, selectedId, onSelect }: { categories: readonly Category[]; selectedId: string; onSelect: (id: string) => void }) {
  const tabs = [{ id: ALL_CATEGORIES_ID, label: "Tout" }, ...categories];
  return (
    <div className="b-tabs" role="group" aria-label="Catégories" data-reveal style={staggerStyle(2)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className="b-tab"
          type="button"
          aria-pressed={tab.id === selectedId}
          onClick={() => onSelect(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const MAX_SEARCH_LENGTH = 60;

/**
 * Quoi : barre de recherche du catalogue, avec bouton pour l'effacer.
 * Input : value — texte saisi ; onChange — appelé à chaque modification.
 * Output : le champ de recherche (type « search », étiquette pour lecteurs d'écran).
 * Effets de bord : appelle onChange à la saisie, au clic sur « effacer » et à la touche Échap.
 */
function CatalogueSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="b-search" role="search" data-reveal style={staggerStyle(3)}>
      <label className="b-sr" htmlFor="catalogue-search">Rechercher un produit</label>
      <input
        id="catalogue-search"
        className="b-search__input"
        type="search"
        enterKeyHint="search"
        autoComplete="off"
        maxLength={MAX_SEARCH_LENGTH}
        placeholder="Rechercher un produit…"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onChange("");
        }}
      />
      {value !== "" ? (
        <button className="b-search__clear" type="button" aria-label="Effacer la recherche" onClick={() => onChange("")}>
          ×
        </button>
      ) : null}
    </div>
  );
}

/**
 * Quoi : section catalogue (recherche, onglets par catégorie, grille 2 colonnes sur mobile, « Voir plus »).
 * Input : categories — les catégories ; products — les produits visibles.
 * Output : la section catalogue.
 * Effets de bord : état local React (catégorie, recherche, nombre de fiches affichées).
 */
export function Catalogue({ categories, products }: { categories: readonly Category[]; products: readonly Product[] }) {
  const [selectedId, setSelectedId] = useState(ALL_CATEGORIES_ID);
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);
  // Les fiches n'apparaissent « au scroll » qu'au premier affichage ; ensuite les interactions prennent le relais.
  const [hasInteracted, setHasInteracted] = useState(false);
  const matchingProducts = searchProducts(filterProducts(products, selectedId), search);
  const shownProducts = limitVisible(matchingProducts, visibleCount);
  const remainingCount = matchingProducts.length - shownProducts.length;
  const hasProducts = products.length > 0;
  const isSearching = search.trim() !== "";
  const showAlcoholNotice = isAlcoholCategorySelected(categories, selectedId);

  const selectCategory = (categoryId: string) => {
    if (categoryId === selectedId) return;
    runWithViewTransition(() => {
      setHasInteracted(true);
      setSelectedId(categoryId);
      setVisibleCount(INITIAL_VISIBLE_COUNT);
    });
  };

  const changeSearch = (value: string) => {
    setHasInteracted(true);
    setSearch(value);
    setVisibleCount(INITIAL_VISIBLE_COUNT);
  };

  return (
    <section className="b-cat" id="catalogue">
      <div className="b-neon b-neon--cat" aria-hidden="true" data-reveal="neon">
        <NeonShape kind="bolt" color="y" className="bnc-bolt" />
        <NeonShape kind="moon" color="v" className="bnc-moon" />
        <NeonShape kind="spark" color="y" className="bnc-spark" />
        <NeonShape kind="spark" color="v" className="bnc-spark2" />
      </div>
      <div className="b-wrap">
        <h2 className="b-h2" data-reveal>Le <span>catalogue</span></h2>
        <p className="b-intro" data-reveal style={staggerStyle(1)}>Tous les produits du magasin, par catégorie.</p>
        {hasProducts ? (
          <>
            <CategoryTabs categories={listCategoriesWithProducts(categories, products)} selectedId={selectedId} onSelect={selectCategory} />
            <CatalogueSearch value={search} onChange={changeSearch} />
            <p className="b-count" aria-live="polite">
              {matchingProducts.length} produit{matchingProducts.length > 1 ? "s" : ""}
              {isSearching ? ` pour « ${search.trim()} »` : ""}
            </p>
            {showAlcoholNotice ? <p className="b-legal" role="note">{ALCOHOL_NOTICE}</p> : null}
          </>
        ) : null}
        {matchingProducts.length === 0 ? (
          <div className="b-empty">
            {!hasProducts ? (
              <p>Le catalogue en ligne arrive bientôt.</p>
            ) : isSearching ? (
              <>
                <p>Aucun produit ne correspond à « {search.trim()} ». Essayez un autre mot.</p>
                <button className="b-search__reset" type="button" onClick={() => changeSearch("")}>Effacer la recherche</button>
              </>
            ) : (
              <p>Aucun produit dans cette catégorie pour l’instant.</p>
            )}
          </div>
        ) : (
          <div className="b-grid">
            {shownProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} reveal={!hasInteracted} />
            ))}
          </div>
        )}
        {remainingCount > 0 ? (
          <div className="b-more">
            <button className="b-btn b-btn--primary b-more__btn" type="button" onClick={() => setVisibleCount((count) => count + LOAD_MORE_STEP)}>
              <span className="b-btn__row">Voir plus ({remainingCount} restants)</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
