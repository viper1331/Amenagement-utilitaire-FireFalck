import React from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'secondary' | 'ghost';
  readonly icon?: React.ReactNode;
  readonly active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  icon,
  children,
  className,
  active,
  ...rest
}) => {
  return (
    <button
      type="button"
      className={clsx(
        'aui-button',
        `aui-button--${variant}`,
        active && 'aui-button--active',
        className,
      )}
      {...rest}
    >
      {icon && <span className="aui-button__icon" aria-hidden>{icon}</span>}
      {children && <span className="aui-button__label">{children}</span>}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly label: string;
  readonly icon: React.ReactNode;
  readonly active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({ label, icon, active, className, ...rest }) => (
  <button
    type="button"
    className={clsx('aui-icon-button', active && 'aui-icon-button--active', className)}
    aria-label={label}
    title={label}
    {...rest}
  >
    <span aria-hidden className="aui-icon-button__icon">
      {icon}
    </span>
    <span className="visually-hidden">{label}</span>
  </button>
);

export interface ToggleButtonGroupOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface ToggleButtonGroupProps<T extends string>
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  readonly options: readonly ToggleButtonGroupOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
}

export const ToggleButtonGroup = <T extends string>({
  options,
  value,
  onChange,
  className,
  ...rest
}: ToggleButtonGroupProps<T>) => (
  <div className={clsx('aui-toggle-group', className)} role="group" {...rest}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        className={clsx('aui-toggle-group__item', option.value === value && 'aui-toggle-group__item--active')}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
