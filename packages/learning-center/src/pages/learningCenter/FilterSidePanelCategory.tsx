import React from 'react';

type FilterSidePanelCategoryProps = {
  children?: React.ReactNode;
  title?: React.ReactNode;
  className?: string;
  showAll?: boolean;
  onShowAllToggle?: () => void;
  maxShowCount?: number;
  leeway?: number;
};

const FilterSidePanelCategory: React.FC<FilterSidePanelCategoryProps> = ({
  children,
  title,
  className = '',
  showAll = false,
  onShowAllToggle,
  maxShowCount = 5,
  leeway = 2,
}) => {
  const items = React.Children.toArray(children);
  const visibleItems = showAll ? items : items.slice(0, maxShowCount + leeway);
  const hiddenCount = items.length - visibleItems.length;

  return (
    <div className={`odh-learning-paths__filter-panel__filter-category ${className}`.trim()}>
      {title != null && (
        <div className="odh-learning-paths__filter-panel__filter-category-title">{title}</div>
      )}
      {showAll ? items : visibleItems}
      {!showAll && hiddenCount > 0 && onShowAllToggle && (
        <button
          type="button"
          className="odh-learning-paths__filter-panel__filter-category-show-more"
          onClick={onShowAllToggle}
        >
          Show {hiddenCount} more
        </button>
      )}
      {showAll && onShowAllToggle && items.length > maxShowCount + leeway && (
        <button
          type="button"
          className="odh-learning-paths__filter-panel__filter-category-show-more"
          onClick={onShowAllToggle}
        >
          Show less
        </button>
      )}
    </div>
  );
};

export default FilterSidePanelCategory;
