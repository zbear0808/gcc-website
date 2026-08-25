import React from 'react';
import type { CatalogItem, ConfiguratorState } from '@shared/types';
import OptionButton from './OptionButton';

interface Group {
  groupTitle: string;
  filterFn: (item: CatalogItem) => boolean;
}

interface ConfigSectionProps {
  title: string;
  category?: keyof ConfiguratorState;
  items: CatalogItem[];
  config?: ConfiguratorState;
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
    const disabledResult = disabledFn(item);
    const disabledReason = typeof disabledResult === 'string' ? disabledResult : (disabledResult ? 'Disabled' : null);
    
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

    return (
      <OptionButton
        key={item.id}
        item={item}
        isActive={isActive}
        disabledReason={disabledReason}
        basePrice={basePrice}
        itemPrice={itemPrice}
        variant={variant}
        buttonSize={buttonSize}
        isToggleable={isToggleable}
        hideStock={hideStock}
        showExternalLinks={showExternalLinks}
        descriptionPosition={descriptionPosition}
        onSelect={() => onSelect(item.id)}
      />
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
