import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestShell } from '../components/layout/GuestShell';
import { Card } from '../components/ui/Card';
import { TextInput } from '../components/ui/TextInput';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { SavedPaymentCard } from '../components/payment/SavedPaymentCard';
import { useStore } from '../lib/store';
import { findHomeDocByAccount, ADDRESS_SUGGESTIONS } from '../lib/seed';
import type { AddressInfo } from '../lib/types';

const LS_HELPER =
  'Лицевой счёт — до 15 знаков. Единый лицевой счёт (ЕЛС) — 10 знаков, 3-й и 4-й — буквы. Например: 75HE533315';

/** Есть ли в адресе указание квартиры. */
function hasApartment(address: string): boolean {
  const a = address.toLowerCase();
  // NB: JS \b/\w не работают с кириллицей без флага u — поэтому без \b.
  // Совпадает с parseAddress: «кв. 48», «кв 48», «квартира 48», «пом. 5», «помещение».
  return /кв\.?\s*№?\s*\d+|квартир|пом\.?\s*№?\s*\d+|помещени/.test(a);
}

/** Извлечь короткую подпись квартиры/помещения и адрес без неё. */
function parseAddress(raw: string): AddressInfo {
  const full = raw.trim();
  // Синхронизировано с hasApartment: ловим «кв./квартира N» и «пом./помещение N».
  const m = full.match(
    /(кв\.?\s*№?\s*\d+|квартира\s*№?\s*\d+|пом\.?\s*№?\s*\d+|помещение\s*№?\s*\d+)/i
  );
  let aptTitle = 'Квартира';
  if (m) {
    const num = (m[0].match(/\d+/) || [''])[0];
    const isPom = /^пом|^помещ/i.test(m[0].trim());
    aptTitle = `${isPom ? 'Помещение' : 'Квартира'} ${num}`;
  }
  const street = m ? full.replace(m[0], '').replace(/^[\s,]+|[\s,]+$/g, '') : full;
  return { full, apartmentTitle: aptTitle, street };
}

export function HomeScreen(): React.ReactElement {
  const navigate = useNavigate();
  const startSession = useStore((s) => s.startSession);
  const profiles = useStore((s) => s.profiles);
  const restoreFromProfile = useStore((s) => s.restoreFromProfile);
  const deleteProfile = useStore((s) => s.deleteProfile);

  const [address, setAddress] = useState('');
  const [account, setAccount] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addrOpen, setAddrOpen] = useState(false);

  const addrQuery = address.trim().toLowerCase();
  const addrMatches = (
    addrQuery ? ADDRESS_SUGGESTIONS.filter((s) => s.toLowerCase().includes(addrQuery)) : ADDRESS_SUGGESTIONS
  ).slice(0, 6);

  const onFind = () => {
    if (isPending) return;
    setIsPending(true);
    try {
      let ok = true;
      if (address.trim().length === 0) {
        setAddressError('Укажите адрес квартиры');
        ok = false;
      } else if (!hasApartment(address)) {
        setAddressError('Добавьте номер квартиры в адрес');
        ok = false;
      } else {
        setAddressError(null);
      }

      if (account.trim().length === 0) {
        setAccountError('Укажите номер лицевого счёта');
        ok = false;
      } else {
        setAccountError(null);
      }

      if (!ok) return;

      // Принимаем любой номер лицевого счёта без проверки (демо).
      const doc = findHomeDocByAccount(account.trim());
      const addr = parseAddress(address);
      startSession(addr, [doc]);
      navigate('/oplata');
    } finally {
      setIsPending(false);
    }
  };

  return (
    <GuestShell>
      {/* Hero */}
      <Card
        variant="accent"
        padding={48}
        style={{
          color: 'var(--color-text-primary)',
          background:
            'linear-gradient(135deg, #2C50E6 0%, #2341C1 100%)',
          marginBottom: 24,
        }}
      >
        <h1
          style={{
            margin: 0,
            color: '#fff',
            fontSize: 56,
            fontWeight: 600,
            lineHeight: 1.05,
            letterSpacing: '-1px',
            maxWidth: 620,
          }}
        >
          Узнайте всё о любом доме в России
        </h1>
        <div style={{ marginTop: 24, display: 'flex', gap: 48, color: 'rgba(255,255,255,0.85)' }}>
          <div>
            <div className="num-mono" style={{ fontSize: 36, fontWeight: 600, color: '#fff' }}>156</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Тысяч управляющих организаций</div>
          </div>
          <div>
            <div className="num-mono" style={{ fontSize: 36, fontWeight: 600, color: '#fff' }}>11 234</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Тысяч многоквартирных домов</div>
          </div>
          <div>
            <div className="num-mono" style={{ fontSize: 36, fontWeight: 600, color: '#fff' }}>1 378</div>
            <div style={{ fontSize: 13, marginTop: 4 }}>Тысяч жилых домов</div>
          </div>
        </div>
      </Card>

      {/* Блок поиска */}
      <Card padding={40} style={{ marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 32, fontWeight: 600, letterSpacing: '-0.5px' }}>
          Найти и оплатить коммунальные услуги
        </h2>
        <p style={{ margin: '12px 0 24px', fontSize: 16, color: 'var(--color-text-secondary)', maxWidth: 720 }}>
          Укажите адрес квартиры и номер лицевого счёта с любой квитанции — найдите и оплатите все
          начисления по квартире
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          <TextInput
            label="Номер лицевого счёта"
            placeholder="Введите номер"
            value={account}
            error={accountError}
            helperText={LS_HELPER}
            onChange={(e) => setAccount(e.target.value)}
          />
          <div style={{ position: 'relative' }}>
            <TextInput
              label="Адрес квартиры"
              placeholder="Город, улица, дом, квартира"
              value={address}
              error={addressError}
              autoComplete="off"
              onChange={(e) => {
                setAddress(e.target.value);
                setAddressError(null);
                setAddrOpen(true);
              }}
              onFocus={() => setAddrOpen(true)}
              onBlur={() => window.setTimeout(() => setAddrOpen(false), 120)}
            />
            {addrOpen && addrMatches.length > 0 && (
              <ul className="suggest-list" role="listbox" aria-label="Подсказки адреса">
                {addrMatches.map((s) => (
                  <li
                    key={s}
                    role="option"
                    aria-selected={false}
                    className="suggest-item"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAddress(s);
                      setAddressError(null);
                      setAddrOpen(false);
                    }}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={onFind}
          disabled={isPending}
          style={{ marginTop: 24 }}
        >
          Найти
        </Button>
      </Card>

      {/* Блок кэша «Оплатить снова» */}
      {profiles.length > 0 && (
        <Card padding={32} style={{ marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 600 }}>Оплатить снова</h2>
          <p style={{ margin: '8px 0 20px', fontSize: 15, color: 'var(--color-text-secondary)' }}>
            Ваши счета сохранены — повторите оплату без повторного ввода
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {profiles.map((p) => (
              <SavedPaymentCard
                key={p.id}
                profile={p}
                onPay={() => {
                  restoreFromProfile(p.id);
                  navigate('/oplata');
                }}
                onDelete={() => setDeleteId(p.id)}
              />
            ))}
          </div>
        </Card>
      )}

      <Modal
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        title="Удалить сохранённые счета?"
        disableOverlayClose
        width={440}
        footer={
          <>
            <Button
              variant="primary"
              onClick={() => {
                if (deleteId) deleteProfile(deleteId);
                setDeleteId(null);
              }}
            >
              Удалить
            </Button>
            <Button variant="secondary" onClick={() => setDeleteId(null)}>
              Отмена
            </Button>
          </>
        }
      >
        <div style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--color-text-secondary)' }}>
          Набор счетов по этой квартире сохранён на этом устройстве. После удаления блок «Оплатить
          снова» исчезнет — счета нужно будет добавить заново.
        </div>
      </Modal>

      {/* Полезные статьи (декоративно) */}
      <h2 style={{ margin: '8px 0 16px', fontSize: 28, fontWeight: 600 }}>Полезные статьи</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {[
          'В каких случаях нужна субсидия на оплату ЖКУ',
          'Как изменить платёжные документы',
          'Что нужно знать о капитальном ремонте',
          'Новая тарифная сетка коммунальных услуг',
          'Как обжаловать начисления',
          'Зачем передавать показания счётчиков',
          'Как сменить управляющую компанию',
          'Что такое прямые договоры с ресурсниками',
        ].map((title) => (
          <Card key={title} padding={20} style={{ minHeight: 140 }}>
            <div style={{ fontSize: 15, fontWeight: 500, lineHeight: 1.3 }}>{title}</div>
            <div style={{ marginTop: 8, fontSize: 13, color: 'var(--color-text-secondary)' }}>
              Подробно о том, как это работает в системе ЖКХ.
            </div>
          </Card>
        ))}
      </div>

      {/* Промо МП (декоративно) */}
      <Card
        padding={40}
        style={{
          background: 'linear-gradient(135deg, #E3E9FF 0%, #D2DBFE 100%)',
          marginBottom: 8,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28, fontWeight: 600 }}>Госуслуги.Дом у вас в телефоне</h2>
        <p style={{ margin: '12px 0 0', fontSize: 16, color: 'var(--color-text-secondary)', maxWidth: 620 }}>
          Оплачивайте ЖКУ, передавайте показания и решайте вопросы с управляющей компанией в одном
          приложении.
        </p>
      </Card>
    </GuestShell>
  );
}
