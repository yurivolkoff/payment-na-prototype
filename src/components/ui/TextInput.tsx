import React from 'react';

export interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  helperText?: React.ReactNode;
  error?: string | null;
}

export function TextInput({
  label,
  helperText,
  error,
  id,
  style,
  ...rest
}: TextInputProps) {
  const inputId = id || React.useId();
  return (
    <label htmlFor={inputId} style={{ display: 'block' }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      <input
        id={inputId}
        {...rest}
        style={{
          display: 'block',
          width: '100%',
          background: error ? 'var(--color-error-50)' : 'var(--color-background-surface-subtle)',
          border: error ? '1px solid var(--color-error-500)' : '1px solid transparent',
          borderRadius: 12,
          padding: '12px 14px',
          fontSize: 15,
          color: 'var(--color-text-primary)',
          outline: 'none',
          ...style,
        }}
      />
      {error ? (
        <div style={{ marginTop: 6, color: 'var(--color-error-700)', fontSize: 13 }}>
          {error}
        </div>
      ) : helperText ? (
        <div style={{ marginTop: 6, color: 'var(--color-text-secondary)', fontSize: 13 }}>
          {helperText}
        </div>
      ) : null}
    </label>
  );
}
