import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EquipmentModule } from '@pkg/data';
import {
  Panel,
  TextInput,
  Chip,
  ListItem,
  ListSection,
  IconSearch,
  IconGrid,
  IconFilter,
} from '@pkg/ui';
import { useEditorStore } from '../../state/useEditorStore';
import { describeModule } from '../../utils/format';

const normalize = (value: string): string => value.normalize('NFD').replace(/[^\w\s-]/g, '').toLowerCase();

export const CatalogPanel: React.FC = () => {
  const { t } = useTranslation();
  const catalog = useEditorStore((state) => state.catalog);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    catalog.forEach((module) => module.tags?.forEach((tag) => tags.add(tag)));
    return Array.from(tags).sort();
  }, [catalog]);

  const filtered = useMemo(() => {
    const query = normalize(search);
    return catalog.filter((module) => {
      const matchesQuery =
        query.length === 0 ||
        normalize(module.name).includes(query) ||
        module.tags?.some((tag) => normalize(tag).includes(query));
      const matchesTag = !tagFilter || module.tags?.includes(tagFilter);
      return matchesQuery && matchesTag;
    });
  }, [catalog, search, tagFilter]);

  const handleDragStart = (module: EquipmentModule) => (event: React.DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.setData('application/module-sku', module.sku);
    event.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <Panel title={t('catalog.title')} className="app-catalog">
      <div className="catalog-header">
        <div className="catalog-search">
          <IconSearch />
          <TextInput
            aria-label={t('catalog.search')}
            placeholder={t('catalog.search') ?? ''}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="toolbar-section">
          <span className="language-selector">
            <IconFilter />
            {t('catalog.tags')}
          </span>
          <div className="unit-selector">
            <button
              type="button"
              className="aui-button aui-button--ghost"
              onClick={() => setTagFilter(null)}
            >
              {t('catalog.clearFilters')}
            </button>
            {allTags.map((tag) => (
              <Chip
                key={tag}
                selected={tagFilter === tag}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                {tag}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="catalog-list scrollbar-thin" role="list">
        <ListSection
          title={`${filtered.length} / ${catalog.length}`}
          actions={
            <span className="language-selector">
              <IconGrid />
              {t('catalog.dropHint')}
            </span>
          }
        >
          {filtered.map((module) => (
            <ListItem
              key={module.sku}
              title={module.name}
              subtitle={describeModule(module)}
              metadata={t('catalog.mass', { mass: module.mass_kg.toFixed(1) })}
              onDragStart={handleDragStart(module)}
              draggable
              icon={<span>{module.sku.slice(-3)}</span>}
              data-module-sku={module.sku}
              data-testid={`catalog-item-${module.sku.toLowerCase()}`}
            />
          ))}
        </ListSection>
      </div>
    </Panel>
  );
};
