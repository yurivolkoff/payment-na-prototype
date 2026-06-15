import React from 'react';
import { Icon } from './Icon';

export interface BackLinkProps {
  onClick: () => void;
  label?: string;
}

export function BackLink({ onClick, label = 'Назад' }: BackLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        color: 'var(--color-text-link)',
        fontSize: 14,
        fontWeight: 500,
        padding: '4px 0',
      }}
    >
      <Icon name="24-navigation-chevron-left" size={20} />
      {label}
    </button>
  );
}
