import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface PopoverProps {
  open: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  children: React.ReactNode;
  width?: number;
}

export function Popover({ open, onClose, anchorRect, children, width = 320 }: PopoverProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      // Anchor click is handled by parent; outside click closes.
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open, onClose]);

  if (!open || !anchorRect) return null;

  const top = anchorRect.bottom + 8;
  const left = Math.max(
    8,
    Math.min(anchorRect.left, window.innerWidth - width - 8)
  );

  return createPortal(
    <div
      ref={ref}
      role="dialog"
      style={{
        position: 'fixed',
        top,
        left,
        width,
        background: 'var(--color-background-surface)',
        border: '1px solid var(--color-border-default)',
        borderRadius: 12,
        padding: 16,
        boxShadow: '0 12px 24px rgba(11, 17, 23, 0.12)',
        zIndex: 200,
        fontSize: 13,
        lineHeight: '18px',
        color: 'var(--color-text-secondary)',
      }}
    >
      {children}
    </div>,
    document.body
  );
}
