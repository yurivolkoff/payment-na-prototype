import React from 'react';
import type { SavedProfile } from '../../lib/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { formatMoney } from '../../lib/format';

export interface SavedPaymentCardProps {
  profile: SavedProfile;
  onPay: () => void;
  onDelete: () => void;
}

function declCount(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} счёт`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} счёта`;
  return `${n} счетов`;
}

/** Карточка профиля в блоке «Оплатить снова» (Главная, кэш). Компактная одна строка. */
export function SavedPaymentCard({ profile, onPay, onDelete }: SavedPaymentCardProps): React.ReactElement {
  return (
    <Card
      padding={16}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {profile.address.apartmentTitle}
        </div>
        <div
          style={{
            marginTop: 4,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-text-muted)',
            flexWrap: 'wrap',
          }}
        >
          <span>{declCount(profile.docs.length)}</span>
          <span>·</span>
          <span className="num-mono">
            В прошлый раз: {formatMoney(profile.lastPaidTotal)} · {profile.lastPaidPeriod}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <Button variant="primary" onClick={onPay}>
          Перейти к оплате
        </Button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Удалить сохранённые счета"
          title="Удалить"
          className="icon-btn"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Icon name="24-editor-trash" size={20} />
        </button>
      </div>
    </Card>
  );
}
