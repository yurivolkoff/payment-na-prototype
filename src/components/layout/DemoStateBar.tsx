import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';

/**
 * Презентационный переключатель состояний Главной для демонстрации прототипа
 * (не продуктовый элемент): «Пустое состояние» (нет сохранённой квартиры) /
 * «С квартирой» (есть сохранённый профиль → saved-first).
 */
export function DemoStateBar(): React.ReactElement {
  const navigate = useNavigate();
  const profiles = useStore((s) => s.profiles);
  const clearProfiles = useStore((s) => s.clearProfiles);
  const seedDemoProfile = useStore((s) => s.seedDemoProfile);
  const filled = profiles.length > 0;

  return (
    <div className="demo-bar">
      <span className="demo-bar__label">Демо прототипа · состояние Главной:</span>
      <div className="demo-seg" role="group" aria-label="Демо-состояния прототипа">
        <button
          type="button"
          className={`demo-seg__btn${!filled ? ' is-active' : ''}`}
          aria-pressed={!filled}
          onClick={() => {
            clearProfiles();
            navigate('/');
          }}
        >
          Пустое состояние
        </button>
        <button
          type="button"
          className={`demo-seg__btn${filled ? ' is-active' : ''}`}
          aria-pressed={filled}
          onClick={() => {
            seedDemoProfile();
            navigate('/');
          }}
        >
          С квартирой
        </button>
      </div>
    </div>
  );
}
