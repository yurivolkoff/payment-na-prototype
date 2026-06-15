import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GuestShell } from '../components/layout/GuestShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { BackLink } from '../components/ui/BackLink';
import { useStore } from '../lib/store';
import { seedOrgs, nextDocId } from '../lib/seed';

const LS_HELPER =
  'Лицевой счёт — до 15 знаков. Единый лицевой счёт (ЕЛС) — 10 знаков, 3-й и 4-й — буквы. Например: 75HE533315';

export function OrgCardScreen(): React.ReactElement {
  const navigate = useNavigate();
  const { orgId } = useParams<{ orgId: string }>();
  const session = useStore((s) => s.session);
  const addDoc = useStore((s) => s.addDoc);

  const org = seedOrgs.find((o) => o.id === orgId);

  const [account, setAccount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  // Без сессии (адреса с Главной) — на Главную.
  useEffect(() => {
    if (!session.address) navigate('/', { replace: true });
  }, [session.address, navigate]);

  if (!org || !session.address) return <GuestShell>{null}</GuestShell>;

  const addr = session.address;

  const onContinue = () => {
    if (isPending) return;
    setIsPending(true);
    try {
      if (account.trim().length === 0) {
        setError('Укажите номер лицевого счёта');
        return;
      }
      const added = addDoc({ ...org.doc, id: nextDocId(), account: account.trim() });
      if (!added) {
        setError('Этот счёт уже добавлен');
        return;
      }
      navigate('/oplata');
    } finally {
      setIsPending(false);
    }
  };

  const apartmentTitle = addr.apartmentTitle;

  return (
    <GuestShell>
      <BackLink onClick={() => navigate('/poisk-organizacii')} />
      <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Оплата · {apartmentTitle} → Добавить счёт
      </div>
      <h1 className="screen-title" style={{ fontSize: 48 }}>
        {org.name}
      </h1>

      <Card padding={32} style={{ marginTop: 24, maxWidth: 920 }}>
        <div style={{ paddingBottom: 24, borderBottom: '1px solid var(--color-border-subtle)' }}>
          <div style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>Адрес квартиры</div>
          <div style={{ marginTop: 6, fontSize: 18, color: 'var(--color-text-primary)' }}>
            {addr.full}
          </div>
        </div>

        <div style={{ marginTop: 24, maxWidth: 420 }}>
          <TextInput
            label="Номер лицевого счёта"
            placeholder="Введите номер"
            value={account}
            error={error}
            helperText={LS_HELPER}
            onChange={(e) => setAccount(e.target.value)}
          />
        </div>

        <Button variant="primary" onClick={onContinue} disabled={isPending} style={{ marginTop: 24 }}>
          Продолжить
        </Button>
      </Card>
    </GuestShell>
  );
}
