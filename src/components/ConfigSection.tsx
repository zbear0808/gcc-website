import React from 'react';
import type { CatalogItem, ConfiguratorState } from '@shared/types';
import { formatPrice } from '@shared/pricing';

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
  disabledFn?: (item: CatalogItem) => boolean;
  groups?: Group[];
  basePrice?: number;
  variant?: 'default' | 'sub';
  descriptionPosition?: 'inside' | 'outside' | 'none';
  buttonSize?: 'default' | 'small';
  hideStock?: boolean;
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
}) => {
  const renderItem = (item: CatalogItem) => {
    const outOfStock = isOutOfStock(item.id);
    const stock = getStock(item.id);
    const disabled = disabledFn(item) || outOfStock;
    
    let isActive = false;
    if (selectedId !== undefined) {
      isActive = selectedId === item.id;
    } else if (isMulti) {
      const multiValues = category && config ? config[category] as unknown as string[] : [];
      isActive = Array.isArray(multiValues) && multiValues.includes(item.id);
    } else if (category && config) {
      isActive = config[category] === item.id;
    }

    let diff = item.price;
    if (basePrice !== undefined) {
      diff = item.price - basePrice;
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
    } else if (basePrice === undefined && item.price > 0) {
      priceText = ` +$${formatPrice(item.price)}`;
      priceClass = ' price-increase';
    }

    return (
      <button
        key={item.id}
        className={`config-item-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''} ${variant === 'sub' ? 'sub-btn' : ''} ${buttonSize === 'small' ? 'small-btn' : ''}`}
        onClick={() => !disabled && onSelect(item.id)}
        disabled={disabled}
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
              const multiValues = category && config ? config[category] as unknown as string[] : [];
              isActive = Array.isArray(multiValues) && multiValues.includes(item.id);
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
