import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import App from '../App';
import '../i18n';
import { useEditorStore } from '../state/useEditorStore';
import { createEmptyProject } from '../services/projectLoader';

describe('App', () => {
  it('renders shell once project is loaded', () => {
    const blueprintId = 'vsav_master_l2h2_etech_2025';
    const project = createEmptyProject({ name: 'Test', vehicleBlueprintId: blueprintId });
    useEditorStore.getState().setProject(project);
    const { getByText } = render(<App />);
    expect(getByText('Mesurer')).toBeInTheDocument();
  });
});
