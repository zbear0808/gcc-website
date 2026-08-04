import { useState, useEffect, useMemo } from 'react';
import type { CatalogItem } from '@shared/types';
import { formatPrice } from '@shared/pricing';

export interface Facet<T> {
  key: string;
  label: string;
  getValue: (item: T) => string | null;
}

interface VariantSelectorProps<T extends CatalogItem> {
  title: string;
  items: T[];
  facets: Facet<T>[];
  value?: string;
  onChange: (id: string) => void;
  basePrice?: number;
  disabledFn?: (item: T) => boolean;
  isOutOfStock?: (id: string) => boolean;
}

export default function VariantSelector<T extends CatalogItem>({
  title,
  items,
  facets,
  value,
  onChange,
  basePrice = 0,
  disabledFn = () => false,
  isOutOfStock = () => false,
}: VariantSelectorProps<T>) {
  
  const selectedItem = useMemo(() => items.find((i) => i.id === value), [items, value]);
  const [activeFacets, setActiveFacets] = useState<Record<string, string>>({});

  // Sync active facets with the external value
  useEffect(() => {
    if (selectedItem) {
      const newFacets: Record<string, string> = {};
      facets.forEach((f) => {
        const val = f.getValue(selectedItem);
        if (val) newFacets[f.key] = val;
      });
      setActiveFacets(newFacets);
    }
  }, [selectedItem, facets]);

  const handleFacetSelect = (facetKey: string, facetValue: string) => {
    const newFacets = { ...activeFacets, [facetKey]: facetValue };
    
    // Find the best fallback item that matches the newly selected facet
    let bestItem: T | null = null;
    let bestScore = -1;
    
    for (const item of items) {
      if (disabledFn(item) || isOutOfStock(item.id)) continue;
      
      // Must match the newly clicked facet exactly
      if (facets.find(f => f.key === facetKey)?.getValue(item) !== facetValue) {
         continue;
      }

      let score = 0;
      facets.forEach((f) => {
        if (f.key !== facetKey) {
          const itemVal = f.getValue(item);
          // If the item shares the same target facet value, boost its score
          if (itemVal && itemVal === newFacets[f.key]) {
            score += 1;
          }
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }

    if (bestItem) {
      onChange(bestItem.id);
    } else {
      setActiveFacets(newFacets);
    }
  };

  const getPriceDisplay = (facetKey: string, facetValue: string) => {
    // Find items that match this facet value, and attempt to match higher-priority facets if possible.
    // For simplicity, we find all items matching this facet value + the currently active OTHER facets.
    // If none match, we just fallback to all items matching this facet value.
    
    let matchingItems = items.filter(item => {
      if (disabledFn(item) || isOutOfStock(item.id)) return false;
      if (facets.find(f => f.key === facetKey)?.getValue(item) !== facetValue) return false;
      
      for (const f of facets) {
        if (f.key !== facetKey && activeFacets[f.key]) {
           const val = f.getValue(item);
           if (val && val !== activeFacets[f.key]) return false;
        }
      }
      return true;
    });

    if (matchingItems.length === 0) {
      matchingItems = items.filter(item => 
        !disabledFn(item) && !isOutOfStock(item.id) && facets.find(f => f.key === facetKey)?.getValue(item) === facetValue
      );
    }

    if (matchingItems.length === 0) return null;

    const prices = matchingItems.map(i => i.price);
    const minDiff = Math.min(...prices) - basePrice;
    const maxDiff = Math.max(...prices) - basePrice;

    if (minDiff === maxDiff) {
      if (minDiff === 0) return '';
      return minDiff > 0 ? `+$${formatPrice(minDiff)}` : `-$${formatPrice(Math.abs(minDiff))}`;
    } else {
      const minStr = minDiff > 0 ? `+$${formatPrice(minDiff)}` : minDiff < 0 ? `-$${formatPrice(Math.abs(minDiff))}` : `$0`;
      const maxStr = maxDiff > 0 ? `+$${formatPrice(maxDiff)}` : maxDiff < 0 ? `-$${formatPrice(Math.abs(maxDiff))}` : `$0`;
      return `${minStr} - ${maxStr}`;
    }
  };

  return (
    <div className="config-section">
      <h3 className="section-title">{title}</h3>
      <div className="variant-selector" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {facets.map((facet) => {
          const uniqueValues = Array.from(new Set(
            items.map(i => facet.getValue(i)).filter(Boolean) as string[]
          ));
          
          if (uniqueValues.length <= 1) return null;

          return (
            <div key={facet.key} className="variant-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 className="variant-label" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{facet.label}</h4>
              <div className="variant-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {uniqueValues.map(val => {
                  const isActive = activeFacets[facet.key] === val;
                  const priceStr = getPriceDisplay(facet.key, val);
                  const isValidAtAll = items.some(i => facet.getValue(i) === val && !disabledFn(i) && !isOutOfStock(i.id));
                  
                  let priceClass = '';
                  if (priceStr?.includes('-') && !priceStr.includes(' - ')) priceClass = 'price-decrease';
                  else if (priceStr !== '') priceClass = 'price-increase';

                  return (
                    <button
                      key={val}
                      className={`config-item-btn ${isActive ? 'active' : ''} ${!isValidAtAll ? 'disabled' : ''}`}
                      onClick={() => {
                        if (isValidAtAll) handleFacetSelect(facet.key, val);
                      }}
                      disabled={!isValidAtAll}
                      style={{ padding: '0.5rem 1rem', minHeight: 'auto', flex: '0 0 auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                    >
                      <div className="item-label" style={{ fontSize: '0.95rem' }}>
                        {val}
                        {priceStr && <span className={`item-price ${priceClass}`} style={{ marginLeft: '0.5rem' }}>{priceStr}</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
