import type { CatalogProductSummary } from "@src/features/catalog/services/types";
import ProductCard from "./ProductCard";

type ProductsCategoryProps = {
  subcategoryName: string;
  products: CatalogProductSummary[];
  gridClassName: string;
  onAddProduct: (product: CatalogProductSummary) => void;
  onSelectProduct: (product: CatalogProductSummary, trigger: HTMLButtonElement) => void;
};

const ProductsCategory = ({
  subcategoryName,
  products,
  gridClassName,
  onAddProduct,
  onSelectProduct,
}: ProductsCategoryProps) => (
  <div className="space-y-4">
    <h2 className="text-lg font-semibold text-slate-900">{subcategoryName}</h2>
    <div className={`grid gap-4 ${gridClassName}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAdd={() => onAddProduct(product)}
          onSelect={(trigger) => onSelectProduct(product, trigger)}
        />
      ))}
    </div>
  </div>
);

export default ProductsCategory;
