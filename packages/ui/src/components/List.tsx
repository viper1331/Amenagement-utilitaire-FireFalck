import React from 'react';
import { clsx } from 'clsx';

export interface ListItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly title: string;
  readonly subtitle?: string;
  readonly metadata?: React.ReactNode;
  readonly icon?: React.ReactNode;
  readonly selected?: boolean;
}

export const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  metadata,
  icon,
  selected,
  className,
  ...rest
}) => (
  <button
    type="button"
    className={clsx('aui-list-item', selected && 'aui-list-item--selected', className)}
    {...rest}
  >
    {icon && <span className="aui-list-item__icon" aria-hidden>{icon}</span>}
    <span className="aui-list-item__content">
      <span className="aui-list-item__title">{title}</span>
      {subtitle && <span className="aui-list-item__subtitle">{subtitle}</span>}
    </span>
    {metadata && <span className="aui-list-item__meta">{metadata}</span>}
  </button>
);

export interface ListSectionProps {
  readonly title: string;
  readonly actions?: React.ReactNode;
  readonly children: React.ReactNode;
}

export const ListSection: React.FC<ListSectionProps> = ({ title, actions, children }) => (
  <div className="aui-list-section">
    <header className="aui-list-section__header">
      <span>{title}</span>
      {actions}
    </header>
    <div className="aui-list-section__body">{children}</div>
  </div>
);
