"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS } from "@/content/products";
import { ALL_CATEGORIES_ID, filterProducts } from "@/lib/catalogue";
import { staggerStyle } from "@/lib/motion";
import { runWithViewTransition } from "@/lib/viewTransition";
import { NeonShape } from "./NeonShape";
import { ProductCard } from "./ProductCard";

/**
 * Quoi : onglets « Tout » + une catégorie par onglet.
 * Input : selectedId — onglet actif ; onSelect — appelé avec l'identifiant de l'onglet cliqué.
 * Output : le groupe de boutons.
 * Effets de bord : appelle onSelect au clic.
 */
function CategoryTabs({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const tabs = [{ id: ALL_CATEGORIES_ID, label: "Tout" }, ...CATEGORIES];
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

/**
 * Quoi : section catalogue (onglets par catégorie, grille 2 colonnes sur mobile, message si aucune fiche).
 * Input : aucun (lit PRODUCTS et CATEGORIES).
 * Output : la section catalogue.
 * Effets de bord : état local React de la catégorie sélectionnée.
 */
export function Catalogue() {
  const [selectedId, setSelectedId] = useState(ALL_CATEGORIES_ID);
  // Les fiches n'apparaissent « au scroll » qu'au premier affichage ; ensuite la transition de vue prend le relais.
  const [hasChangedCategory, setHasChangedCategory] = useState(false);
  const visibleProducts = filterProducts(PRODUCTS, selectedId);

  const selectCategory = (categoryId: string) => {
    if (categoryId === selectedId) return;
    runWithViewTransition(() => {
      setHasChangedCategory(true);
      setSelectedId(categoryId);
    });
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
        <CategoryTabs selectedId={selectedId} onSelect={selectCategory} />
        {visibleProducts.length === 0 ? (
          <p className="b-empty">Aucun produit dans cette catégorie pour l’instant.</p>
        ) : (
          <div className="b-grid">
            {visibleProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} reveal={!hasChangedCategory} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
