import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { Button } from '../components/Button';
import { ThemeProvider } from '../theme';

describe('Button', () => {
  it('renders label and icon', () => {
    const { getByText } = render(
      <ThemeProvider>
        <Button icon={<span data-testid="icon" />}>Label</Button>
      </ThemeProvider>,
    );

    expect(getByText('Label')).toBeInTheDocument();
  });
});
