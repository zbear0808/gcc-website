import React from 'react';
import type { CatalogItem } from '@shared/types';
import { formatPrice } from '@shared/pricing';
import Tooltip from '@/components/Tooltip';
import { ExternalLinkIcon } from '@/components/Icons';
import { getCategoryIdForItem } from '@shared/catalog';
import { useStore } from '@/store/useStore';

export interface PriceFragment { text: string; className: string; }

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
  const stock = useStore(state => state.inventory[item.id] || 0);
  const isOutOfStock = stock <= 0 && item.requiresInventory !== false;
  const disabled = !!disabledReason || isOutOfStock;

  let priceContent: React.ReactNode = null;
  if (priceFragments) {
    priceContent = (
      <span className="item-price" style={{ marginLeft: '0.5rem' }}>
        {priceFragments.map((frag, idx) => (
          <span key={idx} className={frag.className}>{frag.text}</span>
        ))}
      </span>
    );
  } else {
    let diff = itemPrice;
    if (basePrice !== undefined) {
      diff = itemPrice - basePrice;
    }
    if (basePrice !== undefined && diff === 0) {
      // no price text
    } else if (diff > 0) {
      priceContent = <span className="item-price price-increase"> +${formatPrice(diff)}</span>;
    } else if (diff < 0) {
      priceContent = <span className="item-price price-decrease"> -${formatPrice(Math.abs(diff))}</span>;
    } else if (basePrice === undefined && itemPrice > 0) {
      priceContent = <span className="item-price price-increase"> +${formatPrice(itemPrice)}</span>;
    }
  }

  const itemCategoryId = showExternalLinks ? getCategoryIdForItem(item.id) : undefined;

  return (
    <Tooltip content={disabledReason || undefined}>
      <div style={{ position: 'relative', display: 'flex', flexDirection: variant === 'sub' ? 'row' : 'column', height: '100%' }}>
        <button
          className={`config-item-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${variant === 'sub' ? 'sub-btn' : ''} ${buttonSize === 'small' ? 'small-btn' : ''} ${isToggleable ? 'toggleable-btn' : ''}`}
          onClick={() => !disabled && onSelect()}
          disabled={disabled}
          style={{ flex: 1, paddingRight: itemCategoryId ? '2.5rem' : undefined, display: variant === 'sub' ? 'flex' : 'block', gap: variant === 'sub' ? '0.5rem' : '0', alignItems: 'center' }}
        >
          <div className="item-label" style={{ fontSize: variant === 'sub' ? '0.95rem' : 'inherit' }}>
            {item.label}
            {priceContent}
          </div>
          
          {item.description && isActive && descriptionPosition === 'inside' && (
            <div className="item-description">{item.description}</div>
          )}
          
          {!hideStock && (
            <div className="item-meta" style={variant === 'sub' ? { margin: 0, paddingLeft: '0.25rem', borderLeft: '1px solid var(--color-border)', display: 'flex', alignItems: 'center' } : {}}>
              <span className="stock-count" style={variant === 'sub' ? { fontSize: '0.8rem', opacity: 0.8 } : {}}>{stock} in stock</span>
              {isOutOfStock && <span className="out-of-stock-badge" style={variant === 'sub' ? { marginLeft: '0.5rem', fontSize: '0.75rem', padding: '0.1rem 0.3rem' } : {}}>Out of Stock</span>}
            </div>
          )}
        </button>
        {itemCategoryId && (
          <a
            href={`/product/${itemCategoryId}?selected=${item.id}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: variant === 'sub' ? '50%' : '0.5rem',
              transform: variant === 'sub' ? 'translateY(-50%)' : 'none',
              right: '0.5rem',
              color: 'var(--color-gray-hover)',
              opacity: 0.6,
              transition: 'opacity 0.2s, color 0.2s',
              display: 'flex',
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = 'var(--color-white)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.color = 'var(--color-gray-hover)';
            }}
            title="View Part Details"
          >
            <ExternalLinkIcon width="16" height="16" />
          </a>
        )}
      </div>
    </Tooltip>
  );
};

export default OptionButton;
