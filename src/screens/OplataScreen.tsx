import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestShell } from '../components/layout/GuestShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { BackLink } from '../components/ui/BackLink';
import { Modal } from '../components/ui/Modal';
import { PaymentDocCard } from '../components/payment/PaymentDocCard';
import { PaymentSummary } from '../components/payment/PaymentSummary';
import { useStore } from '../lib/store';
import { findDocByAccount } from '../lib/seed';
import { formatMoney } from '../lib/format';

const LS_HELPER =
  'Лицевой счёт — до 15 знаков. Единый лицевой счёт (ЕЛС) — 10 знаков, 3-й и 4-й — буквы. Например: 75HE533315';

export function OplataScreen(): React.ReactElement {
  const navigate = useNavigate();
  const session = useStore((s) => s.session);
  const toggleSelected = useStore((s) => s.toggleSelected);
  const addDoc = useStore((s) => s.addDoc);
  const savePaidProfile = useStore((s) => s.savePaidProfile);
  // selectedTotal / selectedCount пересчитываются при каждом рендере (зависят от session).
  const selectedTotal = useStore((s) => s.selectedTotal);
  const selectedCount = useStore((s) => s.selectedCount);

  const [accountInput, setAccountInput] = useState('');
  const [findError, setFindError] = useState<string | null>(null);
  const [paidOpen, setPaidOpen] = useState(false);
  const [isFinding, setIsFinding] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  // Inline-строка добавления счёта свёрнута по умолчанию.
  const [addOpen, setAddOpen] = useState(false);

  // Если зашли напрямую без сессии — вернуть на Главную.
  useEffect(() => {
    if (!session.address) navigate('/', { replace: true });
  }, [session.address, navigate]);

  if (!session.address) return <GuestShell>{null}</GuestShell>;

  const total = selectedTotal();
  const count = selectedCount();
  // Итог всех начислений по квартире (справочно, в шапке карточки) — отличается от «К оплате».
  const accruedTotal = session.docs.reduce((sum, d) => sum + d.amount, 0);

  const onAddAccount = () => {
    if (isFinding) return;
    setIsFinding(true);
    try {
      const value = accountInput.trim();
      if (value.length === 0) {
        setFindError('Укажите номер лицевого счёта');
        return;
      }
      // Любой номер принимается — findDocByAccount никогда не возвращает null.
      const doc = findDocByAccount(value);
      const added = addDoc(doc);
      if (!added) {
        setFindError('Этот счёт уже добавлен');
        return;
      }
      // Появление строки в списке — само по себе подтверждение.
      setAccountInput('');
      setFindError(null);
    } finally {
      setIsFinding(false);
    }
  };

  const onPay = () => {
    if (count === 0 || isPaying) return;
    setIsPaying(true);
    try {
      savePaidProfile();
      setPaidOpen(true);
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <GuestShell>
      <BackLink onClick={() => navigate('/')} />
      <h1 className="screen-title">Оплата</h1>
      <div className="screen-subtitle">{session.period}</div>

      <div className="pay-layout" style={{ marginTop: 24 }}>
        <Card padding={32}>
          {/* Карточка квартиры */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: 24, fontWeight: 600 }}>{session.address.apartmentTitle}</div>
              <div style={{ marginTop: 4, fontSize: 14, color: 'var(--color-text-secondary)' }}>
                {session.address.street}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>Начислено</div>
              <div
                className="num-mono"
                style={{ marginTop: 2, fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap' }}
              >
                {formatMoney(accruedTotal)}
              </div>
            </div>
          </div>

          {/* Шапка таблицы */}
          <div
            style={{
              marginTop: 24,
              paddingBottom: 8,
              borderBottom: '1px solid var(--color-border-subtle)',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 13,
              color: 'var(--color-text-secondary)',
            }}
          >
            <span>Платёжный документ</span>
            <span>Сумма</span>
          </div>

          {/* Список квитанций */}
          {session.docs.map((doc) => (
            <PaymentDocCard
              key={doc.id}
              doc={doc}
              checked={!!session.selected[doc.id]}
              onToggle={() => toggleSelected(doc.id)}
            />
          ))}

          {/* Компактное добавление счёта */}
          <div style={{ marginTop: 28 }}>
            {!addOpen ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setAddOpen(true);
                  setFindError(null);
                }}
              >
                + Добавить ещё счёт
              </Button>
            ) : (
              <div
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: 'var(--color-background-surface-subtle)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1, maxWidth: 420 }}>
                    <TextInput
                      label="Номер лицевого счёта"
                      placeholder="Введите номер"
                      value={accountInput}
                      error={findError}
                      helperText={LS_HELPER}
                      onChange={(e) => {
                        setAccountInput(e.target.value);
                        setFindError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') onAddAccount();
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => {
                      setAddOpen(false);
                      setAccountInput('');
                      setFindError(null);
                    }}
                    style={{
                      marginTop: 24,
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      fontSize: 14,
                      color: 'var(--color-text-link)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Свернуть
                  </button>
                </div>
                <div style={{ marginTop: 16, display: 'flex', gap: 16, alignItems: 'center' }}>
                  <Button variant="primary" onClick={onAddAccount} disabled={isFinding}>
                    Добавить
                  </Button>
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => navigate('/poisk-organizacii')}
                    style={{
                      background: 'transparent',
                      border: 0,
                      padding: 0,
                      fontSize: 14,
                      color: 'var(--color-text-link)',
                      cursor: 'pointer',
                    }}
                  >
                    Не знаю номер — найти по организации
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card>

        <PaymentSummary total={total} selectedCount={count} onPay={onPay} />
      </div>

      <Modal
        open={paidOpen}
        onClose={() => setPaidOpen(false)}
        title="Конец сценария прототипа"
        footer={
          <>
            <Button variant="primary" onClick={() => navigate('/')}>
              На главную
            </Button>
            <Button variant="secondary" onClick={() => setPaidOpen(false)}>
              Остаться
            </Button>
          </>
        }
      >
        <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          <p style={{ margin: 0 }}>
            Дальше — оплата через банк. В прототипе сценарий останавливается здесь.
          </p>
          <p style={{ margin: '12px 0 0' }}>
            Счета сохранятся на этом устройстве — при следующем заходе квартира появится на главной,
            в списке «Ваши квартиры».
          </p>
        </div>
      </Modal>
    </GuestShell>
  );
}
