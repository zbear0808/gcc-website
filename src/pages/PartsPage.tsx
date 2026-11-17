import { Link, useSearchParams } from 'react-router-dom';
import { useStore, useCartCount, useCartTotal } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { formatPrice } from '@shared/pricing';
import type { CatalogCategory } from '@shared/types';
import ProductImage from '@/components/ProductImage';
import StockLabel from '@/components/StockLabel';

const groups = [
  { id: 'cosmetic', label: 'Cosmetic', ids: ['shells', 'buttons', 'wii-caps', 'membranes', 'stick-caps'] },
  { id: 'stickbox', label: 'Stickbox', ids: ['stickbox', 'stickbox-t1-t2', 'magnet-mount', 'dh1212-magnet', 'stickbox-pot'] },
  {
    id: 'electronics',
    label: 'Electronics',
    ids: ['board-only', 'board-oem', 'cables', 'rumble-motors', 'slider-pots', '6-pin-ribbon-cable', 'trigger-paddle-pcbs', 'z-buttons'],
  },
  { id: 'triggers', label: 'Mechanical triggers', ids: ['switch-kailh-choco', 'jst-pigtail-header', 'switch-mount-3d'] },
];

const groupedIds = new Set(groups.flatMap((g) => g.ids));
const allGroups = [
  ...groups.map((g) => ({ ...g, items: fullCatalog.filter((c) => g.ids.includes(c.id)) })),
  { id: 'other', label: 'Tools & other', ids: [], items: fullCatalog.filter((c) => !groupedIds.has(c.id)) },
].filter((g) => g.items.length > 0);

function priceLabel(category: CatalogCategory) {
  const prices = category.subtypes.map((i) => i.individualPrice ?? i.price ?? 0).filter((p) => p > 0);
  if (prices.length === 0) return 'Not sold separately';
  const min = Math.min(...prices);
  return min === Math.max(...prices) ? `$${formatPrice(min)}` : `From $${formatPrice(min)}`;
}

function PartCard({ category }: { category: CatalogCategory }) {
  const inventory = useStore((state) => state.inventory);
  const totalStock = category.subtypes.reduce((sum, item) => sum + (inventory[item.id] || 0), 0);
  const options = category.subtypes.length;

  return (
    <Link to={`/product/${category.id}`} className="catalog-card">
      <div className="catalog-image">
        <ProductImage src={category.image} alt={category.label} />
      </div>
      <div className="catalog-info">
        <h3>{category.label}</h3>
        {options > 1 && <span className="catalog-options">{options} options</span>}
        <div className="catalog-info-bottom">
          <span className="catalog-price">{priceLabel(category)}</span>
          <StockLabel stock={totalStock} />
        </div>
      </div>
    </Link>
  );
}

export default function PartsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = searchParams.get('cat') ?? 'all';
  const cartCount = useCartCount();
  const cartTotal = useCartTotal();

  const visible = active === 'all' ? allGroups : allGroups.filter((g) => g.id === active);

  const setFilter = (id: string) => {
    if (id === 'all') setSearchParams({}, { replace: true });
    else setSearchParams({ cat: id }, { replace: true });
  };

  return (
    <div className="page parts-page">
      <h1 className="page-title">Parts</h1>
      <p className="page-intro">
        The same parts I use in my builds, sold on their own for repairs and DIY projects. OEM parts are salvaged from
        used controllers, so check each listing for condition.
      </p>

      <div className="filter-chips" role="toolbar" aria-label="Filter parts">
        {[{ id: 'all', label: 'All' }, ...allGroups].map((g) => (
          <button
            key={g.id}
            className={`chip ${active === g.id ? 'active' : ''}`}
            aria-pressed={active === g.id}
            onClick={() => setFilter(g.id)}
          >
            {g.label}
          </button>
        ))}
      </div>

      {visible.map((group) => (
        <section key={group.id} className="parts-group">
          <h2 className="parts-group-title">{group.label}</h2>
          <div className="catalog-grid">
            {group.items.map((category) => (
              <PartCard key={category.id} category={category} />
            ))}
          </div>
        </section>
      ))}

      {cartCount > 0 && (
        <div className="cart-summary">
          <span>
            {cartCount} {cartCount === 1 ? 'item' : 'items'} · <strong>${formatPrice(cartTotal)}</strong>
          </span>
          <Link to="/cart" className="btn btn-go">
            View cart
          </Link>
        </div>
      )}
    </div>
  );
}
