import { useState, useEffect, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import { formatPrice } from '@shared/pricing';
import type { ShellOption, ButtonOption, StickCapOption } from '@shared/types';
import VariantSelector from '@/components/VariantSelector';
import ConfigSection from '@/components/ConfigSection';
import ProductImage from '@/components/ProductImage';
import StockLabel from '@/components/StockLabel';
import { shellFacets, buttonFacets, stickCapFacets } from '@shared/facets';
import NotFoundPage from './NotFoundPage';

const BUILD_OPTION_CATEGORIES = new Set([
  'shells', 'buttons', 'stick-caps', 'membranes', 'cables', 'rumble-motors', 'slider-pots', 'z-buttons',
]);

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const inventory = useStore((state) => state.inventory);
  const inventoryLoaded = useStore((state) => state.inventoryLoaded);
  const cart = useStore((state) => state.cart);
  const updateCartQuantity = useStore((state) => state.updateCartQuantity);

  const category = fullCatalog.find((c) => c.id === id);
  const preselectedId = searchParams.get('selected');
  const initialItem =
    category?.subtypes.find((i) => i.id === preselectedId)?.id || category?.subtypes[0]?.id || '';

  const [selectedItem, setSelectedItem] = useState(initialItem);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const item = category?.subtypes.find((i) => i.id === selectedItem) || category?.subtypes[0];

  const galleryImages = useMemo(() => {
    if (!category) return [];
    const images = new Set<string>();
    if (category.image) images.add(category.image);
    category.subtypes.forEach((sub) => sub.image && images.add(sub.image));
    return Array.from(images);
  }, [category]);

  const [activeImage, setActiveImage] = useState<string | undefined>(item?.image ?? category?.image);

  useEffect(() => {
    setSelectedItem(initialItem);
  }, [initialItem]);

  useEffect(() => {
    setQuantityToAdd(1);
    setJustAdded(false);
    setActiveImage(item?.image ?? category?.image);
  }, [item, category]);

  if (!category || !item) return <NotFoundPage />;

  const stock = inventory[item.id] || 0;
  const inCart = cart[item.id] || 0;
  const available = Math.max(0, stock - inCart);
  const price = item.individualPrice ?? item.price ?? 0;
  const showItemDescription = item.description && item.description !== category.description;

  const handleAddToCart = () => {
    if (available >= quantityToAdd) {
      updateCartQuantity(item.id, quantityToAdd);
      setQuantityToAdd(1);
      setJustAdded(true);
    }
  };

  const selectorProps = {
    title: 'Options',
    value: selectedItem,
    onChange: setSelectedItem,
    basePrice: price,
    priceKey: 'individualPrice' as const,
  };

  return (
    <div className="page product-page">
      <title>{`Zu Builds | ${category.label}`}</title>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/parts">Parts</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{category.label}</span>
      </nav>

      <div className="product-details">
        <div className="product-gallery">
          <div className="main-image-container">
            <ProductImage src={activeImage} alt={item.label} eager />
          </div>
          {galleryImages.length > 1 && (
            <div className="thumbnail-row">
              {galleryImages.map((img) => (
                <button
                  key={img}
                  className={`thumbnail-btn ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                  aria-label="Show this photo"
                  aria-pressed={activeImage === img}
                >
                  <ProductImage src={img} alt="" className="thumb" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="product-info">
          <h1 className="product-title">{category.label}</h1>
          <p className="product-description">{category.description}</p>

          {category.subtypes.length > 1 &&
            (category.id === 'shells' ? (
              <VariantSelector {...selectorProps} items={category.subtypes as ShellOption[]} facets={shellFacets} />
            ) : category.id === 'buttons' ? (
              <VariantSelector {...selectorProps} items={category.subtypes as ButtonOption[]} facets={buttonFacets} />
            ) : category.id === 'stick-caps' ? (
              <VariantSelector {...selectorProps} items={category.subtypes as StickCapOption[]} facets={stickCapFacets} />
            ) : (
              <ConfigSection
                title="Options"
                items={category.subtypes}
                selectedId={selectedItem}
                onSelect={setSelectedItem}
                basePrice={price}
                priceKey="individualPrice"
                descriptionPosition="none"
                buttonSize="small"
              />
            ))}

          {category.subtypes.length > 1 && <p className="selected-item-label">{item.label}</p>}
          {showItemDescription && <p className="selected-item-description">{item.description}</p>}

          <div className="product-buy">
            <div className="product-price-row">
              <span className="product-price">${formatPrice(price)}</span>
              <StockLabel stock={stock} />
            </div>

            <div className="product-buy-row">
              <div className="cart-controls cart-controls-large" aria-label="Quantity">
                <button
                  onClick={() => setQuantityToAdd((q) => Math.max(1, q - 1))}
                  disabled={quantityToAdd <= 1}
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span aria-live="polite">{quantityToAdd}</span>
                <button
                  onClick={() => setQuantityToAdd((q) => q + 1)}
                  disabled={quantityToAdd >= available}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
              <button className="btn btn-go btn-lg add-to-cart-btn" onClick={handleAddToCart} disabled={available <= 0}>
                {!inventoryLoaded ? 'Checking stock…' : stock <= 0 ? 'Sold out' : available <= 0 ? 'All in your cart' : 'Add to cart'}
              </button>
            </div>

            {(justAdded || inCart > 0) && (
              <p className="in-cart-note" aria-live="polite">
                {justAdded ? 'Added. ' : ''}
                {inCart} in your cart · <Link to="/cart">View cart</Link>
              </p>
            )}
          </div>

          {BUILD_OPTION_CATEGORIES.has(category.id) && (
            <p className="product-cross-link">
              Want this in a finished controller? <Link to="/">Pick it in the build configurator</Link>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
