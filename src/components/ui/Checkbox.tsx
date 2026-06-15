import React from 'react';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Доступное имя для скринридеров / тестов. */
  ['aria-label']?: string;
}

/**
 * Кастомный чекбокс UI-кита. Скрытый нативный input + стилизованный box.
 * Стейты (unchecked / checked / hover / disabled / focus) — в global.css (.cb-*).
 */
export function Checkbox({
  checked,
  onChange,
  disabled = false,
  ['aria-label']: ariaLabel,
}: CheckboxProps): React.ReactElement {
  return (
    <label
      style={{
        display: 'inline-flex',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
      }}
    >
      <input
        type="checkbox"
        className="cb-input"
        checked={checked}
        disabled={disabled}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.checked)}
        style={{
          position: 'absolute',
          opacity: 0,
          width: 24,
          height: 24,
          margin: 0,
          cursor: 'inherit',
        }}
      />
      <span className="cb-box" aria-hidden="true">
        {checked && (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path
              d="M11.5 3.5L5.25 10L2.5 7.2"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
    </label>
  );
}
