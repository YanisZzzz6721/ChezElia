import { ProductForm } from "@/components/admin/ProductForm";
import { requireAdmin } from "@/lib/admin/auth";

export default async function NewProductPage() {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("categories").select("id, name").order("position");
  if (error) throw new Error(`Lecture des catégories impossible : ${error.message}`);
  return (
    <>
      <h1 className="adm-h1">Nouveau produit</h1>
      <ProductForm categories={data ?? []} values={{ title: "", categoryId: null, description: "", price: "", visible: true, photoUrl: null }} />
    </>
  );
}
