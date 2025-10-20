import React from 'react';
import { clsx } from 'clsx';

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly left?: React.ReactNode;
  readonly right?: React.ReactNode;
}

export const Toolbar: React.FC<ToolbarProps> = ({ left, right, className, children, ...rest }) => (
  <header className={clsx('aui-toolbar', className)} {...rest}>
    <div className="aui-toolbar__segment">{left}</div>
    <div className="aui-toolbar__content">{children}</div>
    <div className="aui-toolbar__segment aui-toolbar__segment--right">{right}</div>
  </header>
);
