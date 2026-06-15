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

/** Карточка профиля в блоке «Оплатить снова» (Главная, кэш). */
export function SavedPaymentCard({ profile, onPay, onDelete }: SavedPaymentCardProps): React.ReactElement {
  return (
    <Card padding={20} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {profile.address.apartmentTitle}
        </div>
        <div style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-secondary)' }}>
          {profile.address.street}
        </div>
        <div
          style={{
            marginTop: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            flexWrap: 'wrap',
          }}
        >
          <span>{declCount(profile.docs.length)}</span>
          <span>·</span>
          <span className="num-mono">
            Последняя оплата: {formatMoney(profile.lastPaidTotal)} · {profile.lastPaidPeriod}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="primary" onClick={onPay}>
          Оплатить
        </Button>
        <Button
          variant="ghost"
          onClick={onDelete}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)' }}
        >
          <Icon name="24-editor-trash" size={18} />
          Удалить
        </Button>
      </div>
    </Card>
  );
}
