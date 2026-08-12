import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { fullCatalog } from '@shared/catalog';
import VariantSelector from '@/components/VariantSelector';
import ConfigSection from '@/components/ConfigSection';
import { shellFacets, buttonFacets, stickCapFacets } from '@shared/facets';
import { BackIcon } from '@/components/Icons';
import '@/assets/styles/pages/product.css';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  
  const category = fullCatalog.find(c => c.id === id);
  const searchParams = new URLSearchParams(location.search);
  const preselectedId = searchParams.get('selected');
  const initialItem = category?.subtypes.find(i => i.id === preselectedId)?.id || category?.subtypes[0]?.id || '';
  const [selectedItem, setSelectedItem] = useState(initialItem);
  const [quantityToAdd, setQuantityToAdd] = useState(1);
  
  if (!category) return <div>Product not found</div>;

  const item = category.subtypes.find(i => i.id === selectedItem) || category.subtypes[0];
  const stock = store.inventory[item.id] || 0;
  const inCart = store.cart[item.id] || 0;

  const galleryImages = useMemo(() => {
    const images = new Set<string>();
    if (category.image) images.add(category.image);
    category.subtypes.forEach(sub => {
      if (sub.image) images.add(sub.image);
    });
    return Array.from(images);
  }, [category]);

  const [activeImage, setActiveImage] = useState(galleryImages[0]);

  useEffect(() => {
    setQuantityToAdd(1);
  }, [selectedItem]);

  useEffect(() => {
    if (item.image) {
      setActiveImage(item.image);
    } else {
      setActiveImage(category.image);
    }
  }, [item, category]);

  const handleAddToCart = () => {
    if (stock >= inCart + quantityToAdd) {
      store.updateCartQuantity(item.id, quantityToAdd);
      setQuantityToAdd(1);
    }
  };

  return (
    <div className="product-page">
      <button className="back-link" onClick={() => navigate('/parts')}>
        <BackIcon className="icon" />
        Back to Parts
      </button>
      <div className="product-details">
        <div className="product-gallery">
          <div className="main-image-container">
            <img src={activeImage} alt={item.label} />
          </div>
          {galleryImages.length > 1 && (
            <div className="thumbnail-row">
              {galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  className={`thumbnail-btn ${activeImage === img ? 'active' : ''}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Thumbnail ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="product-info">
          <h2>{category.label}</h2>
          <p>{category.description}</p>
          
          {category.subtypes.length > 1 && (
            category.id === 'shells' ? (
              <VariantSelector
                title="Options"
                items={category.subtypes as import('@shared/types').ShellOption[]}
                facets={shellFacets}
                value={selectedItem}
                onChange={setSelectedItem}
                basePrice={item.individualPrice ?? item.price ?? 0}
                priceKey="individualPrice"
                getStock={(id) => store.inventory[id] || 0}
              />
            ) : category.id === 'buttons' ? (
              <VariantSelector
                title="Options"
                items={category.subtypes as import('@shared/types').ButtonOption[]}
                facets={buttonFacets}
                value={selectedItem}
                onChange={setSelectedItem}
                basePrice={item.individualPrice ?? item.price ?? 0}
                priceKey="individualPrice"
                getStock={(id) => store.inventory[id] || 0}
              />
            ) : category.id === 'stick-caps' ? (
              <VariantSelector
                title="Options"
                items={category.subtypes as import('@shared/types').StickCapOption[]}
                facets={stickCapFacets}
                value={selectedItem}
                onChange={setSelectedItem}
                basePrice={item.individualPrice ?? item.price ?? 0}
                priceKey="individualPrice"
                getStock={(id) => store.inventory[id] || 0}
              />
            ) : (
              <ConfigSection
                title="Options"
                items={category.subtypes}
                selectedId={selectedItem}
                onSelect={setSelectedItem}
                basePrice={item.individualPrice ?? item.price ?? 0}
                priceKey="individualPrice"
                getStock={(id) => store.inventory[id] || 0}
                descriptionPosition="none"
              />
            )
          )}

          <div className="price">${item.individualPrice ?? item.price ?? 0}</div>
          <div className="stock">
            {stock <= 0 ? (
              <span className="out-of-stock">Out of stock</span>
            ) : stock <= 10 ? (
              <span className="low-stock">Low stock</span>
            ) : (
              <span className="stock-count">In stock</span>
            )}
          </div>

          <div className="cart-controls-container">
            <div className="cart-controls">
              <button 
                onClick={() => setQuantityToAdd(q => Math.max(1, q - 1))} 
                disabled={quantityToAdd <= 1}
              >
                -
              </button>
              <span>{quantityToAdd}</span>
              <button 
                onClick={() => setQuantityToAdd(q => q + 1)} 
                disabled={quantityToAdd >= stock - inCart || stock === 0}
              >
                +
              </button>
            </div>
            <button 
              className="add-to-cart-btn" 
              onClick={handleAddToCart}
              disabled={stock === 0 || inCart >= stock}
            >
              Add to Cart
            </button>
            {inCart > 0 && (
              <div className="in-cart-note">{inCart} already in cart</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
