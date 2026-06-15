import { useNavigate } from 'react-router-dom';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { notImplemented } from '../../lib/toast';

const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

/**
 * Guest-вариант шапки для неавторизованной зоны:
 * лого + «Оплата ЖКУ» + поиск + [Войти]. User-chip отсутствует.
 */
export function AppHeader() {
  const navigate = useNavigate();
  return (
    <header
      style={{
        background: 'var(--color-background-surface)',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 16px',
        }}
      >
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="Госуслуги.Дом — на главную"
          style={{ display: 'inline-flex' }}
        >
          <img
            src={`${base}/assets/logos/gosuslugi-dom.svg`}
            alt="Госуслуги.Дом"
            height={36}
          />
        </button>
        <img
          src={`${base}/assets/logos/gis-zhkh.svg`}
          alt="Государственная информационная система ЖКХ"
          height={36}
        />
        <span
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 24,
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="link-hover"
            style={{
              color: 'var(--color-text-primary)',
              fontSize: 15,
              fontWeight: 500,
            }}
          >
            Оплата ЖКУ
          </button>
          <button
            type="button"
            onClick={notImplemented}
            aria-label="Поиск"
            className="icon-btn"
            style={{ color: 'var(--color-text-primary)', display: 'inline-flex' }}
          >
            <Icon name="search" size={22} />
          </button>
          <Button variant="primary" onClick={notImplemented} style={{ height: 44 }}>
            Войти
          </Button>
        </span>
      </div>
    </header>
  );
}
