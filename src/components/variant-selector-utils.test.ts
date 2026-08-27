import { describe, it, expect } from 'vitest';
import { findBestVariantMatch, getPriceDisplay } from './VariantSelector';
import type { CatalogItem } from '@shared/types';
import type { Facet } from './VariantSelector';

const mockItems = [
  { id: 'item-a', label: 'Item A', price: 10 },
  { id: 'item-b', label: 'Item B', price: 15 },
  { id: 'item-c', label: 'Item C', price: 5 },
] as CatalogItem[];

const mockFacets: Facet<CatalogItem>[] = [
  { key: 'type', label: 'Type', getValue: (item) => item.id.startsWith('item-a') ? 'TypeA' : 'TypeB' },
  { key: 'color', label: 'Color', getValue: (item) => item.id === 'item-b' ? 'Blue' : 'Red' },
];

describe('VariantSelector utils', () => {
  describe('findBestVariantMatch', () => {
    it('Returns the item matching the selected facet when only one match exists', () => {
      const result = findBestVariantMatch({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeA',
        activeFacets: { color: 'Red' }
      });
      expect(result?.id).toBe('item-a');
    });

    it('Returns the item with the highest score (most overlapping facets) when multiple matches exist', () => {
      const result = findBestVariantMatch({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeB',
        activeFacets: { color: 'Blue' } // item-b is Blue, item-c is Red. Both are TypeB.
      });
      expect(result?.id).toBe('item-b');
    });

    it('Returns null when no items match the facet value', () => {
      const result = findBestVariantMatch({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeC',
        activeFacets: {}
      });
      expect(result).toBeNull();
    });

    it('Skips disabled items', () => {
      const result = findBestVariantMatch({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeA',
        activeFacets: {},
        disabledFn: (item) => item.id === 'item-a'
      });
      expect(result).toBeNull(); // Only item-a is TypeA, and it's disabled.
    });

    it('Returns the item even if it does not match active secondary facets', () => {
      const result = findBestVariantMatch({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeA',
        activeFacets: { color: 'indigo' },
      });
      expect(result?.id).toBe('item-a');
    });
  });

  describe('getPriceDisplay', () => {
    it('Returns null when price diff is 0', () => {
      const result = getPriceDisplay({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeA',
        activeFacets: {},
        basePrice: 10
      });
      expect(result).toBeNull();
    });

    it('Returns +$5 fragment when item is $5 more than base', () => {
      // item-b is 15. base is 10. diff is +5
      const result = getPriceDisplay({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'color',
        facetValue: 'Blue',
        activeFacets: {},
        basePrice: 10
      });
      expect(result).toEqual([{ text: '+$5', className: 'price-increase' }]);
    });

    it('Returns -$5 fragment when item is $5 less than base', () => {
      // item-c is 5. TypeB and color Red
      const result = getPriceDisplay({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeB',
        activeFacets: { color: 'Red' }, // pin down to item-c
        basePrice: 10
      });
      expect(result).toEqual([{ text: '-$5', className: 'price-decrease' }]);
    });

    it('Returns range fragments when items have different prices', () => {
      // TypeB matches item-b (15) and item-c (5)
      const result = getPriceDisplay({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeB',
        activeFacets: {},
        basePrice: 10
      });
      expect(result).toEqual([
        { text: '$-5', className: 'price-decrease' },
        { text: ' to ', className: '' },
        { text: '+$5', className: 'price-increase' }
      ]);
    });

    it('Returns null when no matching items exist', () => {
      const result = getPriceDisplay({
        items: mockItems,
        facets: mockFacets,
        facetKey: 'type',
        facetValue: 'TypeC',
        activeFacets: {},
        basePrice: 10
      });
      expect(result).toBeNull();
    });
  });
});
