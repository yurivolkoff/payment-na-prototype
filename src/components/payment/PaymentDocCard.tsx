import React, { useRef, useState } from 'react';
import type { PaymentDoc } from '../../lib/types';
import { Checkbox } from '../ui/Checkbox';
import { Icon } from '../ui/Icon';
import { Popover } from '../ui/Popover';
import { formatMoney } from '../../lib/format';
import { notImplemented } from '../../lib/toast';

export interface PaymentDocCardProps {
  doc: PaymentDoc;
  checked: boolean;
  onToggle: () => void;
}

const NOT_ISSUED_TEXT =
  'Поставщик ещё не выставил квитанцию за этот период. Оплатить можно будет позже';

/** Строка квитанции: чекбокс, организация, ЛС/услуга, сумма, под-начисления. */
export function PaymentDocCard({ doc, checked, onToggle }: PaymentDocCardProps): React.ReactElement {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const infoRef = useRef<HTMLButtonElement>(null);

  const accountLine = doc.service
    ? `лицевой счёт ${doc.account}; ${doc.service}`
    : `лицевой счёт ${doc.account}`;

  const hasSub = !!doc.subCharges && doc.subCharges.length > 0;
  const reasonId = doc.notIssued ? `not-issued-reason-${doc.id}` : undefined;
  const checkboxAria = hasSub
    ? `Оплатить счёт: ${doc.org} (включает все под-начисления группы)`
    : `Оплатить счёт: ${doc.org}`;

  return (
    <div style={{ paddingBlock: 18, borderBottom: '1px solid var(--color-border-subtle)' }}>
      <div className="doc-row">
        <Checkbox
          checked={checked}
          disabled={doc.notIssued}
          onChange={onToggle}
          aria-label={checkboxAria}
          aria-describedby={reasonId}
        />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
            {doc.org}
          </div>
          <div
            style={{
              marginTop: 4,
              fontSize: 14,
              color: 'var(--color-text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            <span>{doc.notIssued ? `лицевой счёт ${doc.account}; ${doc.service}` : accountLine}</span>
            {doc.notIssued && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span id={reasonId}>поставщик ещё не выставил счёт</span>
                <button
                  ref={infoRef}
                  type="button"
                  aria-label="Почему счёт не выставлен"
                  onClick={() => {
                    setAnchorRect(infoRef.current?.getBoundingClientRect() ?? null);
                    setPopoverOpen((v) => !v);
                  }}
                  style={{ color: 'var(--color-text-secondary)', display: 'inline-flex' }}
                >
                  <Icon name="24-status-information" size={16} />
                </button>
              </span>
            )}
          </div>
          {!doc.notIssued && (
            <button
              type="button"
              onClick={notImplemented}
              className="link-hover"
              style={{
                marginTop: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: 'var(--color-text-link)',
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              Скачать квитанцию
            </button>
          )}
        </div>
        <div className="amount-pill num-mono">{formatMoney(doc.amount)}</div>
      </div>

      {/* Под-начисления — расшифровка, не отдельные счета (отступ под чекбоксом). */}
      {hasSub && (
        <div className="doc-row" style={{ marginTop: 14 }}>
          <span aria-hidden="true" />
          <div
            style={{
              minWidth: 0,
              gridColumn: '2 / span 2',
              paddingLeft: 12,
              borderLeft: '2px solid var(--color-border-subtle)',
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                letterSpacing: '0.2px',
                textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                marginBottom: 8,
              }}
            >
              В том числе
            </div>
            {doc.subCharges!.map((sub) => (
              <div
                key={sub.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  gap: 16,
                  paddingBlock: 6,
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text-primary)' }}>
                    {sub.org}
                  </div>
                  <div style={{ marginTop: 2, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                    {sub.service}
                  </div>
                </div>
                <div
                  className="num-mono"
                  style={{
                    fontSize: 14,
                    color: 'var(--color-text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {formatMoney(sub.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Popover open={popoverOpen} onClose={() => setPopoverOpen(false)} anchorRect={anchorRect} width={300}>
        {NOT_ISSUED_TEXT}
      </Popover>
    </div>
  );
}
