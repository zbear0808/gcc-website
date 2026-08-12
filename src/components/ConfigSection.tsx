import React from 'react';
import type { CatalogItem, ConfiguratorState } from '@shared/types';
import { formatPrice } from '@shared/pricing';
import Tooltip from '@/components/Tooltip';
import { ExternalLinkIcon } from '@/components/Icons';
import { getCategoryIdForItem } from '@shared/catalog';

interface Group {
  groupTitle: string;
  filterFn: (item: CatalogItem) => boolean;
}

interface ConfigSectionProps {
  title: string;
  category?: keyof ConfiguratorState;
  items: CatalogItem[];
  config?: ConfiguratorState;
  isOutOfStock?: (id: string) => boolean;
  getStock?: (id: string) => number;
  onSelect: (id: string) => void;
  selectedId?: string;
  isMulti?: boolean;
  disabledFn?: (item: CatalogItem) => boolean | string;
  groups?: Group[];
  basePrice?: number;
  variant?: 'default' | 'sub';
  descriptionPosition?: 'inside' | 'outside' | 'none';
  buttonSize?: 'default' | 'small';
  hideStock?: boolean;
  isToggleable?: boolean;
  priceKey?: 'price' | 'individualPrice';
  showExternalLinks?: boolean;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  category,
  items,
  config,
  isOutOfStock = () => false,
  getStock = () => 10,
  onSelect,
  selectedId,
  isMulti = false,
  disabledFn = () => false,
  groups,
  basePrice,
  variant = 'default',
  descriptionPosition = 'inside',
  buttonSize = 'default',
  hideStock = false,
  isToggleable = false,
  priceKey = 'price',
  showExternalLinks = false,
}) => {
  const renderItem = (item: CatalogItem) => {
    const outOfStock = isOutOfStock(item.id);
    const stock = getStock(item.id);
    const disabledResult = disabledFn(item);
    const disabled = !!disabledResult || outOfStock;
    const disabledReason = typeof disabledResult === 'string' ? disabledResult : null;
    
    let isActive = false;
    if (selectedId !== undefined) {
      isActive = selectedId === item.id;
    } else if (isMulti) {
      const val = category && config ? config[category] : undefined;
      const multiValues = (Array.isArray(val) ? val : []) as string[];
      isActive = multiValues.includes(item.id);
    } else if (category && config) {
      isActive = config[category] === item.id;
    }

    const p = priceKey === 'individualPrice' ? item.individualPrice ?? item.price : item.price;
    const itemPrice = typeof p === 'number' ? p : 0;

    let diff = itemPrice;
    if (basePrice !== undefined) {
      diff = itemPrice - basePrice;
    }

    let priceText = '';
    let priceClass = '';
    
    if (basePrice !== undefined && diff === 0) {
      priceText = '';
    } else if (diff > 0) {
      priceText = ` +$${formatPrice(diff)}`;
      priceClass = ' price-increase';
    } else if (diff < 0) {
      priceText = ` -$${formatPrice(Math.abs(diff))}`;
      priceClass = ' price-decrease';
    } else if (basePrice === undefined && itemPrice > 0) {
      priceText = ` +$${formatPrice(itemPrice)}`;
      priceClass = ' price-increase';
    }

    const itemCategoryId = showExternalLinks ? getCategoryIdForItem(item.id) : undefined;

    return (
      <Tooltip key={item.id} content={disabledReason}>
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
          <button
            className={`config-item-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${variant === 'sub' ? 'sub-btn' : ''} ${buttonSize === 'small' ? 'small-btn' : ''} ${isToggleable ? 'toggleable-btn' : ''}`}
            onClick={() => !disabled && onSelect(item.id)}
            disabled={disabled}
            style={{ flex: 1, paddingRight: itemCategoryId ? '2.5rem' : undefined }}
          >
            <div className="item-label">
              {item.label}
              {priceText && <span className={`item-price${priceClass}`}>{priceText}</span>}
            </div>
            
            {item.description && isActive && descriptionPosition === 'inside' && (
              <div className="item-description">{item.description}</div>
            )}
            
            {!hideStock && (
              <div className="item-meta">
                <span className="stock-count">{stock} in stock</span>
                {outOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
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
                top: '0.5rem',
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

  return (
    <div className={`config-section ${variant === 'sub' ? 'sub-variant' : ''}`}>
      {title && (
        variant === 'sub' ? (
          <h4 className="section-subtitle">{title}</h4>
        ) : (
          <h3 className="section-title">{title}</h3>
        )
      )}
      
      {groups ? (
        groups.map((group) => {
          const groupItems = items.filter(group.filterFn);
          if (groupItems.length === 0) return null;
          
          return (
            <div key={group.groupTitle} className="config-group">
              <h4 className="group-title">{group.groupTitle}</h4>
              <div className={`config-items-grid ${variant === 'sub' ? 'sub-grid' : ''}`}>
                {groupItems.map(renderItem)}
              </div>
            </div>
          );
        })
      ) : (
        <div className={`config-items-grid ${variant === 'sub' ? 'sub-grid' : ''}`}>
          {items.map(renderItem)}
        </div>
      )}
      
      {descriptionPosition === 'outside' && (
        <div className="section-description-outside">
          {items.map(item => {
            let isActive = false;
            if (selectedId !== undefined) {
              isActive = selectedId === item.id;
            } else if (isMulti) {
              const val = category && config ? config[category] : undefined;
              const multiValues = (Array.isArray(val) ? val : []) as string[];
              isActive = multiValues.includes(item.id);
            } else if (category && config) {
              isActive = config[category] === item.id;
            }
            return isActive && item.description ? (
              <div key={item.id} className="active-item-description">
                {item.description}
              </div>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

export default ConfigSection;
