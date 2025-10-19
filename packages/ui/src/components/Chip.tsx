import React from 'react';
import { clsx } from 'clsx';

interface ChipProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly selected?: boolean;
  readonly icon?: React.ReactNode;
}

export const Chip: React.FC<ChipProps> = ({ selected, icon, className, children, ...rest }) => (
  <span className={clsx('aui-chip', selected && 'aui-chip--selected', className)} {...rest}>
    {icon && <span className="aui-chip__icon" aria-hidden>{icon}</span>}
    {children}
  </span>
);
