/**
 * Вход в аккаунт. Задача 33 по лабе 4 (совместная), серверная часть
 * за Володиной. Пока форма размечена, но не отправляется:
 * ручки /api/auth/login ещё нет.
 */

import { Link } from 'react-router-dom';

import { ROUTES } from '../routes';

export function LoginPage() {
  return (
    <section className="page page--narrow">
      <h1>Вход</h1>

      <form
        className="form"
        onSubmit={(event) => {
          event.preventDefault();
          // TODO (задача 33): отправка на /api/auth/login после готовности ручки
        }}
      >
        <label className="field">
          Логин
          <input name="login" type="text" autoComplete="username" required />
        </label>

        <label className="field">
          Пароль
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        <button type="submit" className="primary" disabled>
          Войти
        </button>

        <p className="form__note">Вход заработает после подключения авторизации на сервере.</p>
      </form>

      <p>
        Нет аккаунта? <Link to={ROUTES.register}>Зарегистрироваться</Link>
      </p>
    </section>
  );
}
