import { useStore } from '@/store/useStore';

export const LOW_STOCK_THRESHOLD = 3;

export default function StockLabel({ stock }: { stock: number }) {
  const loaded = useStore((state) => state.inventoryLoaded);
  if (!loaded) return null;
  if (stock <= 0) return <span className="stock-out">Sold out</span>;
  if (stock <= LOW_STOCK_THRESHOLD) return <span className="stock-low">Only {stock} left</span>;
  return <span className="stock-ok">In stock</span>;
}
