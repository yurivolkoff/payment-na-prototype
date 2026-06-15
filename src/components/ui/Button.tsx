import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  className,
  style,
  children,
  ...rest
}: ButtonProps): React.ReactElement {
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: size === 'lg' ? 56 : 48,
    padding: size === 'lg' ? '0 24px' : '0 20px',
    borderRadius: 12,
    fontWeight: 500,
    fontSize: 16,
    lineHeight: 1,
    cursor: 'pointer',
    transition: 'background-color .15s, color .15s, border-color .15s',
    minWidth: fullWidth ? '100%' : undefined,
    border: '1px solid transparent',
    whiteSpace: 'nowrap',
  };

  const variantStyle: React.CSSProperties =
    variant === 'primary'
      ? {
          background: 'var(--color-action-primary)',
          color: 'var(--color-text-on-action)',
        }
      : variant === 'secondary'
        ? {
            background: 'var(--color-action-secondary-fill)',
            color: 'var(--color-action-secondary-text)',
          }
        : {
            background: 'transparent',
            color: 'var(--color-text-link)',
            padding: 0,
            height: 'auto',
          };

  const disabledStyle: React.CSSProperties = rest.disabled
    ? variant === 'primary'
      ? {
          background: 'var(--color-disabled)',
          color: 'var(--color-text-on-action)',
          cursor: 'not-allowed',
        }
      : { opacity: 0.4, cursor: 'not-allowed' }
    : {};

  const variantClass = `btn-${variant}`;

  return (
    <button
      {...rest}
      className={className ? `${variantClass} ${className}` : variantClass}
      style={{ ...base, ...variantStyle, ...disabledStyle, ...style }}
    >
      {children}
    </button>
  );
}
