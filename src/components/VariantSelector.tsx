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
  getStock?: (id: string) => number;
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
  getStock,
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

  type PriceFragment = { text: string; className: string };

  const getPriceDisplay = (facetKey: string, facetValue: string): PriceFragment[] | null => {
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
      if (minDiff === 0) return null;
      return [{
        text: minDiff > 0 ? `+$${formatPrice(minDiff)}` : `-$${formatPrice(Math.abs(minDiff))}`,
        className: minDiff > 0 ? 'price-increase' : 'price-decrease'
      }];
    } else {
      const minSign = minDiff > 0 ? '+' : minDiff < 0 ? '-' : '';
      const maxSign = maxDiff > 0 ? '+' : maxDiff < 0 ? '-' : '';
      const minVal = formatPrice(Math.abs(minDiff));
      const maxVal = formatPrice(Math.abs(maxDiff));
      
      return [
        {
          text: `$${minSign}${minVal}`,
          className: minDiff > 0 ? 'price-increase' : minDiff < 0 ? 'price-decrease' : ''
        },
        {
          text: ' to ',
          className: ''
        },
        {
          text: `${maxSign}${maxVal}`,
          className: maxDiff > 0 ? 'price-increase' : maxDiff < 0 ? 'price-decrease' : ''
        }
      ];
    }
  };

  return (
    <div className="config-section">
      <h3 className="section-title">{title}</h3>
      <div className="variant-selector" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {facets.map((facet, facetIndex) => {
          const relevantItems = items.filter(item => {
            for (let i = 0; i < facetIndex; i++) {
              const previousFacet = facets[i];
              if (activeFacets[previousFacet.key]) {
                const itemVal = previousFacet.getValue(item);
                if (itemVal && itemVal !== activeFacets[previousFacet.key]) {
                  return false;
                }
              }
            }
            return true;
          });

          const uniqueValues = Array.from(new Set(
            relevantItems.map(i => facet.getValue(i)).filter(Boolean) as string[]
          ));
          
          if (uniqueValues.length <= 1) return null;

          return (
            <div key={facet.key} className="variant-row" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <h4 className="variant-label" style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>{facet.label}</h4>
              <div className="variant-options" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {uniqueValues.map(val => {
                  const isActive = activeFacets[facet.key] === val;
                  const priceFragments = getPriceDisplay(facet.key, val);
                  const isValidAtAll = items.some(i => facet.getValue(i) === val && !disabledFn(i) && !isOutOfStock(i.id));

                  const exactMatchingItems = items.filter(item => {
                    if (facet.getValue(item) !== val) return false;
                    for (const f of facets) {
                      if (f.key !== facet.key && activeFacets[f.key]) {
                         const fVal = f.getValue(item);
                         if (fVal && fVal !== activeFacets[f.key]) return false;
                      }
                    }
                    return true;
                  });
                  
                  const isLeaf = exactMatchingItems.length === 1;
                  const stock = isLeaf && getStock ? getStock(exactMatchingItems[0].id) : undefined;
                  const isLeafOutOfStock = isLeaf && isOutOfStock(exactMatchingItems[0].id);

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
                        {priceFragments && (
                          <span className="item-price" style={{ marginLeft: '0.5rem' }}>
                            {priceFragments.map((frag, idx) => (
                              <span key={idx} className={frag.className}>{frag.text}</span>
                            ))}
                          </span>
                        )}
                      </div>
                      {stock !== undefined && (
                        <div className="item-meta" style={{ margin: 0, paddingLeft: '0.25rem', borderLeft: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' }}>
                          <span className="stock-count" style={{ fontSize: '0.8rem', opacity: 0.8 }}>{stock} in stock</span>
                          {isLeafOutOfStock && <span className="out-of-stock-badge" style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.3rem' }}>Out of Stock</span>}
                        </div>
                      )}
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
