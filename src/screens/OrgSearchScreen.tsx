import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GuestShell } from '../components/layout/GuestShell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TextInput } from '../components/ui/TextInput';
import { BackLink } from '../components/ui/BackLink';
import { OrgResultRow } from '../components/payment/OrgResultRow';
import { searchOrgs } from '../lib/seed';
import { useStore } from '../lib/store';
import type { OrgResult } from '../lib/types';

export function OrgSearchScreen(): React.ReactElement {
  const navigate = useNavigate();
  const session = useStore((s) => s.session);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<OrgResult[]>(searchOrgs(''));
  const [isSearching, setIsSearching] = useState(false);

  const onSearch = () => {
    if (isSearching) return;
    setIsSearching(true);
    try {
      setResults(searchOrgs(query));
    } finally {
      setIsSearching(false);
    }
  };

  const apartmentTitle = session.address?.apartmentTitle ?? 'Квартира';

  return (
    <GuestShell>
      <BackLink onClick={() => navigate('/oplata')} />
      <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-secondary)' }}>
        Оплата · {apartmentTitle} → Добавить счёт
      </div>
      <h1 className="screen-title" style={{ fontSize: 40 }}>
        Поиск счетов по организации
      </h1>

      <Card padding={32} style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <TextInput
              label="Организация"
              placeholder="Название, ОГРН, ИНН или КПП организации"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSearch();
              }}
            />
          </div>
          <Button variant="primary" onClick={onSearch} disabled={isSearching} style={{ height: 48 }}>
            Найти
          </Button>
        </div>

        <div style={{ marginTop: 16 }}>
          {results.length === 0 ? (
            <div
              style={{
                padding: '32px 0',
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 15,
              }}
            >
              Ничего не нашли. Проверьте название или реквизиты организации
            </div>
          ) : (
            results.map((org) => (
              <OrgResultRow
                key={org.id}
                org={org}
                onClick={() => navigate(`/organizaciya/${org.id}`)}
              />
            ))
          )}
        </div>
      </Card>
    </GuestShell>
  );
}
