import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './Icon';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Width in px; default 640. */
  width?: number;
  /** Disable overlay-click closure (for destructive confirmations). */
  disableOverlayClose?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 640,
  disableOverlayClose = false,
}: ModalProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const previousActive = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previousActive.current = document.activeElement as HTMLElement;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Tab') {
        const focusable = containerRef.current?.querySelectorAll<HTMLElement>(
          'a, button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const list = Array.from(focusable).filter(
          (el) => !el.hasAttribute('disabled')
        );
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', onKey);
    // Начальный фокус — на заголовок диалога (а не на «Закрыть»/первую кнопку).
    setTimeout(() => {
      headingRef.current?.focus();
    }, 10);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previousActive.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="presentation"
      onMouseDown={(e) => {
        if (disableOverlayClose) return;
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(11, 17, 23, 0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        zIndex: 100,
        padding: '60px 16px 40px',
        overflowY: 'auto',
      }}
    >
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        style={{
          background: 'var(--color-background-surface)',
          borderRadius: 16,
          width: '100%',
          maxWidth: width,
          boxShadow: '0 24px 48px rgba(11, 17, 23, 0.2)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '24px 24px 16px',
            gap: 16,
          }}
        >
          <div style={{ flex: 1 }}>
            <h3
              ref={headingRef}
              tabIndex={-1}
              style={{ margin: 0, fontSize: 22, fontWeight: 600, lineHeight: 1.2, outline: 'none' }}
            >
              {title}
            </h3>
            {subtitle && (
              <div
                style={{
                  marginTop: 4,
                  fontSize: 14,
                  color: 'var(--color-text-secondary)',
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            style={{
              color: 'var(--color-text-secondary)',
              padding: 4,
              display: 'inline-flex',
            }}
          >
            <Icon name="24-actions-close" size={24} />
          </button>
        </header>
        <div style={{ padding: '0 24px 24px' }}>{children}</div>
        {footer && (
          <footer
            style={{
              padding: '16px 24px 24px',
              borderTop: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'flex-start',
              gap: 12,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body
  );
}
