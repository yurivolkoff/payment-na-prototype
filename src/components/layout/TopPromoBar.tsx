import { Icon } from '../ui/Icon';
import { notImplemented, useToastStore } from '../../lib/toast';
import { toggleHighContrast } from '../../lib/theme';

const AUDIENCE_TABS = [
  'Жителям',
  'Участникам отрасли',
  'Органам власти',
  'Разработчикам ИС',
];

export function TopPromoBar() {
  return (
    <div
      style={{
        background: 'var(--color-background-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
        fontSize: 12,
        color: 'var(--color-text-secondary)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '8px 16px',
        }}
      >
        <span style={{ display: 'inline-flex', gap: 24 }}>
          {AUDIENCE_TABS.map((label, i) => (
            <button
              type="button"
              key={label}
              onClick={notImplemented}
              className="link-hover"
              style={{
                color: i === 0 ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                fontWeight: i === 0 ? 500 : 400,
              }}
            >
              {label}
            </button>
          ))}
        </span>
        <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 24 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--color-action-primary)',
            }}
          >
            <Icon name="24-entity-internet" size={14} />
            Российская Федерация
          </span>
          <button
            type="button"
            onClick={() => {
              const next = toggleHighContrast();
              useToastStore
                .getState()
                .show(next ? 'Контрастная тема (демо) включена' : 'Контрастная тема (демо) выключена');
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              color: 'var(--color-text-secondary)',
            }}
          >
            <Icon name="16-actions-visually-impaired" size={16} />
            Контрастная тема (демо)
          </button>
          <button type="button" onClick={notImplemented} style={{ color: 'inherit' }}>
            Поддержка
          </button>
          <button type="button" onClick={notImplemented} style={{ color: 'inherit' }}>
            Вернуться на старый сайт
          </button>
        </span>
      </div>
    </div>
  );
}
