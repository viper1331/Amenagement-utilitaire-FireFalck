import React from 'react';
import { clsx } from 'clsx';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  readonly tone?: BadgeTone;
  readonly icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'default', icon, className, children, ...rest }) => (
  <span className={clsx('aui-badge', `aui-badge--${tone}`, className)} {...rest}>
    {icon && <span className="aui-badge__icon" aria-hidden>{icon}</span>}
    <span>{children}</span>
  </span>
);
