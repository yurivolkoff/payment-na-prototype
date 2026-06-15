import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatMoney } from '../../lib/format';

export interface PaymentSummaryProps {
  total: number;
  selectedCount: number;
  onPay: () => void;
}

/** Маленькая иконка-замок (inline SVG, наследует currentColor). */
function LockGlyph(): React.ReactElement {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Sticky-сайдбар «К оплате» + [Оплатить]. */
export function PaymentSummary({ total, selectedCount, onPay }: PaymentSummaryProps): React.ReactElement {
  const disabled = selectedCount === 0;
  return (
    <div className="pay-summary">
      <Card padding={24}>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
          К оплате
        </div>
        <div
          className="num-mono"
          style={{ marginTop: 8, fontSize: 28, fontWeight: 600, color: 'var(--color-text-primary)' }}
        >
          {formatMoney(total)}
        </div>
        <Button
          variant="primary"
          fullWidth
          disabled={disabled}
          onClick={onPay}
          style={{ marginTop: 20 }}
        >
          Оплатить
        </Button>
        {disabled && (
          <div style={{ marginTop: 10, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Выберите хотя бы один счёт для оплаты
          </div>
        )}
        <div
          style={{
            marginTop: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            lineHeight: 1.4,
            color: 'var(--color-text-muted)',
          }}
        >
          <LockGlyph />
          <span>Оплата через банк-эквайер ВБРР · защищённое соединение</span>
        </div>
      </Card>
    </div>
  );
}
