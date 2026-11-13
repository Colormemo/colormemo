/**
 * Главная страница.
 *
 * Образцы цвета на странице не выдуманы: они берутся теми же функциями,
 * что и задания в играх, а процент точности считается настоящей формулой
 * из общего пакета. Поэтому при каждом открытии цвета разные, а пример
 * на странице всегда честный.
 */

import { useMemo } from 'react';
import { Link } from 'react-router-dom';

import { colorAccuracy, colorAtDeltaE, randomTargetColor } from '@colormemo/shared';

import { GAME_CATALOG, STATUS_LABELS } from '../features/games/catalog';
import { ROUTES, gamePath } from '../routes';
import './HomePage.css';

export function HomePage() {
  const sample = useMemo(() => {
    // Разница в 6,5 — примерно столько набирает человек, который
    // вспомнил цвет хорошо, но не идеально.
    const shown = randomTargetColor();
    const remembered = colorAtDeltaE(shown, 6.5);

    return {
      shown,
      remembered,
      accuracy: Math.round(colorAccuracy(shown, remembered)),
      // Обложки карточек: переход между двумя настоящими цветами заданий.
      covers: GAME_CATALOG.map(() => [randomTargetColor(), randomTargetColor()]),
    };
  }, []);

  return (
    <div className="home">
      <section className="hero">
        <h1 className="hero__title">
          Сколько цветов сможешь угадать <span className="hero__you">ты</span>?
        </h1>

        <p className="hero__text">
          Короткие задания на память и различение оттенков. Две минуты, результат в процентах, и
          видно, в какую сторону вы промахиваетесь.
        </p>

        <Link to={ROUTES.games} className="button">
          Начать игру
        </Link>
      </section>

      <section className="home__section">
        <h2 className="home__title">Игры</h2>

        <ul className="cards">
          {GAME_CATALOG.map((game, index) => {
            const available = game.status !== 'planned';
            const [from, to] = sample.covers[index];

            const body = (
              <>
                <div className="card__top">
                  <span className="card__name">{game.title}</span>
                  <span className={available ? 'badge' : 'badge badge--quiet'}>
                    {STATUS_LABELS[game.status]}
                  </span>
                </div>

                <p className="card__about">{game.description}</p>

                <div
                  className="card__thumb"
                  style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                />

                <span className="card__play">{available ? 'Играть' : 'Скоро'}</span>
              </>
            );

            return (
              <li key={game.slug}>
                {available ? (
                  <Link to={gamePath(game.slug)} className="card">
                    {body}
                  </Link>
                ) : (
                  <div className="card card--off">{body}</div>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="home__section">
        <h2 className="home__title">Точность считается так, как видит глаз</h2>

        <div className="explain">
          <div className="explain__row">
            <figure className="explain__item">
              <div className="explain__chip" style={{ background: sample.shown }} />
              <figcaption className="explain__label">показали</figcaption>
            </figure>

            <figure className="explain__item">
              <div className="explain__chip" style={{ background: sample.remembered }} />
              <figcaption className="explain__label">вы подобрали</figcaption>
            </figure>

            <div className="explain__item">
              <span className="explain__score">{sample.accuracy}%</span>
              <span className="explain__label">точность</span>
            </div>
          </div>

          <p className="explain__text">
            Разницу между цветами нельзя мерить по числам, которыми цвет записан в компьютере: у
            синих оттенков глаз почти не замечает того, что у жёлтых бросается в глаза. Поэтому
            цвета сравниваются по тому, насколько они различаются для человека, и промах на полтона
            всегда стоит одинаково — в любой части цветового круга.
          </p>
        </div>
      </section>
    </div>
  );
}
