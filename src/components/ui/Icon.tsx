import React from 'react';

/**
 * CSS-mask based icon. Inherits color from `currentColor` so any wrapper
 * can recolor it via `color: var(--color-...)`.
 */
export interface IconProps {
  name: string;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  ['aria-hidden']?: boolean;
  title?: string;
}

export function Icon({
  name,
  size = 24,
  className,
  style,
  ['aria-hidden']: ariaHidden = true,
  title,
}: IconProps): React.ReactElement {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const url = `${base}/assets/icons/${name}.svg`;
  return (
    <span
      role={title ? 'img' : undefined}
      aria-hidden={ariaHidden}
      aria-label={title}
      className={`icon-mask${className ? ' ' + className : ''}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${url})`,
        maskImage: `url(${url})`,
        ...style,
      }}
    />
  );
}
