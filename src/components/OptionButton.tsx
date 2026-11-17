import React from 'react';
import type { CatalogItem } from '@shared/types';
import { formatPrice } from '@shared/pricing';
import Tooltip from '@/components/Tooltip';
import { CheckIcon, ExternalLinkIcon } from '@/components/Icons';
import { getCategoryIdForItem } from '@shared/catalog';
import { useStore } from '@/store/useStore';

export interface PriceFragment { text: string; className: string; }

const LOW_STOCK = 3;

interface OptionButtonProps {
  item: CatalogItem;
  isActive: boolean;
  disabledReason?: string | null;
  basePrice?: number;
  itemPrice: number;
  variant?: 'default' | 'sub';
  buttonSize?: 'default' | 'small';
  isToggleable?: boolean;
  hideStock?: boolean;
  showExternalLinks?: boolean;
  descriptionPosition?: 'inside' | 'outside' | 'none';
  priceFragments?: PriceFragment[] | null;
  onSelect: () => void;
}

function priceDiff(itemPrice: number, basePrice?: number): React.ReactNode {
  const diff = basePrice === undefined ? itemPrice : itemPrice - basePrice;
  if (diff > 0) return <span className="price-increase">+${formatPrice(diff)}</span>;
  if (diff < 0) return <span className="price-decrease">-${formatPrice(Math.abs(diff))}</span>;
  return null;
}

const OptionButton: React.FC<OptionButtonProps> = ({
  item,
  isActive,
  disabledReason,
  basePrice,
  itemPrice,
  variant = 'default',
  buttonSize = 'default',
  isToggleable = false,
  hideStock = false,
  showExternalLinks = false,
  descriptionPosition = 'inside',
  priceFragments,
  onSelect,
}) => {
  const stock = useStore((state) => state.inventory[item.id] || 0);
  const tracksStock = item.requiresInventory !== false;
  const isOutOfStock = tracksStock && stock <= 0;
  const disabled = !!disabledReason || isOutOfStock;

  const price =
    priceFragments !== undefined
      ? priceFragments?.length
        ? priceFragments.map((frag, idx) => <span key={idx} className={frag.className}>{frag.text}</span>)
        : null
      : priceDiff(itemPrice, basePrice);

  let stockNote: string | null = null;
  if (!hideStock && tracksStock) {
    if (isOutOfStock) stockNote = 'Sold out';
    else if (stock <= LOW_STOCK) stockNote = `Only ${stock} left`;
  }

  const itemCategoryId = showExternalLinks ? getCategoryIdForItem(item.id) : undefined;

  const classes = [
    'option-btn',
    isActive && 'active',
    disabled && 'disabled',
    variant === 'sub' && 'option-sub',
    buttonSize === 'small' && 'option-small',
    isToggleable && 'toggleable',
    itemCategoryId && 'has-link',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Tooltip content={disabledReason || undefined}>
      <div className="option">
        <button
          type="button"
          className={classes}
          onClick={() => !disabled && onSelect()}
          disabled={disabled}
          aria-pressed={isActive}
        >
          <span className="option-head">
            <span className="option-label">{item.label}</span>
            {price && <span className="option-price">{price}</span>}
          </span>

          {item.description && isActive && descriptionPosition === 'inside' && (
            <span className="option-desc">{item.description}</span>
          )}

          {stockNote && <span className={`option-stock ${isOutOfStock ? 'out' : 'low'}`}>{stockNote}</span>}

          {isActive && (
            <span className="option-check" aria-hidden="true">
              <CheckIcon />
            </span>
          )}
          {isActive && isToggleable && <span className="option-remove">Remove</span>}
        </button>

        {itemCategoryId && (
          <a
            className="option-link"
            href={`/product/${itemCategoryId}?selected=${item.id}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            title={`View ${item.label} details`}
            aria-label={`View ${item.label} details (opens in new tab)`}
          >
            <ExternalLinkIcon width="14" height="14" />
          </a>
        )}
      </div>
    </Tooltip>
  );
};

export default OptionButton;
