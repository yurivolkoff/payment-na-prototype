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

  // Если зашли напрямую без сессии — вернуть на Главную.
  useEffect(() => {
    if (!session.address) navigate('/', { replace: true });
  }, [session.address, navigate]);

  if (!session.address) return <GuestShell>{null}</GuestShell>;

  const total = selectedTotal();
  const count = selectedCount();
  // Итог всех начислений по квартире (справочно, в шапке карточки) — отличается от «К оплате».
  const accruedTotal = session.docs.reduce((sum, d) => sum + d.amount, 0);

  const onFindAccount = () => {
    if (isFinding) return;
    setIsFinding(true);
    try {
      const value = accountInput.trim();
      if (value.length === 0) {
        setFindError('Укажите номер лицевого счёта');
        return;
      }
      const doc = findDocByAccount(value);
      if (!doc) {
        setFindError('Счёт не найден. Проверьте номер или укажите организацию');
        return;
      }
      const added = addDoc(doc);
      if (!added) {
        setFindError('Этот счёт уже добавлен');
        return;
      }
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

          {/* Блок «добавить счёт» */}
          <div style={{ marginTop: 28 }}>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Оплатить несколько счетов</h3>
            <p style={{ margin: '8px 0 16px', fontSize: 15, color: 'var(--color-text-secondary)', maxWidth: 640 }}>
              Добавьте другие счета по этой квартире. Если счёт не находится по номеру — укажите организацию
              из квитанции
            </p>
            <div style={{ maxWidth: 420 }}>
              <TextInput
                label="Номер лицевого счёта"
                placeholder="Введите номер"
                value={accountInput}
                error={findError}
                helperText={LS_HELPER}
                onChange={(e) => setAccountInput(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
              <Button variant="primary" onClick={onFindAccount} disabled={isFinding}>
                Найти счёт
              </Button>
              <Button variant="secondary" onClick={() => navigate('/poisk-organizacii')}>
                Указать организацию
              </Button>
            </div>
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
            Счета сохранятся на этом устройстве — при следующем заходе появится «Оплатить снова».
          </p>
        </div>
      </Modal>
    </GuestShell>
  );
}
