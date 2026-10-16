/**
 * Профиль: звание, рекорды, история прохождений.
 *
 * Данные приходят с сервера (задачи 37 и 38 по лабе 4, зона Володиной),
 * поэтому страница пока показывает состояние «нет сохранённых результатов».
 * Когда ручка появится, меняется только источник данных.
 */

import { Link } from 'react-router-dom';

import { PageEmpty } from '../components/PageState';
import { ROUTES } from '../routes';

export function ProfilePage() {
  return (
    <section className="page">
      <h1>Профиль</h1>

      <PageEmpty
        title="Сохранённых результатов пока нет"
        hint="Результаты начнут сохраняться после входа в аккаунт. Пройдите игру, чтобы увидеть здесь рекорды и историю."
        action={
          <Link to={ROUTES.games} className="primary primary--link">
            Выбрать игру
          </Link>
        }
      />
    </section>
  );
}
