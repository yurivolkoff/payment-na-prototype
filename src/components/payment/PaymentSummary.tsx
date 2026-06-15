import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatMoney } from '../../lib/format';

export interface PaymentSummaryProps {
  total: number;
  selectedCount: number;
  onPay: () => void;
}

/** Sticky-сайдбар «К оплате» + [Оплатить]. */
export function PaymentSummary({ total, selectedCount, onPay }: PaymentSummaryProps): React.ReactElement {
  const disabled = selectedCount === 0;
  return (
    <div className="pay-summary">
      <Card padding={24}>
        <div style={{ fontSize: 14, color: 'var(--color-text-secondary)', lineHeight: 1.35 }}>
          К оплате с учётом задолженности и переплаты
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
      </Card>
    </div>
  );
}
