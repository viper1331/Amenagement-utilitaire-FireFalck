import React from 'react';
import { clsx } from 'clsx';

interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly label: string;
  readonly htmlFor?: string;
  readonly inline?: boolean;
  readonly hint?: string;
}

export const Field: React.FC<FieldProps> = ({
  label,
  htmlFor,
  inline = false,
  hint,
  className,
  children,
  ...rest
}) => (
  <div className={clsx('aui-field', inline && 'aui-field--inline', className)} {...rest}>
    <label className="aui-field__label" htmlFor={htmlFor}>
      {label}
    </label>
    <div className="aui-field__control">{children}</div>
    {hint && <p className="aui-field__hint">{hint}</p>}
  </div>
);

export const TextInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => <input ref={ref} className={clsx('aui-input', className)} {...rest} />,
);
TextInput.displayName = 'TextInput';

export const NumberInput = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input ref={ref} type="number" className={clsx('aui-input', className)} {...rest} />
  ),
);
NumberInput.displayName = 'NumberInput';

export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select ref={ref} className={clsx('aui-input', 'aui-input--select', className)} {...rest}>
      {children}
    </select>
  ),
);
Select.displayName = 'Select';

export const Checkbox: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className, ...rest }) => (
  <label className={clsx('aui-checkbox', className)}>
    <input type="checkbox" {...rest} />
    <span className="aui-checkbox__shape" aria-hidden />
  </label>
);
