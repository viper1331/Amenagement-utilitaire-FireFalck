import React from 'react';
import { clsx } from 'clsx';

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly title?: string;
  readonly footer?: React.ReactNode;
}

export const Panel: React.FC<PanelProps> = ({ title, footer, children, className, ...rest }) => (
  <section className={clsx('aui-panel', className)} {...rest}>
    {title && (
      <header className="aui-panel__header">
        <h2>{title}</h2>
      </header>
    )}
    <div className="aui-panel__body scrollbar-thin">{children}</div>
    {footer && <footer className="aui-panel__footer">{footer}</footer>}
  </section>
);
