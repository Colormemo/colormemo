/**
 * Форма логина и пароля — одна на вход и на регистрацию.
 *
 * Проверка полей берётся из общего пакета, той же функцией, что проверяет
 * сервер. Это не замена серверной проверке (клиенту доверять нельзя),
 * а способ показать ошибку сразу, не гоняя запрос ради «пароль короткий».
 */

import { useState, type FormEvent } from 'react';

import { PASSWORD_MIN_LENGTH, validateLogin, validatePassword } from '@colormemo/shared';

interface Props {
  /** Подпись кнопки отправки. */
  submitLabel: string;
  /** Проверять ли поля до отправки. На входе не нужно: правила могли измениться. */
  validate: boolean;
  onSubmit(login: string, password: string): Promise<void>;
}

export function CredentialsForm({ submitLabel, validate, onSubmit }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (validate) {
      const problem = validateLogin(login.trim()) ?? validatePassword(password);
      if (problem) {
        setError(problem);
        return;
      }
    }

    setBusy(true);
    try {
      await onSubmit(login.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось отправить данные');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={handleSubmit} noValidate>
      {error && (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      )}

      <label className="field">
        <span className="field__label">Логин</span>
        <input
          name="login"
          type="text"
          autoComplete="username"
          placeholder="например, masha"
          value={login}
          onChange={(event) => setLogin(event.target.value)}
          required
        />
        {/*
          Подсказка стоит под своим полем, а не под паролем: иначе человек
          читает правило про логин как требование к паролю и не понимает,
          что именно не так. На этом спотыкались при проверке.
        */}
        {validate && (
          <span className="field__hint">
            Не почта, а придуманное имя: латинские буквы, цифры, дефис и подчёркивание.
          </span>
        )}
      </label>

      <label className="field">
        <span className="field__label">Пароль</span>
        <input
          name="password"
          type="password"
          autoComplete={validate ? 'new-password' : 'current-password'}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        {validate && <span className="field__hint">Не короче {PASSWORD_MIN_LENGTH} символов.</span>}
      </label>

      <button type="submit" className="button" disabled={busy}>
        {busy ? 'Отправляем…' : submitLabel}
      </button>
    </form>
  );
}
