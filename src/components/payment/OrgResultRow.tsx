import React from 'react';
import type { OrgResult } from '../../lib/types';
import { Icon } from '../ui/Icon';

export interface OrgResultRowProps {
  org: OrgResult;
  onClick: () => void;
}

/** Строка результата поиска по организации (Экран 3). */
export function OrgResultRow({ org, onClick }: OrgResultRowProps): React.ReactElement {
  return (
    <button type="button" className="org-row" onClick={onClick}>
      <Icon
        name="24-actions-book"
        size={22}
        style={{ color: 'var(--color-text-muted)', marginTop: 2 }}
      />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 500, color: 'var(--color-text-primary)' }}>
          {org.name}
        </div>
        <div className="num-mono" style={{ marginTop: 4, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          ОГРН {org.ogrn}; ИНН {org.inn}; КПП {org.kpp}
        </div>
        <div style={{ marginTop: 2, fontSize: 13, color: 'var(--color-text-secondary)' }}>
          {org.address}
        </div>
      </div>
      <Icon
        name="24-navigation-arrow-right"
        size={22}
        style={{ color: 'var(--color-text-link)', marginTop: 2 }}
      />
    </button>
  );
}
