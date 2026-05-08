import * as React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';
import { OdhDocument } from '@odh-dashboard/dashboard-foundation-frontend/types';
import { CATEGORY_ANNOTATION } from '@odh-dashboard/dashboard-foundation-frontend/utilities/const';
import {
  removeQueryArgument,
  setQueryArgument,
} from '@odh-dashboard/dashboard-foundation-frontend/utilities/router';
import { CATEGORY_FILTER_KEY } from './const';

type CategoryFiltersProps = {
  docApps: OdhDocument[];
  favorites: string[];
};

const ALL_ITEMS = 'All Items';

const CategoryFilters: React.FC<CategoryFiltersProps> = ({ docApps, favorites }) => {
  const [categories, setCategories] = React.useState<string[]>([]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryQuery = searchParams.get(CATEGORY_FILTER_KEY) || '';

  React.useEffect(() => {
    const initCategories = favorites.length ? ['Favorites'] : [];
    const updatedCategories = docApps
      .reduce((acc, docApp) => {
        const categoryAnnotation = docApp.metadata.annotations?.[CATEGORY_ANNOTATION];
        if (categoryAnnotation) {
          const annotationCategories = categoryAnnotation.split(',');
          annotationCategories
            .map((category) => category.trim())
            .forEach((category) => {
              if (!acc.includes(category)) {
                acc.push(category);
              }
            });
        }
        return acc;
      }, initCategories)
      .toSorted((a, b) => a.localeCompare(b));
    setCategories([ALL_ITEMS, ...updatedCategories]);
  }, [docApps, favorites]);

  const activeKey = categoryQuery || ALL_ITEMS;

  const onSelectCategory = (_event: React.MouseEvent, eventKey: string | number): void => {
    const selectedCategory = String(eventKey);
    if (selectedCategory === ALL_ITEMS) {
      removeQueryArgument(navigate, CATEGORY_FILTER_KEY);
      return;
    }
    setQueryArgument(navigate, CATEGORY_FILTER_KEY, selectedCategory);
  };

  return (
    <Tabs isVertical activeKey={activeKey} onSelect={onSelectCategory}>
      {categories.map((category) => (
        <Tab key={category} eventKey={category} title={<TabTitleText>{category}</TabTitleText>} />
      ))}
    </Tabs>
  );
};

export default CategoryFilters;
