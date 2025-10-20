import React from 'react';
import { useTranslation } from 'react-i18next';
import { Panel, Field, NumberInput, Select, Checkbox, Button, IconDuplicate, IconTrash, IconLock, IconUnlock, Badge, Chip } from '@pkg/ui';
import { useEditorStore, type LengthUnit } from '../../state/useEditorStore';
import { formatLength, formatMass } from '../../utils/format';

const convertToMillimetres = (value: number, unit: LengthUnit): number =>
  unit === 'mm' ? value : value * 25.4;

const convertFromMillimetres = (value: number, unit: LengthUnit): number =>
  unit === 'mm' ? value : value / 25.4;

export const PropertiesPanel: React.FC = () => {
  const { t } = useTranslation();
  const project = useEditorStore((state) => state.project);
  const catalog = useEditorStore((state) => state.catalog);
  const lengthUnit = useEditorStore((state) => state.lengthUnit);
  const selectedIds = useEditorStore((state) => state.selectedIds);
  const updatePlacement = useEditorStore((state) => state.updatePlacement);
  const duplicateSelected = useEditorStore((state) => state.duplicateSelected);
  const removeSelected = useEditorStore((state) => state.removeSelected);
  const toggleLockSelected = useEditorStore((state) => state.toggleLockSelected);
  const setLengthUnit = useEditorStore((state) => state.setLengthUnit);

  const selectedPlacement = project?.placements.find((placement) => placement.instanceId === selectedIds[0]);
  const module = selectedPlacement
    ? catalog.find((entry) => entry.sku === selectedPlacement.moduleSku)
    : undefined;

  if (!project) {
    return null;
  }

  return (
    <Panel
      title={t('properties.title')}
      className="app-properties"
      footer={
        module && selectedPlacement ? (
          <div className="properties-actions">
            <Button
              variant="secondary"
              icon={<IconDuplicate />}
              onClick={() => duplicateSelected()}
            >
              {t('properties.duplicate')}
            </Button>
            <Button variant="secondary" icon={<IconTrash />} onClick={() => removeSelected()}>
              {t('properties.delete')}
            </Button>
            <Button
              variant="secondary"
              icon={selectedPlacement.locked ? <IconUnlock /> : <IconLock />}
              onClick={() => toggleLockSelected(!selectedPlacement.locked)}
            >
              {selectedPlacement.locked ? t('properties.unlock') : t('properties.lock')}
            </Button>
          </div>
        ) : null
      }
    >
      {!selectedPlacement || !module ? (
        <p>{t('properties.noSelection')}</p>
      ) : (
        <div className="scrollbar-thin" style={{ maxHeight: '100%', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <Badge tone="default">{module.sku}</Badge>
          <Field label={t('properties.position')}>
            <div className="properties-grid">
              {(['x', 'y', 'z'] as const).map((axis, index) => (
                <NumberInput
                  key={axis}
                  aria-label={`${t('properties.position')} ${axis}`}
                  value={convertFromMillimetres(selectedPlacement.position_mm[index], lengthUnit).toFixed(2)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    const next = [...selectedPlacement.position_mm] as [number, number, number];
                    next[index] = convertToMillimetres(value, lengthUnit);
                    updatePlacement(selectedPlacement.instanceId, { position_mm: next });
                  }}
                />
              ))}
            </div>
          </Field>
          <Field label={t('properties.rotation')}>
            <div className="properties-grid">
              {(['x', 'y', 'z'] as const).map((axis, index) => (
                <NumberInput
                  key={axis}
                  aria-label={`${t('properties.rotation')} ${axis}`}
                  value={selectedPlacement.rotation_deg[index].toFixed(1)}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    const next = [...selectedPlacement.rotation_deg] as [number, number, number];
                    next[index] = value;
                    updatePlacement(selectedPlacement.instanceId, { rotation_deg: next });
                  }}
                />
              ))}
            </div>
          </Field>
          <Field label={t('properties.locked')} inline>
            <Checkbox
              checked={selectedPlacement.locked}
              onChange={(event) => toggleLockSelected(event.target.checked)}
            />
          </Field>
          <Field label={t('properties.group')}>
            <TextGroup value={selectedPlacement.groupId ?? ''} placementId={selectedPlacement.instanceId} />
          </Field>
          <Field label={t('properties.mass')}>
            <p>{formatMass(module.mass_kg)}</p>
          </Field>
          <Field label="Dimensions">
            <p>{formatLength(module.bbox_mm.length_mm, lengthUnit)}</p>
            <p>{formatLength(module.bbox_mm.width_mm, lengthUnit)}</p>
            <p>{formatLength(module.bbox_mm.height_mm, lengthUnit)}</p>
          </Field>
          <Field label={t('toolbar.units')}>
            <Select
              value={lengthUnit}
              onChange={(event) => setLengthUnit(event.target.value as LengthUnit)}
            >
              <option value="mm">{t('toolbar.units.mm')}</option>
              <option value="in">{t('toolbar.units.in')}</option>
            </Select>
          </Field>
          {module.tags && module.tags.length > 0 && (
            <Field label={t('catalog.tags')}>
              <div className="unit-selector">
                {module.tags.map((tag) => (
                  <Chip key={tag}>{tag}</Chip>
                ))}
              </div>
            </Field>
          )}
        </div>
      )}
    </Panel>
  );
};

interface TextGroupProps {
  readonly value: string;
  readonly placementId: string;
}

const TextGroup: React.FC<TextGroupProps> = ({ value, placementId }) => {
  const updatePlacement = useEditorStore((state) => state.updatePlacement);
  return (
    <input
      className="aui-input"
      value={value}
      onChange={(event) => updatePlacement(placementId, { groupId: event.target.value })}
      placeholder="A"
    />
  );
};
