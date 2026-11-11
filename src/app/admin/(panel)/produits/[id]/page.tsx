import { notFound } from "next/navigation";
import { z } from "zod";
import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";
import { centsToPriceInput } from "@/lib/priceInput";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) notFound();

  const { supabase } = await requireAdmin();
  const [productResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("id, title, category_id, description, price_cents, photo_path, visible, deleted_at").eq("id", id).maybeSingle(),
    supabase.from("categories").select("id, name").order("position"),
  ]);
  if (productResult.error) throw new Error(`Lecture du produit impossible : ${productResult.error.message}`);
  if (categoriesResult.error) throw new Error(`Lecture des catégories impossible : ${categoriesResult.error.message}`);
  const product = productResult.data;
  if (!product) notFound();

  const photoUrl = product.photo_path ? supabase.storage.from("photos").getPublicUrl(product.photo_path).data.publicUrl : null;
  return (
    <>
      <h1 className="adm-h1">Modifier le produit</h1>
      {product.deleted_at ? <p className="adm-msg adm-msg--err">Ce produit est à la corbeille : il n&rsquo;apparaît pas sur le site.</p> : null}
      <ProductForm
        categories={categoriesResult.data ?? []}
        values={{
          id: product.id,
          title: product.title,
          categoryId: product.category_id,
          description: product.description ?? "",
          price: centsToPriceInput(product.price_cents),
          visible: product.visible,
          photoUrl,
        }}
      />
    </>
  );
}
