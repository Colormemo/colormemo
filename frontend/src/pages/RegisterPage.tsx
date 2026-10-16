/**
 * Регистрация. Задача 33 по лабе 4, серверная часть за Володиной.
 */

import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function RegisterPage() {
  return (
    <section className="page page--narrow">
      <h1>Регистрация</h1>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          // TODO (задача 33): отправка на /api/auth/register после готовности ручки
        }}
      >
        <label className="field">
          Логин
          <input name="login" type="text" autoComplete="username" required minLength={3} />
        </label>

        <label className="field">
          Пароль
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </label>

        <button type="submit" className="primary" disabled>
          Зарегистрироваться
        </button>

        <p className="form__note">
          Регистрация заработает после подключения авторизации на сервере.
        </p>
      </form>

      <p>
        Уже есть аккаунт? <Link to={ROUTES.login}>Войти</Link>
      </p>
    </section>
  );
}
