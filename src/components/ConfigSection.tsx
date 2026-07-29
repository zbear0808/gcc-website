import React from 'react';
import { CatalogItem, ConfiguratorState } from '@shared/types';

interface Group {
  groupTitle: string;
  filterFn: (item: CatalogItem) => boolean;
}

interface ConfigSectionProps {
  title: string;
  category?: keyof ConfiguratorState;
  items: CatalogItem[];
  config: ConfiguratorState;
  isOutOfStock: (id: string) => boolean;
  getStock: (id: string) => number;
  onSelect: (id: string) => void;
  isMulti?: boolean;
  disabledFn?: (id: string) => boolean;
  groups?: Group[];
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  category,
  items,
  config,
  isOutOfStock,
  getStock,
  onSelect,
  isMulti = false,
  disabledFn = () => false,
  groups,
}) => {
  const renderItem = (item: CatalogItem) => {
    const outOfStock = isOutOfStock(item.id);
    const stock = getStock(item.id);
    const disabled = disabledFn(item.id) || outOfStock;
    
    let isActive = false;
    if (isMulti) {
      const multiValues = category ? config[category] as unknown as string[] : [];
      isActive = Array.isArray(multiValues) && multiValues.includes(item.id);
    } else if (category) {
      isActive = config[category] === item.id;
    }

    return (
      <button
        key={item.id}
        className={`config-item-btn ${isActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={() => !disabled && onSelect(item.id)}
        disabled={disabled}
      >
        <div className="item-label">
          {item.name}
          {item.price > 0 && <span className="item-price"> +${item.price.toFixed(2)}</span>}
        </div>
        
        {item.description && (
          <div className="item-description">{item.description}</div>
        )}
        
        <div className="item-meta">
          <span className="stock-count">{stock} in stock</span>
          {outOfStock && <span className="out-of-stock-badge">Out of Stock</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="config-section">
      <h3 className="section-title">{title}</h3>
      
      {groups ? (
        groups.map((group) => {
          const groupItems = items.filter(group.filterFn);
          if (groupItems.length === 0) return null;
          
          return (
            <div key={group.groupTitle} className="config-group">
              <h4 className="group-title">{group.groupTitle}</h4>
              <div className="config-items-grid">
                {groupItems.map(renderItem)}
              </div>
            </div>
          );
        })
      ) : (
        <div className="config-items-grid">
          {items.map(renderItem)}
        </div>
      )}
    </div>
  );
};

export default ConfigSection;
