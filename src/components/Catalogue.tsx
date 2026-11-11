"use client";

import { useState } from "react";
import { CATEGORIES, PRODUCTS } from "@/content/products";
import { ALL_CATEGORIES_ID, filterProducts } from "@/lib/catalogue";
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
    <div className="b-tabs" role="group" aria-label="Catégories">
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
  const visibleProducts = filterProducts(PRODUCTS, selectedId);

  return (
    <section className="b-cat" id="catalogue">
      <div className="b-neon b-neon--cat" aria-hidden="true">
        <NeonShape kind="bolt" color="y" className="bnc-bolt" />
        <NeonShape kind="moon" color="v" className="bnc-moon" />
        <NeonShape kind="spark" color="y" className="bnc-spark" />
        <NeonShape kind="spark" color="v" className="bnc-spark2" />
      </div>
      <div className="b-wrap">
        <h2 className="b-h2">Le <span>catalogue</span></h2>
        <p className="b-intro">Tous les produits du magasin, par catégorie.</p>
        <CategoryTabs selectedId={selectedId} onSelect={setSelectedId} />
        {visibleProducts.length === 0 ? (
          <p className="b-empty">Aucun produit dans cette catégorie pour l’instant.</p>
        ) : (
          <div className="b-grid">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
