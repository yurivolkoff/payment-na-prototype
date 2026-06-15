import React from 'react';

type Variant = 'base' | 'accent' | 'subtle';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
  /** Internal padding (px). Default 24. */
  padding?: number;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = 'base', padding = 24, className, style, children, ...rest },
  ref
): React.ReactElement {
  const base: React.CSSProperties = {
    borderRadius: 16,
    padding,
    boxShadow: '0 1px 2px rgba(11, 17, 23, 0.04)',
  };

  const variantStyle: React.CSSProperties =
    variant === 'accent'
      ? {
          background:
            'linear-gradient(135deg, #E3E9FF 0%, #DDE5FF 60%, #D2DBFE 100%)',
        }
      : variant === 'subtle'
        ? { background: 'var(--color-background-surface-subtle)' }
        : { background: 'var(--color-background-surface)' };

  return (
    <div ref={ref} {...rest} className={className} style={{ ...base, ...variantStyle, ...style }}>
      {children}
    </div>
  );
});
