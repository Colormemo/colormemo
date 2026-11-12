/**
 * Вход в аккаунт. Задача 33 по лабе 4.
 */

import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';

import { CredentialsForm } from '../auth/CredentialsForm';
import { useAuth } from '../auth/AuthContext';
import { ROUTES } from '../routes';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Куда человек шёл до того, как его отправили на вход.
  const from = (location.state as { from?: string } | null)?.from ?? ROUTES.games;

  if (user) return <Navigate to={from} replace />;

  return (
    <section className="page page--narrow">
      <header className="page__head">
        <h1>Вход</h1>
        <p className="page__lead">Чтобы результаты сохранялись и копилась статистика.</p>
      </header>

      <CredentialsForm
        submitLabel="Войти"
        validate={false}
        onSubmit={async (loginName, password) => {
          await login(loginName, password);
          navigate(from, { replace: true });
        }}
      />

      <p className="page__note">
        Нет аккаунта? <Link to={ROUTES.register}>Зарегистрироваться</Link>
      </p>
    </section>
  );
}
