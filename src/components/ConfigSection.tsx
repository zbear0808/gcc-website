import React from 'react';
import type { CatalogItem, ConfiguratorState } from '@shared/types';
import OptionButton from './OptionButton';

interface Group {
  groupTitle: string;
  filterFn: (item: CatalogItem) => boolean;
}

interface ConfigSectionProps {
  title: string;
  hint?: string;
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
  children?: React.ReactNode;
}

const ConfigSection: React.FC<ConfigSectionProps> = ({
  title,
  hint,
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
  children,
}) => {
  const isItemActive = (item: CatalogItem) => {
    if (selectedId !== undefined) return selectedId === item.id;
    const val = category && config ? config[category] : undefined;
    if (isMulti) return (Array.isArray(val) ? (val as string[]) : []).includes(item.id);
    return val === item.id;
  };

  const renderItem = (item: CatalogItem) => {
    const disabledResult = disabledFn(item);
    const disabledReason = typeof disabledResult === 'string' ? disabledResult : disabledResult ? 'Disabled' : null;

    const p = priceKey === 'individualPrice' ? item.individualPrice ?? item.price : item.price;
    const itemPrice = typeof p === 'number' ? p : 0;

    return (
      <OptionButton
        key={item.id}
        item={item}
        isActive={isItemActive(item)}
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

  const gridClass = `config-items-grid${variant === 'sub' ? ' sub-grid' : ''}`;
  const activeDescription = descriptionPosition === 'outside' ? items.find(isItemActive)?.description : undefined;

  return (
    <div className={`config-section${variant === 'sub' ? ' sub-variant' : ''}`}>
      {title && (
        <div className="section-heading">
          {variant === 'sub' ? <h4 className="section-subtitle">{title}</h4> : <h3 className="section-title">{title}</h3>}
          {hint && <span className="section-hint">{hint}</span>}
        </div>
      )}

      {groups ? (
        groups.map((group) => {
          const groupItems = items.filter(group.filterFn);
          if (groupItems.length === 0) return null;
          return (
            <div key={group.groupTitle} className="config-group">
              <h4 className="group-title">{group.groupTitle}</h4>
              <div className={gridClass}>{groupItems.map(renderItem)}</div>
            </div>
          );
        })
      ) : (
        <div className={gridClass}>{items.map(renderItem)}</div>
      )}

      {activeDescription && <p className="section-description-outside">{activeDescription}</p>}
      {children}
    </div>
  );
};

export default ConfigSection;
