import React from 'react';
import { createPortal } from 'react-dom';
import { useToastStore } from '../../lib/toast';

export function ToastHost(): React.ReactElement | null {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return createPortal(
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 500,
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          style={{
            background: 'var(--color-neutral-1000)',
            color: '#fff',
            padding: '12px 16px',
            borderRadius: 12,
            fontSize: 14,
            lineHeight: '18px',
            boxShadow: '0 8px 16px rgba(11, 17, 23, 0.2)',
            maxWidth: 360,
          }}
        >
          {t.message}
        </div>
      ))}
    </div>,
    document.body
  );
}
