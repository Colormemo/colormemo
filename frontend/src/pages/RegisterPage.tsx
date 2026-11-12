/**
 * Регистрация. Задача 33 по лабе 4.
 *
 * Почта не спрашивается намеренно: подтверждать её нечем, а хранить личные
 * данные без необходимости не стоит. Для тренажёра достаточно логина.
 */

import { Link, Navigate, useNavigate } from 'react-router-dom';

import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';

export function RegisterPage() {
  const { user, register } = useAuth();
  const navigate = useNavigate();

  if (user) return <Navigate to={ROUTES.games} replace />;

  return (
    <section className="page page--narrow">
      <header className="page__head">
        <h1>Регистрация</h1>
        <p className="page__lead">Логин и пароль — больше ничего не нужно.</p>
      </header>

      <CredentialsForm
        submitLabel="Создать аккаунт"
        validate
        onSubmit={async (loginName, password) => {
          await register(loginName, password);
          navigate(ROUTES.games, { replace: true });
        }}
      />

      <p className="page__note">
        Уже есть аккаунт? <Link to={ROUTES.login}>Войти</Link>
      </p>
    </section>
  );
}
