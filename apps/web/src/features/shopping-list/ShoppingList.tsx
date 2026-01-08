import { useEffect, useMemo, useState } from "react";
import ItemList from "./components/ItemList";
import ListModal from "./components/ListModal";
import Total from "./components/Total";
import type { ShoppingListItem } from "./types";

const INITIAL_ITEMS: ShoppingListItem[] = [
  {
    id: "item-1",
    name: "Manzanas Fuji",
    category: "Frutas",
    thumbnail:
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=120&q=80",
    price: 1.2,
    quantity: 1,
  },
  {
    id: "item-2",
    name: "Leche entera",
    category: "Bebidas",
    thumbnail: null,
    price: 0.95,
    quantity: 2,
  },
  {
    id: "item-3",
    name: "Pan integral multicereal extra largo",
    category: "Panadería",
    thumbnail:
      "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=120&q=80",
    price: 1.5,
    quantity: 1,
  },
];

type ShoppingListProps = {
  isOpen: boolean;
  onClose: () => void;
  onLinesCountChange?: (count: number) => void;
};

const ShoppingList = ({
  isOpen,
  onClose,
  onLinesCountChange,
}: ShoppingListProps) => {
  const [items, setItems] = useState<ShoppingListItem[]>(INITIAL_ITEMS);

  const linesCount = items.length;
  const sortedItems = useMemo(
    () =>
      [...items].sort((left, right) => {
        const categoryComparison = left.category.localeCompare(right.category);

        if (categoryComparison !== 0) {
          return categoryComparison;
        }

        return left.name.localeCompare(right.name);
      }),
    [items]
  );
  const total = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      ),
    [items]
  );

  useEffect(() => {
    onLinesCountChange?.(linesCount);
  }, [linesCount, onLinesCountChange]);

  const handleIncrement = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  const handleDecrement = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity - 1) }
          : item
      )
    );
  };

  const handleRemove = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id));
  };

  const handleSaveList = () => {
    window.prompt("¿Cómo quieres llamar a esta lista?");
  };

  return (
    <ListModal isOpen={isOpen} onClose={onClose} title="Tu lista">
      <div className="space-y-6">
        <ItemList
          items={sortedItems}
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onRemove={handleRemove}
        />
        <Total total={total} onAddMore={onClose} onSave={handleSaveList} />
      </div>
    </ListModal>
  );
};

export default ShoppingList;
